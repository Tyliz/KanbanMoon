import { ItemView, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import { t } from '../lang/helpers' // Importamos la función de traducción
import type KanbanMoonlight from '../main'
import { renderKanbanColumns } from './renderKanban/renderColumns'

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

		// ¡Aquí usas tus configuraciones!
		const tag = this.plugin.settings.tagNotes
		container.createEl('h3', { text: t('FILTER_NOTICE') + ` ${tag}` })

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

		const tagNotes = this.plugin.settings.tagNotes
		const allNotes = this.app.vault.getMarkdownFiles()

		const notesWithTag = allNotes.filter((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			if (!cache || !cache.frontmatter?.tags) return false

			return cache.frontmatter?.tags.some((tag: string) =>
				tag.startsWith(`#${tagNotes.replace('#', '')}`),
			)
		})

		searchInput.addEventListener('input', (event) => {
			const searchTerm = (
				event.target as HTMLInputElement
			).value.toLowerCase()
			this.filterKanbanBoard(notesWithTag, searchTerm)
		})

		let debounceTimer: number | null = null
		searchInput.addEventListener('input', (event) => {
			const searchTerm = (
				event.target as HTMLInputElement
			).value.toLowerCase()

			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}

			debounceTimer = window.setTimeout(() => {
				this.filterKanbanBoard(notesWithTag, searchTerm)
			}, 300)
		})

		mainContainer.createEl('div', {
			cls: 'kanban-board',
		})

		renderKanbanColumns(this, notesWithTag)
	}

	filterKanbanBoard = async (allNotes: TFile[], searchTerm: string) => {
		const filteredNotes = allNotes.filter((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			if (!cache) return false
			if (!cache.frontmatter) return false

			const title = note.basename.toLowerCase()
			const content = (cache.frontmatter[
				this.plugin.settings.propertyDescription || 'description'
			] || '') as string
			const type = (cache.frontmatter[
				this.plugin.settings.propertyType || 'type'
			] || '') as string

			const tags = cache.frontmatter?.tags
				? cache.frontmatter.tags.map((tag: string) => tag.toLowerCase())
				: []

			if (!searchTerm)
				return tags.some((tag: string) =>
					tag.includes(this.plugin.settings.tagNotes.toLowerCase()),
				)

			return (
				tags.some((tag: string) =>
					tag.includes(this.plugin.settings.tagNotes.toLowerCase()),
				) &&
				(title.includes(searchTerm) ||
					content.toLowerCase().includes(searchTerm) ||
					type.toLowerCase().includes(searchTerm) ||
					tags.some((tag: string) =>
						tag.toLowerCase().includes(searchTerm),
					))
			)
		})

		renderKanbanColumns(this, filteredNotes)
	}

	debounceTimer: number | null = null
}
