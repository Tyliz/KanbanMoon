import { Setting } from 'obsidian'
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
	containerEl.createEl('h3', { text: t('COLUMNS_TITLE') })

	plugin.settings.columns.forEach((column, index) => {
		const columnSetting = new Setting(containerEl)
		columnSetting.setClass('kanban-setting-section')

		columnSetting.addText((text) =>
			text.setValue(column.title).onChange(async (value: string) => {
				plugin.settings.columns[index]!.title = value
				await plugin.saveSettings()
			}),
		)

		columnSetting
			.addButton((button) => {
				button.setButtonText('')
				button.setIcon(plugin.settings.columns[index]!.icon)
				button.setTooltip(t('SELECT_ICON'))
				button.onClick(() => {
					new IconSuggestModal(plugin.app, (selectedIcon) => {
						plugin.settings.columns[index]!.icon = selectedIcon
						plugin.saveSettings()
						display() // Refresca la UI para mostrar el cambio
					}).open()
				})
			})
			.addColorPicker((colorPicker) =>
				colorPicker.setValue(column.color).onChange(async (value) => {
					plugin.settings.columns[index]!.color = value
					await plugin.saveSettings()
				}),
			)
			.addButton((btn) =>
				btn
					.setButtonText('')
					.setIcon('trash')
					.setTooltip(t('DELETE_BTN'))
					.setWarning()
					.onClick(async () => {
						plugin.settings.columns.splice(index, 1)
						await plugin.saveSettings()
						display() // Redibujar la pestaña de ajustes
					}),
			)

		if (index !== 0) {
			columnSetting.addExtraButton((btn) =>
				btn.setIcon('up-chevron-glyph').onClick(() => {
					moveArrayElement(plugin.settings.columns, index, index - 1)
					plugin.saveSettings()
					display()
				}),
			)
		} else {
			columnSetting.setClass('kanban-setting--one-button')
		}

		if (index !== plugin.settings.columns.length - 1) {
			columnSetting.addExtraButton((btn) =>
				btn.setIcon('down-chevron-glyph').onClick(() => {
					moveArrayElement(plugin.settings.columns, index, index + 1)
					plugin.saveSettings()
					display()
				}),
			)
		} else {
			columnSetting.setClass('kanban-setting--one-button')
		}
	})

	// Botón para AGREGAR una nueva columna al final
	new Setting(containerEl)
		.addButton((btn) =>
			btn
				.setButtonText(t('ADD_COLUMN_BTN'))
				.setCta()
				.onClick(async () => {
					const nuevoId = `col-${Date.now()}` // Genera un ID único basado en el tiempo
					plugin.settings.columns.push({
						id: nuevoId,
						icon: 'plus',
						title: t('NEW_COLUMN_PLACEHOLDER'),
						color: '#ffffff', // Color por defecto
					})
					await plugin.saveSettings()
					display() // Redibujar la pestaña de ajustes
				}),
		)
		.setClass('kanban-setting-section')
}
