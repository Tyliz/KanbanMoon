import { Setting, setIcon } from 'obsidian'
import KanbanMoonlightPlugin from '../../main'
import { t } from '../../lang/helpers'
import { IconSuggestModal } from './iconSuggestModal'
import { IColumn } from '../kanbanSettings'

const moveArrayElement = (
	items: IColumn[],
	index: number,
	newIndex: number,
) => {
	const [itemToMove] = items.splice(index, 1)

	if (!itemToMove) return

	items.splice(newIndex, 0, itemToMove)
}

export const renderColumnSettings = (
	plugin: KanbanMoonlightPlugin,
	containerEl: HTMLElement,
	display: () => void,
): void => {
	new Setting(containerEl).setName(t('COLUMNS_TITLE')).setHeading()

	const board = plugin.getActiveBoard()

	board.columns.forEach((column, index) => {
		const section = containerEl.createEl('div', {
			cls: 'kanban-setting-card',
		})

		const nameRow = section.createEl('div', { cls: 'kanban-card-row' })
		const nameInput = nameRow.createEl('input', {
			cls: 'kanban-card-input',
			attr: {
				type: 'text',
				value: column.title,
				placeholder: t('NEW_COLUMN_PLACEHOLDER'),
			},
		})
		nameInput.addEventListener('change', () => {
			board.columns[index]!.title = nameInput.value
			void plugin.saveSettings()
		})

		const actionsRow = section.createEl('div', { cls: 'kanban-card-row' })

		const iconBtn = actionsRow.createEl('button', {
			cls: 'kanban-card-icon-btn',
			attr: { title: t('SELECT_ICON') },
		})
		setIcon(iconBtn, board.columns[index]!.icon)
		iconBtn.addEventListener('click', () => {
			new IconSuggestModal(plugin.app, (selectedIcon) => {
				board.columns[index]!.icon = selectedIcon
				void plugin.saveSettings()
				display()
			}).open()
		})

		const colorPicker = actionsRow.createEl('input', {
			cls: 'kanban-card-color',
			attr: { type: 'color', value: column.color },
		})
		colorPicker.addEventListener('input', () => {
			board.columns[index]!.color = colorPicker.value
			void plugin.saveSettings()
		})

		actionsRow.createEl('span', { cls: 'kanban-card-spacer' })

		if (index !== 0) {
			const upBtn = actionsRow.createEl('button', {
				cls: 'kanban-card-action-btn',
				attr: { title: 'Move up' },
			})
			setIcon(upBtn, 'up-chevron-glyph')
			upBtn.addEventListener('click', () => {
				moveArrayElement(board.columns, index, index - 1)
				void plugin.saveSettings()
				display()
			})
		}

		if (index !== board.columns.length - 1) {
			const downBtn = actionsRow.createEl('button', {
				cls: 'kanban-card-action-btn',
				attr: { title: 'Move down' },
			})
			setIcon(downBtn, 'down-chevron-glyph')
			downBtn.addEventListener('click', () => {
				moveArrayElement(board.columns, index, index + 1)
				void plugin.saveSettings()
				display()
			})
		}

		const deleteBtn = actionsRow.createEl('button', {
			cls: 'kanban-card-action-btn kanban-card-action-btn--danger',
			attr: { title: t('DELETE_BTN') },
		})
		setIcon(deleteBtn, 'trash')
		deleteBtn.addEventListener('click', () => {
			board.columns.splice(index, 1)
			void plugin.saveSettings()
			display()
		})
	})

	new Setting(containerEl)
		.addButton((btn) =>
			btn
				.setButtonText(t('ADD_COLUMN_BTN'))
				.setCta()
				.onClick(() => {
					const nuevoId = `col-${Date.now()}`
					board.columns.push({
						id: nuevoId,
						icon: 'plus',
						title: t('NEW_COLUMN_PLACEHOLDER'),
						color: '#ffffff',
					})
					void plugin.saveSettings()
					display()
				}),
		)
}
