import { App, Modal, Notice, TFile } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'
import { pushHistoryEvent, getToday } from '../utils/history'

export class CommentModal extends Modal {
	plugin: KanbanMoonlightPlugin
	file: TFile
	private onSaved: () => void

	constructor(
		app: App,
		plugin: KanbanMoonlightPlugin,
		file: TFile,
		onSaved: () => void,
	) {
		super(app)
		this.plugin = plugin
		this.file = file
		this.onSaved = onSaved
	}

	onOpen() {
		const { contentEl } = this
		contentEl.empty()
		contentEl.addClass('kanban-comment-modal')
		this.titleEl.setText(t('HISTORY_COMMENT_ADD'))

		const textarea = contentEl.createEl('textarea', {
			cls: 'kanban-comment-modal__textarea',
			attr: {
				placeholder: t('HISTORY_COMMENT_PLACEHOLDER'),
				rows: '4',
			},
		})

		const footerEl = contentEl.createDiv({
			cls: 'kanban-board-modal-footer',
		})

		const cancelBtn = footerEl.createEl('button', {
			text: t('CREATE_TASK_CANCEL'),
		})
		cancelBtn.addEventListener('click', () => this.close())

		const saveBtn = footerEl.createEl('button', {
			cls: 'mod-cta',
			text: t('BOARD_MODAL_SAVE'),
		})
		saveBtn.disabled = true

		textarea.addEventListener('input', () => {
			saveBtn.disabled = textarea.value.trim().length === 0
		})

		saveBtn.addEventListener('click', () => {
			void this.saveComment(textarea.value)
		})

		textarea.focus()
	}

	private async saveComment(note: string) {
		const trimmed = note.trim()

		if (trimmed.length === 0) return

		try {
			await this.plugin.app.fileManager.processFrontMatter(
				this.file,
				(frontmatter) => {
					const fm = frontmatter as Record<string, unknown>

					pushHistoryEvent(
						fm,
						{
							type: 'comment',
							date: getToday(),
							note: trimmed,
						},
						this.plugin.settings.maxHistoryEvents,
					)
				},
			)

			this.onSaved()
			this.close()
		} catch (err) {
			new Notice(t('HISTORY_COMMENT_ERROR'))
			console.error('Error saving comment:', err)
		}
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
