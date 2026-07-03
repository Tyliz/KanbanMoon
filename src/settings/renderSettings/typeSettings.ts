import { Setting } from 'obsidian'
import type KanbanMoonlight from '../../main'
import { t } from '../../lang/helpers'
import { IType } from '../kanbanSettings'

export const renderTypeSettings = (
	plugin: KanbanMoonlight,
	containerEl: HTMLElement,
	display: () => void,
): void => {
	containerEl.createEl('h2', { text: t('TYPES_TITLE') })

	plugin.settings.types.forEach((type, index) => {
		const typeSetting = new Setting(containerEl)
		typeSetting.setClass('kanban-setting-section')

		typeSetting.addText((text) =>
			text.setValue(type.name).onChange(async (value: string) => {
				plugin.settings.types[index]!.name = value
				await plugin.saveSettings()
			}),
		)

		typeSetting
			.addColorPicker((colorPicker) =>
				colorPicker.setValue(type.color).onChange(async (value) => {
					plugin.settings.types[index]!.color = value
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
						plugin.settings.types.splice(index, 1)
						await plugin.saveSettings()
						display() // Redibujar la pestaña de ajustes
					}),
			)
	})

	new Setting(containerEl)
		.addButton((btn) =>
			btn
				.setButtonText(t('ADD_TYPE_BTN'))
				.setCta()
				.onClick(async () => {
					const nuevoId = `type-${Date.now()}` // Genera un ID único basado en el tiempo
					plugin.settings.types.push({
						id: nuevoId,
						name: t('NEW_TYPE_PLACEHOLDER'),
						color: '#ffffff', // Color por defecto
					})
					await plugin.saveSettings()
					display() // Redibujar la pestaña de ajustes
				}),
		)
		.setClass('kanban-setting-section')
}
