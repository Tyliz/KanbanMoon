import { Setting } from 'obsidian'
import type KanbanMoonlight from '../../main'
import { t } from '../../lang/helpers'
import { ICategory } from '../kanbanSettings'

export const renderCategorySettings = (
	plugin: KanbanMoonlight,
	containerEl: HTMLElement,
	display: () => void,
): void => {
	containerEl.createEl('h2', { text: t('CATEGORIES_TITLE') })

	plugin.settings.categories.forEach((category, index) => {
		const categorySetting = new Setting(containerEl)
		categorySetting.setClass('kanban-setting-section')

		categorySetting.addText((text) =>
			text.setValue(category.name).onChange(async (value: string) => {
				plugin.settings.categories[index]!.name = value
				await plugin.saveSettings()
			}),
		)

		categorySetting
			.addColorPicker((colorPicker) =>
				colorPicker.setValue(category.color).onChange(async (value) => {
					plugin.settings.categories[index]!.color = value
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
						plugin.settings.categories.splice(index, 1)
						await plugin.saveSettings()
						display()
					}),
			)
	})

	new Setting(containerEl)
		.addButton((btn) =>
			btn
				.setButtonText(t('ADD_CATEGORY_BTN'))
				.setCta()
				.onClick(async () => {
					const nuevoId = `cat-${Date.now()}`
					plugin.settings.categories.push({
						id: nuevoId,
						name: t('NEW_CATEGORY_PLACEHOLDER'),
						color: '#ffffff',
					})
					await plugin.saveSettings()
					display()
				}),
		)
		.setClass('kanban-setting-section')
}
