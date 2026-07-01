import { ItemView, Notice, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import { t } from '../lang/helpers' // Importamos la función de traducción
import type KanbanMoonlight from '../main'
import { Column } from '../settings/kanbanSettings'

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

		this.renderKanbanColumns(notesWithTag)
	}

	filterKanbanBoard = async (allNotes: any[], searchTerm: string) => {
		const filteredNotes = allNotes.filter((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			if (!cache) return false

			const title = note.basename.toLowerCase()
			const content = cache.frontmatter?.content?.toLowerCase() || ''
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
					content.includes(searchTerm) ||
					tags.some((tag: string) => tag.includes(searchTerm)))
			)
		})

		this.renderKanbanColumns(filteredNotes)
	}

	debounceTimer: number | null = null

	createColumnElement = (
		container: HTMLElement,
		columnSetting: Column,
		notes: any[],
	) => {
		notes = notes.sort((a, b) => {
			const aDate =
				this.app.metadataCache.getFileCache(a)?.frontmatter?.modified
			const bDate =
				this.app.metadataCache.getFileCache(b)?.frontmatter?.modified

			if (!aDate || !bDate) return 0
			if (aDate === bDate) return 0

			return aDate && bDate
				? new Date(aDate).getTime() - new Date(bDate).getTime()
				: 0
		})

		const count = notes.length

		const columnEl = container.createEl('div', {
			cls: 'kanban-column',
		})
		columnEl.style.borderColor = columnSetting.color || '#ac46ff'

		columnEl.addEventListener('drop', async (event) => {
			event.preventDefault()
			const notePath = event.dataTransfer?.getData('text/plain')

			const note = this.app.vault.getAbstractFileByPath(
				notePath || '',
			) as TFile | null

			if (!note) {
				new Notice(t('NOTE_NOT_FOUND'), 3000)
				return
			}

			try {
				await this.app.fileManager.processFrontMatter(
					note,
					(frontmatter) => {
						const lastState =
							frontmatter[this.plugin.settings.propertyState] ||
							'Pending'

						if (lastState === columnSetting.title) return

						const date = new Date().toISOString().split('T')[0]

						frontmatter[this.plugin.settings.propertyState] =
							columnSetting.title

						let history = frontmatter.history || []
						history.push({
							state: columnSetting.title,
							date,
							from: lastState,
						})

						frontmatter.history = history

						new Notice(
							`${t('MOVED_NOTE_TO')} "${columnSetting.title}"`,
							3000,
						)
					},
				)
			} catch (error) {
				new Notice(t('NOTE_NOT_FOUND'), 3000)
			}

			columnEl.classList.remove('kanban-column--drag-over')
		})

		columnEl.addEventListener('dragover', (event) => {
			event.preventDefault()
			columnEl.classList.add('kanban-column--drag-over')
		})
		columnEl.addEventListener('dragleave', () => {
			columnEl.classList.remove('kanban-column--drag-over')
		})

		const headerEl = columnEl.createEl('div', {
			cls: 'kanban-column__header',
		})

		const headerLink = headerEl.createEl('a', {
			cls: 'kanban-column__header-link',
			attr: {
				href: '#',
			},
		})

		const iconEl = headerLink.createEl('span', {
			cls: `kanban-column__icon`,
		})

		setIcon(iconEl, `${columnSetting.icon.toLowerCase()}`)

		iconEl.style.color = columnSetting.color || '#ac46ff'

		headerLink.createEl('h4', {
			cls: 'kanban-column__title',
			text: `${columnSetting.title}`,
		})

		headerEl.createEl('span', {
			text: `${count}`,
			cls: 'kanban-column__color-indicator',
			attr: {
				style: `background-color: ${columnSetting.color || '#ac46ff'}`,
			},
		})

		notes.forEach((note) => {
			const cardBorderColor = columnSetting.color || '#ac46ff'

			const cardEl = columnEl.createEl('div', {
				cls: 'kanban-card',
				attr: {
					style: `border-left-color: ${cardBorderColor};`,
					draggable: 'true',
				},
			})

			cardEl.addEventListener('dragstart', (event) => {
				event.dataTransfer?.setData('text/plain', note.path)
				cardEl.classList.add('kanban-card--dragging')
			})

			cardEl.addEventListener('dragend', () => {
				cardEl.classList.remove('kanban-card--dragging')
			})

			const cardHeaderEl = cardEl.createEl('div', {
				cls: 'kanban-card__header',
			})

			// const btnCopy = cardHeaderEl.createEl('button', {
			// 	cls: 'btn-copy',
			// 	attr: {
			// 		title: t('COPY_NOTE'),
			// 	},
			// })

			const noteTitle = note.basename

			const cardTitleEl = cardHeaderEl.createEl('h5', {
				text: noteTitle,
				cls: 'kanban-card__title',
			})

			cardTitleEl.addEventListener('click', async () => {
				const leaf = this.app.workspace.getLeaf(true)
				await leaf.openFile(note)
			})

			// Description

			const noteCache = this.app.metadataCache.getFileCache(note)

			const description =
				noteCache?.frontmatter?.[
					this.plugin.settings.propertyDescription
				] || ''

			const descriptionShorted =
				description.length > 55
					? description.substring(0, 55) + '...'
					: description

			cardEl.createEl('div', {
				text: descriptionShorted,
				cls: 'kanban-card__description',
			})

			const tagContainer = cardEl.createEl('div', {
				cls: 'kanban-card__tag-container',
			})

			const tags = noteCache?.frontmatter?.tags
			const tagsNotes = Array.isArray(tags) ? tags : tags ? [tags] : []
			const relevantTags = tagsNotes.filter(
				(tag: string) =>
					tag !==
					`#${this.plugin.settings.tagNotes.replace('#', '')}`,
			)

			relevantTags.slice(0, 2).forEach((tag: any) => {
				tagContainer.createEl('span', {
					text: tag,
					cls: 'kanban-card__tag',
				})
			})
		})
	}

	renderKanbanColumns = (notes: any[]) => {
		const container =
			this.contentEl.querySelector<HTMLElement>('.kanban-board')
		if (!container) return
		container.empty()

		this.plugin.settings.columns.forEach((columna) => {
			const columnNotes = notes.filter((note) => {
				const state =
					this.app.metadataCache.getFileCache(note)?.frontmatter?.[
						this.plugin.settings.propertyState
					] || 'Pending'
				return state === columna.title
			})

			this.createColumnElement(container, columna, columnNotes)
		})
	}
}
