import { Notice, TFile } from 'obsidian'
import { IColumn } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'
import { getFmString, getFmRecordArray } from '../../utils/frontmatter'

export const setupColumnDragDrop = (
	columnEl: HTMLElement,
	view: KanbanMoonlightView,
	columnSetting: IColumn,
) => {
	columnEl.addEventListener('drop', (event) => {
		void (async () => {
			event.preventDefault()
			const notePath = event.dataTransfer?.getData('text/plain')

			const note = view.app.vault.getAbstractFileByPath(
				notePath || '',
			) as TFile | null

			if (!note) {
				new Notice(t('NOTE_NOT_FOUND'), 3000)
				return
			}

			const draggedCard = view.containerEl.querySelector(
				`[data-path="${note.path}"]`,
			)

			if (draggedCard) {
				const sourceColumn = draggedCard.closest(
					'.kanban-column',
				)

				const sourceCounter = sourceColumn?.querySelector(
					'.kanban-column__color-indicator',
				)
				const sourceCount = parseInt(sourceCounter?.textContent || '0')

				const targetCounter = columnEl.querySelector(
					'.kanban-column__color-indicator',
				)
				const targetCount = parseInt(targetCounter?.textContent || '0')

				if (sourceCounter)
					sourceCounter.textContent = String(Math.max(0, sourceCount - 1))
				if (targetCounter)
					targetCounter.textContent = String(targetCount + 1)

				columnEl.appendChild(draggedCard)

				if (sourceCount - 1 === 0 && sourceColumn) {
					const emptyMsg = sourceColumn.querySelector(
						'.kanban-column__empty-message',
					)
					if (!emptyMsg) {
						sourceColumn.createEl('div', {
							text: t('EMPTY_COLUMN'),
							cls: 'kanban-column__empty-message',
						})
					}
				}

				const emptyMsg = columnEl.querySelector(
					'.kanban-column__empty-message',
				)
				if (emptyMsg) emptyMsg.remove()
			}

			try {
				await view.app.fileManager.processFrontMatter(
					note,
					(frontmatter) => {
						const fm = frontmatter as Record<string, unknown>
						const lastStateId =
							getFmString(fm, view.plugin.settings.propertyState) ||
							view.plugin.settings.columns[0]?.id ||
							'backlog'
						const allColumns = [
							...view.plugin.settings.columns,
							view.plugin.settings.completedColumn,
						]
						const lastColumn = allColumns.find(
							(c) => c.id === lastStateId,
						)
						const lastStateTitle = lastColumn?.title || lastStateId

						if (lastStateId === columnSetting.id) return

						const date = new Date().toISOString().split('T')[0]!
						const history = getFmRecordArray(fm, 'history')

						history.push({
							state: columnSetting.title,
							stateId: columnSetting.id,
							date,
							from: lastStateTitle,
						})

						fm['history'] = history
						fm[view.plugin.settings.propertyState] =
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
			} catch {
				new Notice(t('NOTE_NOT_FOUND'), 3000)
			}

			columnEl.classList.remove('kanban-column--drag-over')
		})()
	})

	columnEl.addEventListener('dragover', (event) => {
		event.preventDefault()
		columnEl.classList.add('kanban-column--drag-over')
	})

	columnEl.addEventListener('dragleave', () => {
		columnEl.classList.remove('kanban-column--drag-over')
	})
}
