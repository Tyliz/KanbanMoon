import { Plugin, Notice } from 'obsidian'
import { IKanbanSettings, DEFAULT_SETTINGS, getActiveBoard } from './settings/kanbanSettings'
import { migrateSettings } from './settings/migration'
import { KanbanMoonlightSettingTab } from './settings/settingsTab'
import { KanbanMoonlightView, VIEW_TYPE_KANBAN } from './views/kanbanView'
import { CreateTaskModal } from './ui/createTaskModal'
import { DeleteConfirmModal } from './ui/deleteConfirmModal'
import { normalizeTag } from './views/renderKanban/utils'
import { t } from './lang/helpers'
import { toSafeFm, getFmStringArray } from './utils/frontmatter'

export default class KanbanMoonlightPlugin extends Plugin {
	settings: IKanbanSettings = DEFAULT_SETTINGS
	private refreshTimer: number | null = null

	getActiveBoard() {
		return getActiveBoard(this.settings)
	}

	async onload() {
		await this.loadSettings()

		// Registrar la Vista pasando "this" (el plugin) como argumento
		this.registerView(
			VIEW_TYPE_KANBAN,
			(leaf) => new KanbanMoonlightView(leaf, this),
		)
		// 2. AÑADIR EL ICONO A LA BARRA LATERAL (RIBBON)
		// Usamos el icono 'lucide-kanban' (Obsidian incluye la librería Lucide Icons)
		this.addRibbonIcon(
			'lucide-kanban',
			t('VIEW_TITLE'),
			(_evt: MouseEvent) => {
				void this.activeView()
			},
		)

		this.addCommand({
			id: 'create-new-kanban-task',
			name: t('CREATE_TASK_TITLE'),
			callback: () => {
				new CreateTaskModal(this.app, this).open()
			},
		})

		this.addCommand({
			id: 'delete-kanban-task',
			name: t('DELETE_BTN') + ' ' + t('VIEW_TITLE'),
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile()
				if (!activeFile) {
					new Notice(t('NOTE_NOT_FOUND'))
					return
				}

				const cache = this.app.metadataCache.getFileCache(activeFile)
			const fm = toSafeFm(cache)
			const board = this.getActiveBoard()
			const hasTag = getFmStringArray(fm, 'tags').some((tag) =>
					normalizeTag(tag).startsWith(
						normalizeTag(board.tagNotes),
					),
				)
	
			const folder = board.folderNotes
				const inFolder =
					folder &&
					activeFile.path.startsWith(
						folder.replace(/^\/+/, '').replace(/\/?$/, '/'),
					)

				if (!hasTag && !inFolder) {
					new Notice(t('NOTICE_NOT_KANBAN'))
					return
				}

				new DeleteConfirmModal(this.app, this, activeFile).open()
			},
		})

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
			const cache = this.app.metadataCache.getFileCache(file)
			const fm = toSafeFm(cache)
			const board = this.getActiveBoard()
			const hasTag = getFmStringArray(fm, 'tags').some((tag) =>
					normalizeTag(tag).startsWith(
						normalizeTag(board.tagNotes),
					),
				)
				const folder = board.folderNotes
				const inFolder =
					folder &&
					file.path.startsWith(
						folder.replace(/^\/+/, '').replace(/\/?$/, '/'),
					)
				if (hasTag || inFolder) {
					this.refreshView()
				}
			}),
		)

		this.registerEvent(
			this.app.metadataCache.on('resolve', (file) => {
				this.refreshView()
			}),
		)

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				this.refreshView()
			}),
		)

		// Registrar la pestaña de ajustes
		this.addSettingTab(new KanbanMoonlightSettingTab(this.app, this))
	}

	// Función para abrir o enfocar la pestaña del Kanban
	async activeView() {
		const { workspace } = this.app
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_KANBAN)[0]

		if (!leaf) {
			leaf = workspace.getLeaf('tab')
			await leaf.setViewState({
				type: VIEW_TYPE_KANBAN,
				active: true,
			})
		}
		void workspace.revealLeaf(leaf)
	}

	refreshView = () => {
		if (this.refreshTimer) window.clearTimeout(this.refreshTimer)
		this.refreshTimer = window.setTimeout(() => {
			this.app.workspace
				.getLeavesOfType(VIEW_TYPE_KANBAN)
				.forEach((leaf) => {
					if (leaf.view instanceof KanbanMoonlightView) {
						leaf.view.drawKanbanBoard()
					}
				})
		}, 100)
	}

	async loadSettings() {
		const raw = await this.loadData() as Record<string, unknown> | null
		this.settings = migrateSettings(raw)
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.refreshView()
	}
}
