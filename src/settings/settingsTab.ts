import {
	App,
	DropdownComponent,
	getIconIds,
	PluginSettingTab,
	setIcon,
	Setting,
} from 'obsidian'
import type KanbanMoonlight from '../main' // Importamos el tipo del plugin principal
import { t } from '../lang/helpers' // Importamos la función de traducción
import { IconSuggestModal } from './iconSuggestModal'

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

		containerEl.createEl('h3', { text: t('COLUMNS_TITLE') })

		// Renderizar dinámicamente cada columna del arreglo
		this.plugin.settings.columns.forEach((column, index) => {
			const columnSetting = new Setting(containerEl)
			columnSetting.setClass('kanban-column-setting')

			columnSetting.addText((text) =>
				text.setValue(column.title).onChange(async (value: string) => {
					this.plugin.settings.columns[index]!.title = value
					await this.plugin.saveSettings()
				}),
			)

			columnSetting
				.addButton((button) => {
					button.setButtonText('')
					button.setIcon(this.plugin.settings.columns[index]!.icon)
					button.setTooltip(t('SELECT_ICON'))
					button.onClick(() => {
						new IconSuggestModal(this.app, (selectedIcon) => {
							this.plugin.settings.columns[index]!.icon =
								selectedIcon
							this.plugin.saveSettings()
							this.display() // Refresca la UI para mostrar el cambio
						}).open()
					})
				})
				.addColorPicker((colorPicker) =>
					colorPicker
						.setValue(column.color)
						.onChange(async (value) => {
							this.plugin.settings.columns[index]!.color = value
							await this.plugin.saveSettings()
						}),
				)
				.addButton((btn) =>
					btn
						.setButtonText('')
						.setIcon('trash')
						.setTooltip(t('DELETE_BTN'))
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.columns.splice(index, 1)
							await this.plugin.saveSettings()
							this.display() // Redibujar la pestaña de ajustes
						}),
				)
		})

		// Botón para AGREGAR una nueva columna al final
		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText(t('ADD_COLUMN_BTN'))
				.setCta()
				.onClick(async () => {
					const nuevoId = `col-${Date.now()}` // Genera un ID único basado en el tiempo
					this.plugin.settings.columns.push({
						id: nuevoId,
						icon: 'plus',
						title: t('NEW_COLUMN_PLACEHOLDER'),
						color: '#ffffff', // Color por defecto
					})
					await this.plugin.saveSettings()
					this.display() // Redibujar la pestaña de ajustes
				}),
		)
	}
}
