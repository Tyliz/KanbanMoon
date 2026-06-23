import { App, PluginSettingTab, Setting } from 'obsidian';
import KanbanMoonlight from './main';

export interface KanbanMoonlightSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: KanbanMoonlightSettings = {
	mySetting: 'default',
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: KanbanMoonlight;

	constructor(app: App, plugin: KanbanMoonlight) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
