import { Notice, setIcon, TFile } from 'obsidian'
import { IColumn, IType, TimeOptions } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'

export const renderKanbanColumns = (
	view: KanbanMoonlightView,
	notes: TFile[],
) => {
	const container = view.containerEl.querySelector(
		'.kanban-board',
	) as HTMLElement | null

	if (!container) return
	container.empty()

	view.plugin.settings.columns.forEach((columna) => {
		const columnNotes = notes
			.filter((note) => {
				const defaultId = view.plugin.settings.columns[0]?.id || 'pending'
				const state = (view.app.metadataCache.getFileCache(note)
					?.frontmatter?.[view.plugin.settings.propertyState] ||
					defaultId) as string

				return state.toLowerCase() === columna.id.toLowerCase() ||
				state.toLowerCase() === columna.title.toLowerCase()
			})
			.sort((a, b) => {
				const aDate = a.stat.mtime || a.stat.ctime
				const bDate = b.stat.mtime || b.stat.ctime

				if (!aDate || !bDate) return 0
				if (aDate === bDate) return 0

				return aDate && bDate
					? -(new Date(aDate).getTime() - new Date(bDate).getTime())
					: 0
			})

		createColumnElement(container, view, columna, columnNotes)
	})

	const completedColumn = view.plugin.settings.completedColumn

	const dateToday = new Date()
	const limitDate = dateToday

	switch (view.plugin.settings.completedColumn.limitDate) {
		case TimeOptions.month:
			limitDate.setMonth(dateToday.getMonth() - 1)
			break
		case TimeOptions.week:
			limitDate.setDate(dateToday.getDate() - 7)
			break
		case TimeOptions.year:
			limitDate.setFullYear(dateToday.getFullYear() - 1)
			break
		case TimeOptions.day:
		default:
			limitDate.setDate(dateToday.getDate() - 1)
			break
	}

	const completedNotes = notes
		.filter((note) => {
			const noteCache = view.app.metadataCache.getFileCache(note)
			const state =
				noteCache?.frontmatter?.[view.plugin.settings.propertyState] ||
				''

			const noteDate = new Date(note.stat.mtime || note.stat.ctime)
			return (state === completedColumn.id ||
				state === completedColumn.title) &&
				noteDate > limitDate
		})
		.sort((a, b) => {
			const aDate = a.stat.mtime || a.stat.ctime
			const bDate = b.stat.mtime || b.stat.ctime

			if (!aDate || !bDate) return 0
			if (aDate === bDate) return 0

			return aDate && bDate
				? -(new Date(aDate).getTime() - new Date(bDate).getTime())
				: 0
		})

	completedColumn.title = t('COLUMN_COMPLETED')
	createColumnElement(container, view, completedColumn, completedNotes)
}
const getContrastColor = (hexColor: string) => {
	// 1. Eliminar el '#' si existe
	const hex = hexColor.replace('#', '')

	// 2. Convertir de Hex a RGB
	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)

	// 3. Calcular la luminancia relativa (fórmula estándar)
	const yiq = (r * 299 + g * 587 + b * 114) / 1000

	// 4. Si es mayor a 128, es un color claro, por lo que usamos texto negro.
	// Si es menor o igual, es oscuro, usamos texto blanco.
	return yiq >= 128 ? '#000000' : '#ffffff'
}

/**
 * Crea un elemento de columna en el tablero Kanban.
 * @param container - El contenedor donde se agregará la columna.
 * @param view - La instancia de la vista KanbanMoonlightView.
 * @param columnSetting - La configuración de la columna (IColumn).
 * @param notes - Las notas que pertenecen a esta columna.
 */
const createColumnElement = (
	container: HTMLElement,
	view: KanbanMoonlightView,
	columnSetting: IColumn,
	notes: TFile[],
) => {
	const count = notes.length

	const columnEl = container.createEl('div', {
		cls: 'kanban-column',
	})
	columnEl.style.borderColor = columnSetting.color || '#ac46ff'

	columnEl.addEventListener('drop', async (event) => {
		event.preventDefault()
		const notePath = event.dataTransfer?.getData('text/plain')

		const note = view.app.vault.getAbstractFileByPath(
			notePath || '',
		) as TFile | null

		if (!note) {
			new Notice(t('NOTE_NOT_FOUND'), 3000)
			return
		}

		try {
			await view.app.fileManager.processFrontMatter(
				note,
				(frontmatter) => {
					const lastStateId =
						frontmatter[view.plugin.settings.propertyState] ||
						view.plugin.settings.columns[0]?.id || 'pending'
					const allColumns = [
						...view.plugin.settings.columns,
						view.plugin.settings.completedColumn,
					]
					const lastColumn = allColumns.find(
						(c) => c.id === lastStateId,
					)
					const lastStateTitle = lastColumn?.title || lastStateId

					if (lastStateId === columnSetting.id) return

					const date = new Date().toISOString().split('T')[0]
					const history = frontmatter.history || []

					history.push({
						state: columnSetting.title,
						stateId: columnSetting.id,
						date,
						from: lastStateTitle,
					})

					frontmatter.history = history
					frontmatter[view.plugin.settings.propertyState] =
						columnSetting.id

					const isCompleted =
						columnSetting.id ===
						view.plugin.settings.completedColumn.id
					new Notice(
						isCompleted
							? `${t('COMPLETE_NOTE')}`
							: `${t('MOVED_NOTE_TO')} "${columnSetting.title}"`,
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

	/*----------------------------------------------------------------------
		Empty
	----------------------------------------------------------------------*/
	if (count === 0) {
		columnEl.createEl('div', {
			text: t('EMPTY_COLUMN'),
			cls: 'kanban-column__empty-message',
		})

		return
	}

	/*----------------------------------------------------------------------
		Notes Rendering
	----------------------------------------------------------------------*/

	/* Types */

	const types: IType[] = [
		{ id: '-', name: '', color: columnSetting.color || '#696969' },
		...view.plugin.settings.types,
	]

	const typeProperty = view.plugin.settings.propertyType || 'type'

	notes.forEach((note) => {
		const noteCache = view.plugin.app.metadataCache.getFileCache(note)

		let noteTypeName = ''
		if (
			noteCache &&
			noteCache.frontmatter &&
			noteCache.frontmatter[typeProperty]
		) {
			noteTypeName = noteCache.frontmatter[typeProperty]
			noteTypeName = noteTypeName.toLowerCase()
		}

		const noteType =
			types.find(
				(type) => type.name.toLocaleLowerCase() === noteTypeName,
			) ?? types.first()

		const cardBorderColor = noteType?.color

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

		// Description

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

		if (noteType && noteType.name !== '') {
			const fontColor = getContrastColor(noteType.color)

			tagContainer.createEl('span', {
				text: noteType?.name,
				cls: 'kanban-card__tag',
				attr: {
					style: `background: ${noteType.color}; color: ${fontColor}; font-weight: normal !important;`,
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

		/*----------------------------------------------------------------------
		BUTTON TO COMPLETE NOTE
		----------------------------------------------------------------------*/

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
						state: columnSetting.title,
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
	})
}
