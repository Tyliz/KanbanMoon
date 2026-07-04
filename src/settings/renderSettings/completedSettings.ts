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
	new Setting(containerEl).setName(t('COMPLETED_SETTINGS_TITLE')).setHeading()

	new Setting(containerEl)
		.setName(t('COMPLETE_SETTING_BASIC'))
		.setDesc(t('COMPLETE_SETTING_BASIC_DESC'))
		.setClass('kanban-setting-section')
		.addButton((button) => {
			button.setButtonText('')
			button.setIcon(plugin.settings.completedColumn.icon)
			button.setTooltip(t('SELECT_ICON'))
			button.onClick(() => {
				new IconSuggestModal(plugin.app, (selectedIcon) => {
					plugin.settings.completedColumn.icon = selectedIcon
					void plugin.saveSettings()
					display()
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

	new Setting(containerEl)
		.setName(t('COMPLETE_SETTING_TIME'))
		.setDesc(t('COMPLETE_SETTING_TIME_DESC'))
		.setClass('kanban-setting-section')
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
