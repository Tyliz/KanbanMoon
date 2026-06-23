import { ItemView, WorkspaceLeaf } from 'obsidian';
import { t } from '../lang/helpers'; // Importamos la función de traducción
import type KanbanMoonlight from '../main';

export const VIEW_TYPE_KANBAN = 'kanban-moonlight-view';

export class KanbanMoonlightView extends ItemView {
	plugin: KanbanMoonlight;

	constructor(leaf: WorkspaceLeaf, plugin: KanbanMoonlight) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_KANBAN;
	}
	getDisplayText() {
		return t('VIEW_TITLE');
	}

	async onOpen() {
		const container = this.contentEl;
		container.empty();

		// ¡Aquí usas tus configuraciones!
		const tag = this.plugin.settings.tagProyectos;
		container.createEl('h3', { text: t('FILTER_NOTICE') + ` ${tag}` });
	}
}
