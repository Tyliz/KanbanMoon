import { App, PluginSettingTab, Setting } from 'obsidian';
import type KanbanMoonlight from '../main'; // Importamos el tipo del plugin principal
import { t } from '../lang/helpers'; // Importamos la función de traducción

export class KanbanMoonlightSettingTab extends PluginSettingTab {
	plugin: KanbanMoonlight;

	constructor(app: App, plugin: KanbanMoonlight) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: t('VIEW_TITLE') });
		new Setting(containerEl)
			.setName(t('TAG_LABEL'))
			.setDesc(t('TAG_DESC'))
			.addText((text) =>
				text
					.setValue(this.plugin.settings.tagProyectos)
					.onChange(async (value) => {
						this.plugin.settings.tagProyectos = value;
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl('h3', { text: t('COLUMNS_TITLE') });

		// Renderizar dinámicamente cada columna del arreglo
		this.plugin.settings.columnas.forEach((columna, index) => {
			const s = new Setting(containerEl)
				.setName(`${t('COLUMN_NAME')} ${index + 1}`)
				.addText((text) =>
					text.setValue(columna.titulo).onChange(async (value) => {
						this.plugin.settings.columnas[index]!.titulo = value;
						await this.plugin.saveSettings();
					}),
				)
				.addButton((btn) =>
					btn
						.setButtonText(t('DELETE_BTN'))
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.columnas.splice(index, 1);
							await this.plugin.saveSettings();
							this.display(); // Redibujar la pestaña de ajustes
						}),
				);
		});

		// Botón para AGREGAR una nueva columna al final
		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText(t('ADD_COLUMN_BTN'))
				.setCta()
				.onClick(async () => {
					const nuevoId = `col-${Date.now()}`; // Genera un ID único basado en el tiempo
					this.plugin.settings.columnas.push({
						id: nuevoId,
						titulo: t('NEW_COLUMN_PLACEHOLDER'),
					});
					await this.plugin.saveSettings();
					this.display(); // Redibujar la pestaña de ajustes
				}),
		);
	}
}
