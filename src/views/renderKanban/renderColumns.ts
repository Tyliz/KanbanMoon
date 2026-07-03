import { TFile } from 'obsidian'
import { TimeOptions } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'
import { createColumnElement } from './column'
import { sortByMtime } from './utils'

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
			.sort(sortByMtime)

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
		.sort(sortByMtime)

	completedColumn.title = t('COLUMN_COMPLETED')
	createColumnElement(container, view, completedColumn, completedNotes)
}
