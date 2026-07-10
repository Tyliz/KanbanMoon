import { App, Modal, Setting, Notice, setIcon } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'
import { IBoard, IPerson } from '../settings/kanbanSettings'

export class BoardModal extends Modal {
	plugin: KanbanMoonlightPlugin
	board: IBoard | null
	isNew: boolean

	constructor(app: App, plugin: KanbanMoonlightPlugin, board?: IBoard) {
		super(app)
		this.plugin = plugin
		this.board = board || null
		this.isNew = !board
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.empty()
		contentEl.addClass('kanban-board-modal')

		this.titleEl.setText(
			this.isNew ? t('BOARD_MODAL_CREATE') : t('BOARD_MODAL_EDIT'),
		)

		const board = this.board
		const boards = this.plugin.settings.boards

		let name = board?.name || `Board ${boards.length + 1}`
		let tagNotes = board?.tagNotes || ''
		let folderNotes = board?.folderNotes || ''

		new Setting(contentEl)
			.setName(t('BOARD_NAME_LABEL'))
			.setDesc(t('BOARD_NAME_DESC'))
			.addText((text) =>
				text
					.setPlaceholder(t('BOARD_NAME_PLACEHOLDER'))
					.setValue(name)
					.onChange((value) => {
						name = value
					}),
			)

		new Setting(contentEl)
			.setName(t('BOARD_TAG_LABEL'))
			.setDesc(t('BOARD_TAG_DESC'))
			.addText((text) =>
				text
					.setPlaceholder(t('BOARD_TAG_PLACEHOLDER'))
					.setValue(tagNotes)
					.onChange((value) => {
						tagNotes = value
					}),
			)

		new Setting(contentEl)
			.setName(t('BOARD_FOLDER_LABEL'))
			.setDesc(t('BOARD_FOLDER_DESC'))
			.addText((text) =>
				text
					.setPlaceholder('Projects/my-project')
					.setValue(folderNotes)
					.onChange((value) => {
						folderNotes = value
					}),
			)

		const footerEl = contentEl.createEl('div', {
			cls: 'kanban-board-modal-footer',
		})

		if (!this.isNew && boards.length > 1) {
			const deleteBtn = footerEl.createEl('button', {
				cls: 'btn-delete',
			})
			setIcon(deleteBtn, 'trash-2')
			deleteBtn.createEl('span', { text: t('DELETE_BTN') })
			deleteBtn.addEventListener('click', () => {
				void this.deleteBoard()
			})

			const spacer = footerEl.createEl('div', {
				cls: 'kanban-board-modal-spacer',
			})
			void spacer
		}

		const cancelBtn = footerEl.createEl('button', {
			text: t('CREATE_TASK_CANCEL'),
		})
		cancelBtn.addEventListener('click', () => this.close())

		const saveBtn = footerEl.createEl('button', {
			cls: 'mod-cta',
			text: this.isNew ? t('BOARD_MODAL_CREATE') : t('BOARD_MODAL_SAVE'),
		})
		saveBtn.addEventListener('click', () => {
			void this.saveBoard({
				name,
				tagNotes,
				folderNotes,
			})
		})
	}

