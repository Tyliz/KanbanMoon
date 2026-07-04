import { Notice, setIcon, TFile } from 'obsidian'
import { IColumn, ICategory } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'
import { getContrastColor, normalizeTag } from './utils'
import { DeleteConfirmModal } from '../../ui/deleteConfirmModal'
import { toSafeFm, getFmString, getFmStringArray, getFmRecordArray } from '../../utils/frontmatter'

export const createCardElement = (
	columnEl: HTMLElement,
	view: KanbanMoonlightView,
	note: TFile,
	columnSetting: IColumn,
	categories: ICategory[],
) => {
	const noteCache = view.plugin.app.metadataCache.getFileCache(note)
	const fm = toSafeFm(noteCache)

	let noteCategoryName = ''
	if (fm) {
		const rawCategory = fm[view.plugin.settings.propertyCategory || 'category']
		if (typeof rawCategory === 'string') {
			noteCategoryName = rawCategory.toLowerCase()
		}
	}

	const noteCategory =
		categories.find(
			(category) =>
				category.name.toLocaleLowerCase() === noteCategoryName,
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

	cardTitleEl.addEventListener('click', () => {
		void (async () => {
			const leaf = view.plugin.app.workspace.getLeaf(true)
			await leaf.openFile(note)
		})()
	})

	const description = getFmString(
		fm,
		view.plugin.settings.propertyDescription,
	)

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

	const tags = getFmStringArray(fm, 'tags')
	const tagsNotes = tags
	const normalizedProjectTag = normalizeTag(view.plugin.settings.tagNotes)
	const relevantTags = tagsNotes.filter(
		(tag: string) => normalizeTag(tag) !== normalizedProjectTag,
	)

	if (noteCategory && noteCategory.name !== '') {
		const fontColor = getContrastColor(noteCategory.color)

		const categoryTag = tagContainer.createEl('span', {
			cls: 'kanban-card__tag',
			attr: {
				style: `background: ${noteCategory.color}; color: ${fontColor}; font-weight: normal !important;`,
			},
		})

		const iconEl = categoryTag.createEl('span', {
			cls: 'kanban-card__tag-icon',
		})
		setIcon(iconEl, noteCategory.icon || 'tag')

		categoryTag.createEl('span', {
			text: noteCategory.name,
		})
	}

	relevantTags.slice(0, 2).forEach((tag: string) => {
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

	const btnFooter = cardEl.createEl('div', {
		cls: 'kanban-card__footer',
	})

	const isCompleted =
		noteCache &&
		noteCache.frontmatter &&
		noteCache.frontmatter[view.plugin.settings.propertyState] ===
			view.plugin.settings.completedColumn.id

	if (!isCompleted) {
		const btnComplete = btnFooter.createEl('button', {
			cls: 'btn-complete',
		})

		setIcon(
			btnComplete,
			view.plugin.settings.completedColumn.icon || 'check',
		)

		btnComplete.createEl('span', {
			text: t('COMPLETE_NOTE'),
		})

		btnComplete.addEventListener('click', () => {
			void (async () => {
				const file = view.app.vault.getFileByPath(note.path)

				if (!file) {
					new Notice(t('NOTE_NOT_FOUND'))
					return
				}

				await view.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					const fm = frontmatter as Record<string, unknown>
					const today = new Date().toISOString().split('T')[0]!
					const history = getFmRecordArray(fm, 'history')

					history.push({
						state: t('COLUMN_COMPLETED'),
						stateId: view.plugin.settings.completedColumn.id,
						date: today,
						from: columnSetting.title,
					})

					fm['history'] = history

					fm[view.plugin.settings.propertyState ?? 'state'] =
						view.plugin.settings.completedColumn.id

					new Notice(t('NOTICE_COMPLETED'))
				},
			)
			})()
		})
	}

	const btnDelete = btnFooter.createEl('button', {
		cls: 'btn-delete',
	})

	setIcon(btnDelete, 'trash-2')

	btnDelete.createEl('span', {
		text: t('DELETE_BTN'),
	})

	btnDelete.addEventListener('click', () => {
		const file = view.app.vault.getFileByPath(note.path)

		if (!file) {
			new Notice(t('NOTE_NOT_FOUND'))
			return
		}

		new DeleteConfirmModal(view.app, view.plugin, file).open()
	})
}
