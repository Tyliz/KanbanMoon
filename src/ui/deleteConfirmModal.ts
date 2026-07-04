import { App, Modal, Notice, Setting, TFile } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'

export class DeleteConfirmModal extends Modal {
	plugin: KanbanMoonlightPlugin
	file: TFile

	constructor(app: App, plugin: KanbanMoonlightPlugin, file: TFile) {
		super(app)
		this.plugin = plugin
		this.file = file
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.empty()
		this.titleEl.setText(t('DELETE_CONFIRM'))

		contentEl.createEl('p', {
			text: t('DELETE_CONFIRM_DESC').replace(
				'{title}',
				this.file.basename,
			),
		})

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText(t('CREATE_TASK_CANCEL'))
				btn.onClick(() => this.close())
			})
			.addButton((btn) => {
				btn.setWarning()
				btn.setButtonText(t('DELETE_CONFIRM_YES'))
				btn.onClick(async () => {
					try {
						await this.app.fileManager.trashFile(this.file)
						new Notice(t('NOTICE_DELETED'))
						this.close()
					} catch (err) {
						new Notice(t('CREATE_TASK_ERROR_CREATE'))
						console.error('Error deleting task:', err)
					}
				})
			})
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