	private getNextTag(): string {
		const boards = this.plugin.settings.boards
		const maxTagNum = boards.reduce((max, b) => {
			const match = b.tagNotes.match(/^#tag\/(\d+)$/)
			if (match && match[1]) {
				const num = parseInt(match[1])
				return num > max ? num : max
			}
			return max
		}, 1)
		return `#tag/${maxTagNum + 1}`
	}

	private async saveBoard(data: {
		name: string
		tagNotes: string
		folderNotes: string
	}) {
		if (!data.name.trim()) {
			new Notice(t('BOARD_MODAL_ERROR_NAME'))
			return
		}

		if (!data.tagNotes.trim() && !data.folderNotes.trim()) {
			new Notice(t('BOARD_MODAL_ERROR_FILTER'))
			return
		}

		const boards = this.plugin.settings.boards

		if (this.isNew) {
			const newBoard: IBoard = {
				id: `board-${Date.now()}`,
				name: data.name.trim(),
				tagNotes: data.tagNotes.trim(),
				folderNotes: data.folderNotes.trim(),
				propertyState: 'state',
				propertyDescription: 'description',
				propertyCategory: 'category',
				propertyAssignee: 'assignee',
				propertyStartDate: 'startDate',
				propertyDueDate: 'dueDate',
				columns: [
					{
						id: 'backlog',
						icon: 'inbox',
						title: t('COLUMN_BACKLOG'),
						color: '#ac46ff',
					},
					{
						id: 'todo',
						icon: 'clipboard-list',
						title: t('COLUMN_TODO'),
						color: '#3498db',
					},
					{
						id: 'workingOn',
						icon: 'cog',
						title: t('COLUMN_WORKING_ON'),
						color: '#00a8ff',
					},
					{
						id: 'review',
						icon: 'eye',
						title: t('COLUMN_REVIEW'),
						color: '#f39c12',
					},
				],
				categories: [],
				completedColumn: {
					id: 'completed',
					icon: 'check-check',
					title: t('COLUMN_COMPLETED'),
					color: '#27ae60',
					limitDate: 1,
				},
			}
			boards.push(newBoard)
			this.plugin.settings.activeBoardId = newBoard.id
			new Notice(t('BOARD_MODAL_CREATED'))
		} else if (this.board) {
			const existing = boards.find((b) => b.id === this.board!.id)
			if (existing) {
				existing.name = data.name.trim()
				existing.tagNotes = data.tagNotes.trim()
				existing.folderNotes = data.folderNotes.trim()
				new Notice(t('BOARD_MODAL_SAVED'))
			}
		}

		await this.plugin.saveSettings()
		this.close()
	}

	private async deleteBoard() {
		if (!this.board) return

		const boardName = this.board.name
		const boardId = this.board.id

		const confirmModal = new DeleteBoardConfirmModal(
			this.app,
			this.plugin,
			boardName,
			async () => {
				const boards = this.plugin.settings.boards
				const index = boards.findIndex((b) => b.id === boardId)

				if (index === -1) return

				boards.splice(index, 1)

				if (this.plugin.settings.activeBoardId === boardId) {
					this.plugin.settings.activeBoardId =
						boards[0]?.id || 'default'
				}

				await this.plugin.saveSettings()
				new Notice(t('BOARD_MODAL_DELETED'))
				this.close()
			},
		)
		confirmModal.open()
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

class DeleteBoardConfirmModal extends Modal {
	plugin: KanbanMoonlightPlugin
	boardName: string
	onConfirm: () => Promise<void>

	constructor(
		app: App,
		plugin: KanbanMoonlightPlugin,
		boardName: string,
		onConfirm: () => Promise<void>,
	) {
		super(app)
		this.plugin = plugin
		this.boardName = boardName
		this.onConfirm = onConfirm
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.empty()
		this.titleEl.setText(t('DELETE_CONFIRM'))

		contentEl.createEl('p', {
			text: t('SETTINGS_DELETE_BOARD_CONFIRM').replace(
				'{name}',
				this.boardName,
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
					await this.onConfirm()
					this.close()
				})
			})
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

export class PersonModal extends Modal {
	plugin: KanbanMoonlightPlugin
	person: IPerson | null
	peopleFolder: string
	onSave: (person: IPerson) => void

	constructor(
		app: App,
		plugin: KanbanMoonlightPlugin,
		person: IPerson | null,
		peopleFolder: string,
		onSave: (person: IPerson) => void,
	) {
		super(app)
		this.plugin = plugin
		this.person = person
		this.peopleFolder = peopleFolder
		this.onSave = onSave
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.empty()
		contentEl.addClass('kanban-person-modal')

		this.titleEl.setText(
			this.person ? t('PERSON_UPDATED') : t('PERSON_CREATED'),
		)

		let name = this.person?.name || ''
		let email = this.person?.email || ''
		let color = this.person?.color || '#3498db'
		let notes = this.person?.notes || ''

		new Setting(contentEl).setName(t('PERSON_NAME')).addText((text) =>
			text
				.setPlaceholder(t('PERSON_NAME_PLACEHOLDER'))
				.setValue(name)
				.onChange((value) => {
					name = value
				}),
		)

		new Setting(contentEl).setName(t('PERSON_EMAIL')).addText((text) =>
			text
				.setPlaceholder(t('PERSON_EMAIL_PLACEHOLDER'))
				.setValue(email)
				.onChange((value) => {
					email = value
				}),
		)

		new Setting(contentEl)
			.setName(t('PERSON_COLOR'))
			.addColorPicker((picker) =>
				picker.setValue(color).onChange((value) => {
					color = value
				}),
			)

		const notesSetting = new Setting(contentEl).setName(t('PERSON_NOTES'))

		const notesTextarea = notesSetting.descEl.createEl('textarea', {
			cls: 'kanban-create-task-textarea',
			attr: {
				rows: 3,
				placeholder: t('PERSON_NOTES_PLACEHOLDER'),
			},
		})
		notesTextarea.value = notes
		notesTextarea.addEventListener('input', () => {
			notes = notesTextarea.value
		})

		const footerEl = contentEl.createEl('div', {
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
		saveBtn.addEventListener('click', () => {
			void this.savePerson({
				id: this.person?.id || `person-${Date.now()}`,
				name: name.trim(),
				email: email.trim(),
				color,
				notes: notes.trim(),
			})
		})
	}

	private async savePerson(person: IPerson) {
		if (!person.name.trim()) {
			new Notice(t('PERSON_ERROR_NAME'))
			return
		}

		const existingPerson = this.plugin.settings.people.find(
			(p: IPerson) =>
				p.name.toLowerCase() === person.name.toLowerCase() &&
				p.id !== person.id,
		)

		if (existingPerson) {
			new Notice(t('PERSON_ERROR_EXISTS'))
			return
		}

		await this.createPersonNote(person)

		this.onSave(person)
		this.close()
	}

	private async createPersonNote(person: IPerson) {
		const folder = this.peopleFolder
			.replace(/^\/+/, '')
			.replace(/\/?$/, '/')

		const filePath = `${folder}${person.name.replace(/[\\/:*?"<>|]/g, '-')}.md`

		const existingFile = this.app.vault.getFileByPath(filePath)
		if (existingFile) return

		const folderPath = filePath.substring(0, filePath.lastIndexOf('/'))
		if (folderPath && !this.app.vault.getFolderByPath(folderPath)) {
			try {
				await this.app.vault.createFolder(folderPath)
			} catch (err) {
				new Notice(t('PERSON_ERROR_CREATE'))
				console.error('Error creating folder:', err)
				return
			}
		}

		try {
			const file = await this.app.vault.create(filePath, '')
			await this.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					const fm = frontmatter as Record<string, unknown>
					fm['tags'] = ['person']
					fm['name'] = person.name
					fm['email'] = person.email
					fm['color'] = person.color
					fm['notes'] = person.notes
				},
			)
		} catch (err) {
			new Notice(t('PERSON_ERROR_CREATE'))
			console.error('Error creating person note:', err)
		}
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
