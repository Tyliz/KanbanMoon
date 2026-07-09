import { App, Modal, Notice, TFile } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'
import { toSafeFm, getFmStringArray } from '../utils/frontmatter'
import { PersonModal } from './boardModal'
import { getContrastColor } from '../utils/color'
import { IPerson } from '../settings/kanbanSettings'

export class EditTaskModal extends Modal {
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
		contentEl.addClass('kanban-edit-task-modal')
		this.titleEl.setText(t('EDIT_TASK_TITLE'))

		const board = this.plugin.getActiveBoard()
		const noteCache = this.plugin.app.metadataCache.getFileCache(this.file)
		const fm = toSafeFm(noteCache)

		const currentAssignees = getFmStringArray(
			fm,
			board.propertyAssignee || 'assignee',
		)

		let selectedPeople: string[] = [...currentAssignees]

		const addPersonBtn = contentEl.createEl('button', {
			cls: 'kanban-new-task-btn kanban-edit-task-add-btn',
			text: t('ADD_PERSON_BTN'),
		})

		const peopleContainer = contentEl.createEl('div', {
			cls: 'kanban-people-list',
		})

		const renderPeopleList = () => {
			peopleContainer.empty()

			const currentPeople = this.plugin.settings.people

			if (currentPeople.length === 0) {
				peopleContainer.createEl('p', {
					text: t('PERSON_NONE'),
					cls: 'kanban-edit-task-empty',
				})
			} else {
				currentPeople.forEach((person) => {
					const personCheckbox = peopleContainer.createEl('div', {
						cls: 'kanban-person-checkbox',
					})

					const checkbox = personCheckbox.createEl('input', {
						attr: {
							type: 'checkbox',
							value: person.id,
						},
					})

					if (selectedPeople.includes(person.id)) {
						checkbox.checked = true
					}

				const avatarEl = personCheckbox.createEl('div', {
					cls: 'kanban-person-avatar',
					attr: {
						style: `background-color: ${person.color}; color: ${getContrastColor(person.color)};`,
					},
				})
					avatarEl.textContent = person.name
						.split(' ')
						.map((n) => n[0])
						.join('')
						.toUpperCase()
						.slice(0, 2)

					personCheckbox.createEl('span', {
						text: person.name,
						cls: 'kanban-person-name',
					})

					checkbox.addEventListener('change', () => {
						if (checkbox.checked) {
							if (!selectedPeople.includes(person.id)) {
								selectedPeople.push(person.id)
							}
						} else {
							selectedPeople = selectedPeople.filter(
								(id) => id !== person.id,
							)
						}
					})
				})
			}
		}

		addPersonBtn.addEventListener('click', () => {
			const modal = new PersonModal(
				this.app,
				this.plugin,
				null,
				this.plugin.settings.peopleFolder,
				(person: IPerson) => {
					this.plugin.settings.people.push(person)
					void this.plugin.saveSettings()
					selectedPeople.push(person.id)
					renderPeopleList()
				},
			)
			modal.open()
		})

		renderPeopleList()

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
			void this.saveAssignees(selectedPeople)
		})
	}

	private async saveAssignees(personIds: string[]) {
		try {
			await this.plugin.app.fileManager.processFrontMatter(
				this.file,
				(frontmatter) => {
					const fm = frontmatter as Record<string, unknown>
					const board = this.plugin.getActiveBoard()
					const key = board.propertyAssignee || 'assignee'

					if (personIds.length > 0) {
						fm[key] = personIds
					} else {
						delete fm[key]
					}
				},
			)
			new Notice(t('TASK_ASSIGNEES_UPDATED'))
			this.close()
		} catch (err) {
			new Notice(t('TASK_ASSIGNEES_ERROR'))
			console.error('Error updating assignees:', err)
		}
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
