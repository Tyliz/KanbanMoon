import { App, Modal, Setting, Notice, TFile } from 'obsidian'
import { t } from '../lang/helpers'
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

		let title = ''
		let description = ''
		let category = ''
		let state = this.plugin.settings.columns[0]?.id || 'pending'

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

		contentEl.createEl('hr')

		const descriptionSetting = new Setting(contentEl)
			.setName(t('CREATE_TASK_DESC_LABEL'))
			.setDesc(t('CREATE_TASK_DESC_DESC'))

		const descriptionTextarea = descriptionSetting.descEl.createEl('textarea', {
			cls: 'kanban-create-task-textarea',
			attr: {
				rows: 3,
				placeholder: t('CREATE_TASK_DESC_PLACEHOLDER'),
			},
		})
		descriptionTextarea.addEventListener('input', () => {
			description = descriptionTextarea.value
		})

		contentEl.createEl('hr')

		new Setting(contentEl)
			.setName(t('CREATE_TASK_CATEGORY_LABEL'))
			.addDropdown((dropdown) => {
				dropdown.addOption('', t('CREATE_TASK_CATEGORY_NONE'))
				this.plugin.settings.categories.forEach((cat) => {
					dropdown.addOption(cat.name, cat.name)
				})
				dropdown.onChange((value) => {
					category = value
				})
			})

		new Setting(contentEl)
			.setName(t('CREATE_TASK_STATE_LABEL'))
			.addDropdown((dropdown) => {
				this.plugin.settings.columns.forEach((col) => {
					dropdown.addOption(col.id, col.title)
				})
				dropdown.setValue(state)
				dropdown.onChange((value) => {
					state = value
				})
			})

		contentEl.createEl('hr')

		const createTask = async () => {
				if (!title.trim()) {
					new Notice(t('CREATE_TASK_ERROR_TITLE'))
					return
				}

				const folder = this.plugin.settings.folderNotes
				const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, '-')
				let filePath = sanitizedTitle.endsWith('.md')
					? sanitizedTitle
					: `${sanitizedTitle}.md`

				if (folder) {
					const normalizedFolder = folder.replace(/^\/+/, '').replace(/\/?$/, '/')
					filePath = `${normalizedFolder}${filePath}`
				}

				const existing = this.app.vault.getFileByPath(filePath)
				if (existing) {
					new Notice(t('CREATE_TASK_ERROR_EXISTS'))
					return
				}

				try {
					const file = await this.app.vault.create(filePath, '')
					await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
						const tagValue = this.plugin.settings.tagNotes.replace('#', '')
						frontmatter['tags'] = [tagValue]
						frontmatter[this.plugin.settings.propertyState || 'state'] = state
						if (description.trim()) {
							frontmatter[this.plugin.settings.propertyDescription || 'description'] =
								description.trim()
						}
						if (category.trim()) {
							frontmatter[this.plugin.settings.propertyCategory || 'category'] =
								category.trim()
						}
					})
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
