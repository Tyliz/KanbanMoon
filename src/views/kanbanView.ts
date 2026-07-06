import { ItemView, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlight from '../main'
import { renderKanbanColumns } from './renderKanban/renderColumns'
import { normalizeTag } from './renderKanban/utils'
import { CreateTaskModal } from '../ui/createTaskModal'
import { toSafeFm, getFmStringArray, getFmString } from '../utils/frontmatter'

export const VIEW_TYPE_KANBAN = 'kanban-moonlight-view'

export class KanbanMoonlightView extends ItemView {
	plugin: KanbanMoonlight

	constructor(leaf: WorkspaceLeaf, plugin: KanbanMoonlight) {
		super(leaf)
		this.plugin = plugin
	}

	getViewType() {
		return VIEW_TYPE_KANBAN
	}

	getDisplayText() {
		return t('VIEW_TITLE')
	}

	getIcon() {
		return 'lucide-kanban'
	}

	async onOpen() {
		const container = this.contentEl
		container.empty()

		const board = this.plugin.getActiveBoard()
		const tag = board.tagNotes
		const folder = board.folderNotes
		const filters = [tag, folder].filter(Boolean).join(', ')
		container.createEl('h3', {
			text: t('FILTER_NOTICE') + ` ${filters}`,
		})

		this.drawKanbanBoard()
	}

	drawKanbanBoard = () => {
		const container = this.contentEl
		container.empty()

		const mainContainer = container.createEl('div', {
			cls: 'main-kanban-container',
		})

		const searchContainer = mainContainer.createEl('div', {
			cls: 'kanban-container-search',
		})

		const searchInput = searchContainer.createEl('input', {
			cls: 'kanban-search-input',
			attr: {
				type: 'text',
				placeholder: t('SEARCH_PLACEHOLDER'),
			},
		})

		const newTaskBtn = searchContainer.createEl('button', {
			cls: 'kanban-new-task-btn',
		})
		setIcon(newTaskBtn, 'plus')
		newTaskBtn.createEl('span', {
			text: t('CREATE_TASK_BTN'),
		})
		newTaskBtn.addEventListener('click', () => {
			new CreateTaskModal(this.app, this.plugin).open()
		})

		const board = this.plugin.getActiveBoard()
		const tagNotes = board.tagNotes
		const folderNotes = board.folderNotes
		const allNotes = this.app.vault.getMarkdownFiles()

		const notesWithTag = allNotes.filter((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			const fm = toSafeFm(cache)
			const hasTag = getFmStringArray(fm, 'tags').some((tag) =>
				normalizeTag(tag).startsWith(normalizeTag(tagNotes)),
			)
			const normalizedFolder = folderNotes
				? folderNotes.replace(/^\/+/, '').replace(/\/?$/, '/')
				: ''
			const inFolder =
				normalizedFolder && note.path.startsWith(normalizedFolder)
			return hasTag || inFolder
		})

		searchInput.addEventListener('input', (event) => {
			const searchTerm = (
				event.target as HTMLInputElement
			).value.toLowerCase()

			if (this.debounceTimer) {
				window.clearTimeout(this.debounceTimer)
			}

			this.debounceTimer = window.setTimeout(() => {
				void this.filterKanbanBoard(notesWithTag, searchTerm)
			}, 300)
		})

		mainContainer.createEl('div', {
			cls: 'kanban-board',
		})

		renderKanbanColumns(this, notesWithTag)
	}

	filterKanbanBoard = async (allNotes: TFile[], searchTerm: string) => {
		const board = this.plugin.getActiveBoard()
		const tagNotes = board.tagNotes
		const folderNotes = board.folderNotes
		const normalizedFolder = folderNotes
			? folderNotes.replace(/^\/+/, '').replace(/\/?$/, '/')
			: ''

		const filteredNotes = allNotes.filter((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			const fm = toSafeFm(cache)

			const normalizedSearch = normalizeTag(tagNotes).toLowerCase()
			const hasTag = getFmStringArray(fm, 'tags').some((tag) =>
				normalizeTag(tag).toLowerCase().includes(normalizedSearch),
			)
			const inFolder =
				normalizedFolder && note.path.startsWith(normalizedFolder)
			const isProjectNote = hasTag || inFolder
			if (!isProjectNote) return false
			if (!searchTerm) return true

			const title = note.basename.toLowerCase()
			const description = getFmString(
				fm,
				board.propertyDescription || 'description',
			)
			const category = getFmString(
				fm,
				board.propertyCategory || 'category',
			)

			const tags = getFmStringArray(fm, 'tags').map((t) =>
				t.toLowerCase(),
			)

			return (
				title.includes(searchTerm) ||
				description.toLowerCase().includes(searchTerm) ||
				category.toLowerCase().includes(searchTerm) ||
				tags.some((tag: string) =>
					tag.toLowerCase().includes(searchTerm),
				)
			)
		})

		renderKanbanColumns(this, filteredNotes)
	}

	debounceTimer: number | null = null
}
