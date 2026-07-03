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

		containerEl.createEl('h2', { text: t('VIEW_TITLE') })

		containerEl.createEl('h3', { text: t('PROPERTIES_TITLE') })
		const propsEl = containerEl.createEl('div', {
			cls: 'kanban-setting-section',
		})
		propsEl.createEl('p', {
			text: `${t('PROPERTY_STATE')}: ${this.plugin.settings.propertyState}`,
		})
		propsEl.createEl('p', {
			text: `${t('PROPERTY_DESCRIPTION')}: ${this.plugin.settings.propertyDescription}`,
		})
		propsEl.createEl('p', {
			text: `${t('PROPERTY_CATEGORY')}: ${this.plugin.settings.propertyCategory}`,
		})
		propsEl.createEl('p', {
			text: t('PROPERTIES_NOTE'),
			attr: { style: 'opacity: 0.7; font-size: 0.85em;' },
		})

		new Setting(containerEl)
			.setName(t('TAG_LABEL'))
			.setDesc(t('TAG_DESC'))
			.addText((text) =>
				text
					.setValue(this.plugin.settings.tagNotes)
					.onChange(async (value) => {
						this.plugin.settings.tagNotes = value
						await this.plugin.saveSettings()
					}),
			)
			.setClass('kanban-setting-section')

		new Setting(containerEl)
			.setName(t('FOLDER_LABEL'))
			.setDesc(t('FOLDER_DESC'))
			.addText((text) =>
				text
					.setValue(this.plugin.settings.folderNotes)
					.setPlaceholder('Projects/MyProject')
					.onChange(async (value) => {
						this.plugin.settings.folderNotes = value
						await this.plugin.saveSettings()
					}),
			)
			.setClass('kanban-setting-section')

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
