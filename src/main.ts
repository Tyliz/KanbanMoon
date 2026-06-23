import { Plugin } from 'obsidian';
import { IKanbanSettings, DEFAULT_SETTINGS } from './settings/kanbanSettings';
import { KanbanMoonlightSettingTab } from './settings/settingsTab';
import { KanbanMoonlightView, VIEW_TYPE_KANBAN } from './views/kanbanView';
import { t } from './lang/helpers'; // Importamos la función de traducción

export default class KanbanMoonlightPlugin extends Plugin {
	settings: IKanbanSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// Registrar la Vista pasando "this" (el plugin) como argumento
		this.registerView(
			VIEW_TYPE_KANBAN,
			(leaf) => new KanbanMoonlightView(leaf, this),
		);
		// 2. AÑADIR EL ICONO A LA BARRA LATERAL (RIBBON)
		// Usamos el icono 'lucide-kanban' (Obsidian incluye la librería Lucide Icons)
		this.addRibbonIcon(
			'lucide-kanban',
			t('VIEW_TITLE'),
			(evt: MouseEvent) => {
				this.activarVista();
			},
		);

		// Registrar la pestaña de ajustes
		this.addSettingTab(new KanbanMoonlightSettingTab(this.app, this));
	}

	// Función para abrir o enfocar la pestaña del Kanban
	async activarVista() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_KANBAN)[0];

		if (!leaf) {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_KANBAN,
				active: true,
			});
		}
		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
