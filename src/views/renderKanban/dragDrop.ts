import { Notice, TFile } from 'obsidian'
import { IColumn } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'

export const setupColumnDragDrop = (
	columnEl: HTMLElement,
	view: KanbanMoonlightView,
	columnSetting: IColumn,
) => {
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
}
