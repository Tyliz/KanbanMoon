import { Notice, setIcon, TFile } from 'obsidian'
import { IColumn, ICategory } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'
import { getContrastColor } from './utils'

export const createCardElement = (
	columnEl: HTMLElement,
	view: KanbanMoonlightView,
	note: TFile,
	columnSetting: IColumn,
	categories: ICategory[],
) => {
	const noteCache = view.plugin.app.metadataCache.getFileCache(note)

	let noteCategoryName = ''
	if (
		noteCache &&
		noteCache.frontmatter &&
		noteCache.frontmatter[view.plugin.settings.propertyCategory || 'category']
	) {
		noteCategoryName = noteCache.frontmatter[
			view.plugin.settings.propertyCategory || 'category'
		].toLowerCase()
	}

	const noteCategory =
		categories.find(
			(category) => category.name.toLocaleLowerCase() === noteCategoryName,
		) ?? categories.first()

	const cardBorderColor = noteCategory?.color

	const cardEl = columnEl.createEl('div', {
		cls: 'kanban-card',
		attr: {
			style: `border-left-color: ${cardBorderColor};`,
			draggable: 'true',
			'data-path': note.path,
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

	const noteTitle = note.basename

	const cardTitleEl = cardHeaderEl.createEl('a', {
		text: noteTitle,
		cls: 'kanban-card__title internal-link',
	})
	const cleanPath = note.path.replace(/\.md$/, '')
	cardTitleEl.setAttribute('data-href', cleanPath)
	cardTitleEl.setAttribute('href', cleanPath)

	cardTitleEl.addEventListener('click', async () => {
		const leaf = view.plugin.app.workspace.getLeaf(true)
		await leaf.openFile(note)
	})

	const description =
		noteCache?.frontmatter?.[
			view.plugin.settings.propertyDescription
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
			tag !== `#${view.plugin.settings.tagNotes.replace('#', '')}`,
	)

	if (noteCategory && noteCategory.name !== '') {
		const fontColor = getContrastColor(noteCategory.color)

		tagContainer.createEl('span', {
			text: noteCategory?.name,
			cls: 'kanban-card__tag',
			attr: {
				style: `background: ${noteCategory.color}; color: ${fontColor}; font-weight: normal !important;`,
			},
		})
	}

	relevantTags.slice(0, 2).forEach((tag: any) => {
		tagContainer.createEl('span', {
			text: tag,
			cls: 'kanban-card__tag',
		})
	})

	const noteDate = note.stat?.mtime || note.stat?.ctime

	const dd = String(new Date(noteDate).getDate()).padStart(2, '0')
	const MM = String(new Date(noteDate).getMonth() + 1).padStart(2, '0')

	const dateEl = tagContainer.createEl('span', {
		text: `${dd}/${MM}`,
		cls: 'kanban-card__date',
	})

	const dateIconEl = dateEl.createEl('i', {
		cls: 'kanban-card__date-icon',
	})
	setIcon(dateIconEl, 'calendar')

	if (
		noteCache &&
		noteCache.frontmatter &&
		noteCache.frontmatter[view.plugin.settings.propertyState] ===
			view.plugin.settings.completedColumn.id
	)
		return

	const btnComplete = cardEl.createEl('button', {
		cls: 'btn-complete',
	})

	setIcon(btnComplete, 'check')

	btnComplete.createEl('span', {
		text: t('COMPLETE_NOTE'),
	})

	btnComplete.addEventListener('click', async () => {
		const file = view.app.vault.getFileByPath(note.path)

		if (!file) {
			new Notice(t('NOTE_NOT_FOUND'))
			return
		}

		await view.app.fileManager.processFrontMatter(
			file,
			(frontmatter) => {
				const today = new Date().toISOString().split('T')[0]
				const history = frontmatter['history'] || []

				history.push({
					state: t('COLUMN_COMPLETED'),
					stateId: view.plugin.settings.completedColumn.id,
					date: today,
					from: columnSetting.title,
				})

				frontmatter['history'] = history

				frontmatter[view.plugin.settings.propertyState ?? 'state'] =
					view.plugin.settings.completedColumn.id

				new Notice(t('NOTICE_COMPLETED'))
			},
		)
	})
}
