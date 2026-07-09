import { App, Modal, Setting, Notice } from 'obsidian'
import { t } from '../lang/helpers'
import { getContrastColor } from '../utils/color'
import type KanbanMoonlightPlugin from '../main'

export class CreateTaskModal extends Modal {
	plugin: KanbanMoonlightPlugin

	constructor(app: App, plugin: KanbanMoonlightPlugin) {
		super(app)
		this.plugin = plugin
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.empty()
		contentEl.addClass('kanban-create-task-modal')
		this.titleEl.setText(t('CREATE_TASK_TITLE'))

		const board = this.plugin.getActiveBoard()
		let title = ''
		let description = ''
		let category = ''
		let state = board.columns[0]?.id || 'backlog'
		let selectedPersons: string[] = []

		new Setting(contentEl)
			.setName(t('CREATE_TASK_TITLE_LABEL'))
			.setDesc(t('CREATE_TASK_TITLE_DESC'))
			.addText((text) => {
				text.setPlaceholder(t('CREATE_TASK_TITLE_PLACEHOLDER'))
				text.onChange((value) => {
					title = value
				})
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						void createTask()
					}
				})
			})

		const descriptionSetting = new Setting(contentEl)
			.setName(t('CREATE_TASK_DESC_LABEL'))
			.setDesc(t('CREATE_TASK_DESC_DESC'))

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
		descriptionTextarea.addEventListener('input', () => {
			description = descriptionTextarea.value
		})

		new Setting(contentEl)
			.setName(t('CREATE_TASK_CATEGORY_LABEL'))
			.addDropdown((dropdown) => {
				dropdown.addOption('', t('CREATE_TASK_CATEGORY_NONE'))
				board.categories.forEach((cat) => {
					dropdown.addOption(cat.name, cat.name)
				})
				dropdown.onChange((value) => {
					category = value
				})
			})

		new Setting(contentEl)
			.setName(t('CREATE_TASK_STATE_LABEL'))
			.addDropdown((dropdown) => {
				board.columns.forEach((col) => {
					dropdown.addOption(col.id, col.title)
				})
				dropdown.setValue(state)
				dropdown.onChange((value) => {
					state = value
				})
			})

		if (this.plugin.settings.people.length > 0) {
			const peopleSection = contentEl.createEl('div', {
				cls: 'kanban-people-selection',
			})

			peopleSection.createEl('label', {
				text: t('ASSIGNEE_LABEL'),
				cls: 'kanban-people-label',
			})

			const peopleList = peopleSection.createEl('div', {
				cls: 'kanban-people-list',
			})

			this.plugin.settings.people.forEach((person) => {
				const personCheckbox = peopleList.createEl('div', {
					cls: 'kanban-person-checkbox',
				})

				const checkbox = personCheckbox.createEl('input', {
					attr: {
						type: 'checkbox',
						value: person.id,
					},
				})

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
						selectedPersons.push(person.id)
					} else {
						selectedPersons = selectedPersons.filter(
							(id) => id !== person.id,
						)
					}
				})
			})
		}

		const createTask = async () => {
			if (!title.trim()) {
				new Notice(t('CREATE_TASK_ERROR_TITLE'))
				return
			}

			const folder = board.folderNotes
			const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, '-')
			let filePath = sanitizedTitle.endsWith('.md')
				? sanitizedTitle
				: `${sanitizedTitle}.md`

			if (folder) {
				const normalizedFolder = folder
					.replace(/^\/+/, '')
					.replace(/\/?$/, '/')
				filePath = `${normalizedFolder}${filePath}`
			}

			const existing = this.app.vault.getFileByPath(filePath)
			if (existing) {
				new Notice(t('CREATE_TASK_ERROR_EXISTS'))
				return
			}

			const folderPath = filePath.includes('/')
				? filePath.substring(0, filePath.lastIndexOf('/'))
				: ''
			if (folderPath && !this.app.vault.getFolderByPath(folderPath)) {
				try {
					await this.app.vault.createFolder(folderPath)
				} catch (err) {
					new Notice(t('CREATE_TASK_ERROR_CREATE'))
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
						const tagValue = board.tagNotes.replace('#', '')
						fm['tags'] = [tagValue]
						const stateKey = board.propertyState || 'state'
						fm[stateKey] = state
						if (description.trim()) {
							fm[board.propertyDescription || 'description'] =
								description.trim()
						}
						if (category.trim()) {
							fm[board.propertyCategory || 'category'] =
								category.trim()
						}
						if (selectedPersons.length > 0) {
							fm[board.propertyAssignee || 'assignee'] =
								selectedPersons
						}
						const column = board.columns.find((c) => c.id === state)
						const today = new Date().toISOString().split('T')[0]
						fm['history'] = [
							{
								state: column?.title || state,
								stateId: state,
								date: today,
								from: '',
							},
						]
					},
				)
				new Notice(t('CREATE_TASK_SUCCESS'))
				this.close()
			} catch (err) {
				new Notice(t('CREATE_TASK_ERROR_CREATE'))
				console.error('Error creating task:', err)
			}
		}

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText(t('CREATE_TASK_CANCEL'))
				btn.onClick(() => this.close())
			})
			.addButton((btn) => {
				btn.setCta()
				btn.setButtonText(t('CREATE_TASK_CONFIRM'))
				btn.onClick(createTask)
			})
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
