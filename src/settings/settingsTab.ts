import { App, PluginSettingTab, Setting } from 'obsidian'
import type KanbanMoonlight from '../main' // Importamos el tipo del plugin principal
import { t } from '../lang/helpers' // Importamos la función de traducción
import { renderCategorySettings } from './renderSettings/categorySettings'
import { renderColumnSettings } from './renderSettings/columnSettings'
import { renderCompletedSettings } from './renderSettings/completedSettings'

export class KanbanMoonlightSettingTab extends PluginSettingTab {
	plugin: KanbanMoonlight

	constructor(app: App, plugin: KanbanMoonlight) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		containerEl.addClass('kanban-settings-container')

		const board = this.plugin.getActiveBoard()

		new Setting(containerEl).setName(t('VIEW_TITLE')).setHeading()

		new Setting(containerEl)

			.setName(t('TAG_LABEL'))
			.setDesc(t('TAG_DESC'))
			.addText((text) =>
				text
					.setValue(board.tagNotes)
					.setPlaceholder(t('BOARD_TAG_PLACEHOLDER'))
					.onChange(async (value) => {
						board.tagNotes = value
						await this.plugin.saveSettings()
					}),
			)
			.setClass('kanban-setting-section')

		new Setting(containerEl)
			.setName(t('FOLDER_LABEL'))
			.setDesc(t('FOLDER_DESC'))
			.addText((text) =>
				text
					.setValue(board.folderNotes)
					.setPlaceholder('Projects/my-project')
					.onChange(async (value) => {
						board.folderNotes = value
						await this.plugin.saveSettings()
					}),
			)
			.setClass('kanban-setting-section')

		new Setting(containerEl).setName(t('PROPERTIES_TITLE')).setHeading()

		new Setting(containerEl)
			.setName(t('PROPERTY_STATE'))
			.setDesc(board.propertyState)
			.setClass('kanban-setting-section')

		new Setting(containerEl)
			.setName(t('PROPERTY_DESCRIPTION'))
			.setDesc(board.propertyDescription)
			.setClass('kanban-setting-section')

		new Setting(containerEl)
			.setName(t('PROPERTY_CATEGORY'))
			.setDesc(board.propertyCategory)
			.setClass('kanban-setting-section')

		containerEl.createEl('p', {
			text: t('PROPERTIES_NOTE'),
			cls: 'kanban-setting-note',
		})

		renderColumnSettings(this.plugin, containerEl, this.display.bind(this))

		renderCompletedSettings(
			this.plugin,
			containerEl,
			this.display.bind(this),
		)

		renderCategorySettings(
			this.plugin,
			containerEl,
			this.display.bind(this),
		)
	}
}
