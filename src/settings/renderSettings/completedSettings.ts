import { Setting } from 'obsidian'
import { t } from '../../lang/helpers'
import KanbanMoonlightPlugin from '../../main'
import { IconSuggestModal } from './iconSuggestModal'
import { TimeOptions } from '../kanbanSettings'

export const renderCompletedSettings = (
	plugin: KanbanMoonlightPlugin,
	containerEl: HTMLElement,
	display: () => void,
): void => {
	containerEl.createEl('h3', { text: t('COMPLETED_SETTINGS_TITLE') })

	const columnSettingStyle = new Setting(containerEl)
	const columnSettingTime = new Setting(containerEl)
	const columnSettingProperty = new Setting(containerEl)

	columnSettingStyle.setClass('kanban-column-setting')
	columnSettingTime.setClass('kanban-column-setting')
	columnSettingProperty.setClass('kanban-column-setting')

	columnSettingStyle
		.setName(t('COMPLETE_SETTING_BASIC'))
		.setDesc(t('COMPLETE_SETTING_BASIC_DESC'))
		.addButton((button) => {
			button.setButtonText('')
			button.setIcon(plugin.settings.completedColumn.icon)
			button.setTooltip(t('SELECT_ICON'))
			button.onClick(() => {
				new IconSuggestModal(plugin.app, (selectedIcon) => {
					plugin.settings.completedColumn.icon = selectedIcon
					plugin.saveSettings()
					display() // Refresca la UI para mostrar el cambio
				}).open()
			})
		})
		.addColorPicker((colorPicker) =>
			colorPicker
				.setValue(plugin.settings.completedColumn.color)
				.onChange(async (value) => {
					plugin.settings.completedColumn.color = value
					await plugin.saveSettings()
				}),
		)

	columnSettingProperty
		.setName(t('COMPLETE_SETTING_PROPERTY'))
		.setDesc(t('COMPLETE_SETTING_PROPERTY_DESC'))
		.addText((text) => {
			text.setValue(plugin.settings.propertyCompleted).onChange(
				async (value) => {
					plugin.settings.propertyCompleted = value
					await plugin.saveSettings()
				},
			)
		})

	columnSettingTime
		.setName(t('COMPLETE_SETTING_TIME'))
		.setDesc(t('COMPLETE_SETTING_TIME_DESC'))
		.addDropdown((dropdownComponent) => {
			dropdownComponent
				.addOption(TimeOptions.day.toString(), t('DAY'))
				.addOption(TimeOptions.week.toString(), t('WEEK'))
				.addOption(TimeOptions.month.toString(), t('MONTH'))
				.addOption(TimeOptions.year.toString(), t('YEAR'))
				.setValue(
					plugin.settings.completedColumn.limitDate
						? plugin.settings.completedColumn.limitDate.toString()
						: TimeOptions.week.toString(),
				)
				.onChange(async (value) => {
					plugin.settings.completedColumn.limitDate = parseInt(value)
					await plugin.saveSettings()
				})
		})
}
