import { App, Modal, Notice, Setting, TFile } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'
import { toSafeFm, getFmString, getFmStringArray } from '../utils/frontmatter'
import { PersonModal } from './boardModal'
import { getContrastColor } from '../utils/color'
import { IPerson } from '../settings/kanbanSettings'
import { pushHistoryEvent, getToday } from '../utils/history'

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

		const currentDescription = getFmString(
			fm,
			board.propertyDescription || 'description',
		)
		let newDescription = currentDescription

		const descriptionSetting = new Setting(contentEl)
			.setName(t('EDIT_TASK_DESC'))

		const descriptionTextarea = descriptionSetting.descEl.createEl(
			'textarea',
			{
				cls: 'kanban-create-task-textarea',
				attr: {
					rows: 3,
					placeholder: t('CREATE_TASK_DESC_PLACEHOLDER'),
				},
			},
		)
		descriptionTextarea.value = currentDescription
		descriptionTextarea.addEventListener('input', () => {
			newDescription = descriptionTextarea.value
		})

		const currentCategory = getFmString(
			fm,
			board.propertyCategory || 'category',
		)
		let selectedCategory = currentCategory

		new Setting(contentEl)
			.setName(t('EDIT_TASK_CATEGORY'))
			.addDropdown((dropdown) => {
				dropdown.addOption('', t('CREATE_TASK_CATEGORY_NONE'))
				board.categories.forEach((cat) => {
					dropdown.addOption(cat.name, cat.name)
				})
				dropdown.setValue(selectedCategory)
				dropdown.onChange((value) => {
					selectedCategory = value
				})
			})

		const currentPriority = getFmString(
			fm,
			board.propertyPriority || 'priority',
		)
		let selectedPriority = currentPriority

		new Setting(contentEl)
			.setName(t('EDIT_TASK_PRIORITY'))
			.addDropdown((dropdown) => {
				dropdown.addOption('', t('CREATE_TASK_PRIORITY_NONE'))
				board.priorities.forEach((pri) => {
					dropdown.addOption(pri.name, pri.name)
				})
				dropdown.setValue(selectedPriority)
				dropdown.onChange((value) => {
					selectedPriority = value
				})
			})

		const currentAssignees = getFmStringArray(
			fm,
			board.propertyAssignee || 'assignee',
		)

		let selectedPeople: string[] = [...currentAssignees]

		const addPersonBtn = contentEl.createEl('button', {
			cls: 'kanban-new-task-btn kanban-edit-task-add-btn',
			text: t('ADD_PERSON_BTN'),
		})

		const peopleContainer = contentEl.createDiv({
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
					const personCheckbox = peopleContainer.createDiv({
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

					const avatarEl = personCheckbox.createDiv({
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

					personCheckbox.createSpan({
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
		saveBtn.addEventListener('click', () => {
			void this.saveChanges(
				newDescription,
				selectedCategory,
				selectedPriority,
				selectedPeople,
			)
		})
	}

	private async saveChanges(
		description: string,
		category: string,
		priority: string,
		personIds: string[],
	) {
		try {
			await this.plugin.app.fileManager.processFrontMatter(
				this.file,
				(frontmatter) => {
					const fm = frontmatter as Record<string, unknown>
					const board = this.plugin.getActiveBoard()

					const descKey = board.propertyDescription || 'description'
					if (description.trim()) {
						fm[descKey] = description.trim()
					} else {
						delete fm[descKey]
					}

					const categoryKey = board.propertyCategory || 'category'
					const previousCategory = getFmString(fm, categoryKey)

					if (category !== previousCategory) {
						pushHistoryEvent(
							fm,
							{
								type: 'category_changed',
								date: getToday(),
								from: previousCategory,
								to: category,
							},
							this.plugin.settings.maxHistoryEvents,
						)

						if (category.trim()) {
							fm[categoryKey] = category.trim()
						} else {
							delete fm[categoryKey]
						}
					}

					const priorityKey = board.propertyPriority || 'priority'
					const previousPriority = getFmString(fm, priorityKey)

					if (priority !== previousPriority) {
						pushHistoryEvent(
							fm,
							{
								type: 'priority_changed',
								date: getToday(),
								from: previousPriority,
								to: priority,
							},
							this.plugin.settings.maxHistoryEvents,
						)

						if (priority.trim()) {
							fm[priorityKey] = priority.trim()
						} else {
							delete fm[priorityKey]
						}
					}

					const assigneeKey = board.propertyAssignee || 'assignee'
					const previousAssignees = getFmStringArray(fm, assigneeKey)

					const added = personIds.filter(
						(id) => !previousAssignees.includes(id),
					)
					const removed = previousAssignees.filter(
						(id) => !personIds.includes(id),
					)

					if (added.length > 0 || removed.length > 0) {
						pushHistoryEvent(
							fm,
							{
								type: 'assignee_changed',
								date: getToday(),
								added,
								removed,
							},
							this.plugin.settings.maxHistoryEvents,
						)
					}

					if (personIds.length > 0) {
						fm[assigneeKey] = personIds
					} else {
						delete fm[assigneeKey]
					}
				},
			)
			new Notice(t('EDIT_TASK_UPDATED'))
			this.close()
		} catch (err) {
			new Notice(t('TASK_ASSIGNEES_ERROR'))
			console.error('Error updating task:', err)
		}
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
