import { TFile } from 'obsidian'
import { TimeOptions } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'
import { createColumnElement } from './column'
import { sortByMtime } from './utils'
import { toSafeFm, getFmString } from '../../utils/frontmatter'

export const renderKanbanColumns = (
	view: KanbanMoonlightView,
	notes: TFile[],
) => {
	const container = view.containerEl.querySelector('.kanban-board')

	if (!container) return
	container.empty()

	const board = view.plugin.getActiveBoard()

	board.columns.forEach((columna) => {
		const columnNotes = notes
			.filter((note) => {
				const defaultId =
					board.columns[0]?.id || 'backlog'
				const fm = toSafeFm(view.app.metadataCache.getFileCache(note))
				const state = getFmString(
					fm,
					board.propertyState,
					defaultId,
				)

				return (
					state.toLowerCase() === columna.id.toLowerCase() ||
					state.toLowerCase() === columna.title.toLowerCase()
				)
			})
			.sort(sortByMtime)

		createColumnElement(
			container as HTMLElement,
			view,
			columna,
			columnNotes,
		)
	})

	const completedColumn = board.completedColumn

	const dateToday = new Date()
	const limitDate = dateToday

	switch (board.completedColumn.limitDate) {
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
			const fm = toSafeFm(view.app.metadataCache.getFileCache(note))
			const state = getFmString(fm, board.propertyState)

			const noteDate = new Date(note.stat.mtime || note.stat.ctime)
			return (
				(state === completedColumn.id ||
					state === completedColumn.title) &&
				noteDate > limitDate
			)
		})
		.sort(sortByMtime)

	completedColumn.title = t('COLUMN_COMPLETED')
	createColumnElement(
		container as HTMLElement,
		view,
		completedColumn,
		completedNotes,
	)
}
