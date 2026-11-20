import { setIcon, TFile } from 'obsidian'
import { IColumn, ICategory, IPriority } from '../../settings/kanbanSettings'
import { t } from '../../lang/helpers'
import { KanbanMoonlightView } from '../kanbanView'
import { setupColumnDragDrop } from './dragDrop'
import { createCardElement } from './card'
import { getContrastColor } from './utils'

export const createColumnElement = (
	container: HTMLElement,
	view: KanbanMoonlightView,
	columnSetting: IColumn,
	notes: TFile[],
) => {
	const columnEl = container.createDiv({
		cls: 'kanban-column',
	})
	columnEl.style.setProperty(
		'--column-color',
		columnSetting.color || '#ac46ff',
	)

	setupColumnDragDrop(columnEl, view, columnSetting)

	const headerEl = columnEl.createDiv({
		cls: 'kanban-column__header',
	})

	const headerLink = headerEl.createEl('a', {
		cls: 'kanban-column__header-link',
		attr: {
			href: '#',
		},
	})

	const iconEl = headerLink.createSpan({
		cls: `kanban-column__icon`,
	})

	setIcon(iconEl, `${columnSetting.icon.toLowerCase()}`)

	iconEl.style.color = columnSetting.color || '#ac46ff'

	headerLink.createEl('h4', {
		cls: 'kanban-column__title',
		text: `${columnSetting.title}`,
	})

	const columnColor = columnSetting.color || '#ac46ff'

	headerEl.createSpan({
		text: `${notes.length}`,
		cls: 'kanban-column__color-indicator',
		attr: {
			style: `background-color: ${columnColor}; color: ${getContrastColor(columnColor)}`,
		},
	})

	if (notes.length === 0) {
		columnEl.createDiv({
			text: t('EMPTY_COLUMN'),
			cls: 'kanban-column__empty-message',
		})
		return
	}

	const categories: ICategory[] = [
		{
			id: '-',
			name: '',
			color: columnSetting.color || '#696969',
			icon: 'tag',
		},
		...view.plugin.getActiveBoard().categories,
	]

	const priorities: IPriority[] = view.plugin.getActiveBoard().priorities

	notes.forEach((note) => {
		createCardElement(columnEl, view, note, columnSetting, categories, priorities)
	})
}
