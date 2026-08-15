import {
	App,
	Modal,
	PluginSettingTab,
	Setting,
	setIcon,
	Notice,
	type SettingDefinitionItem,
} from 'obsidian'
import type KanbanMoonlight from '../main'
import { t } from '../lang/helpers'
import { IBoard, IPerson, TimeOptions } from './kanbanSettings'
import { IconSuggestModal } from './renderSettings/iconSuggestModal'
import { BoardModal, PersonModal } from '../ui/boardModal'
import { getContrastColor } from '../utils/color'

const moveArrayElement = <T>(items: T[], index: number, newIndex: number) => {
	const [itemToMove] = items.splice(index, 1)
	if (!itemToMove) return
	items.splice(newIndex, 0, itemToMove)
}

export class KanbanMoonlightSettingTab extends PluginSettingTab {
	plugin: KanbanMoonlight

	constructor(app: App, plugin: KanbanMoonlight) {
		super(app, plugin)
		this.plugin = plugin
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const board = this.plugin.getActiveBoard()
		return [
			{
				name: t('SETTINGS_BOARD_SELECT'),
				desc: `${t('SETTINGS_BOARD_SELECT_DESC')} ${t('SETTINGS_BOARD_CURRENT')}: ${board.name}`,
				render: (setting) => {
					setting.controlEl.empty()
					setting.setClass('kanban-setting-section')
					this.renderBoardSettings(setting)
				},
			},
			{
				name: t('PROPERTIES_TITLE'),
				desc: t('PROPERTIES_TITLE'),
				render: (setting) => {
					setting.controlEl.empty()
					setting.setClass('kanban-setting-section')
					this.renderPropertiesSection(setting)
				},
			},
			{
				name: t('COLUMNS_TITLE'),
				render: (setting) => {
					setting.controlEl.empty()
					setting.setClass('kanban-setting-section')
					this.renderColumnSettingsSection(setting)
				},
			},
			{
				name: t('COMPLETE_SETTING_BASIC'),
				render: (setting) => {
					setting.controlEl.empty()
					setting.setClass('kanban-setting-section')
					this.renderCompletedSettingsSection(setting)
				},
			},
			{
				name: t('CATEGORIES_TITLE'),
				render: (setting) => {
					setting.controlEl.empty()
					setting.setClass('kanban-setting-section')
					this.renderCategorySettingsSection(setting)
				},
			},
			{
				name: t('PEOPLE_FOLDER'),
				render: (setting) => {
					setting.controlEl.empty()
					this.renderPeopleFolderSetting(setting)
				},
			},
			{
				name: t('PERSONS_TITLE'),
				render: (setting) => {
					setting.controlEl.empty()
					setting.setClass('kanban-setting-section')
					this.renderPersonSettingsSection(setting)
				},
			},
		]
	}

	private renderBoardSettings(setting: Setting) {
		const boards = this.plugin.settings.boards
		const activeBoardId = this.plugin.settings.activeBoardId
		const board = this.plugin.getActiveBoard()

		setting.clear()

		setting
			.addDropdown((dropdown) => {
				boards.forEach((b) => {
					dropdown.addOption(b.id, b.name)
				})
				dropdown.setValue(activeBoardId)
				dropdown.onChange(async (value) => {
					this.plugin.settings.activeBoardId = value
					await this.plugin.saveSettings()
					this.update()
				})
			})
			.addButton((btn) => {
				btn.setIcon('pencil')
				btn.setTooltip(t('BOARD_MODAL_EDIT'))
				btn.onClick(() => {
					new BoardModal(this.app, this.plugin, board).open()
				})
			})
			.addButton((btn) => {
				btn.setIcon('plus')
				btn.setTooltip(t('ADD_BOARD'))
				btn.onClick(() => {
					new BoardModal(this.app, this.plugin).open()
				})
			})

		if (boards.length > 1) {
			setting.addButton((btn) => {
				btn.setButtonText(t('DELETE_BTN'))
					.setClass('kanban-setting-section__delete-btn')
					.setTooltip(t('SETTINGS_DELETE_BOARD'))
					.setDestructive()
					.onClick(() => {
						new DeleteBoardConfirmModal(
							this.app,
							this.plugin,
							board,
							() => this.update(),
						).open()
					})

				const spanIcon = btn.buttonEl.createEl('i')

				setIcon(spanIcon, 'trash')
			})
		}
	}

	private renderPropertiesSection(setting: Setting) {
		const board = this.plugin.getActiveBoard()
		const containerEl = setting.controlEl

		setting.setClass('kanban-setting-section')

		containerEl.addClass('kanban-setting-section')

		const propertiesContainer = containerEl.createDiv({
			cls: 'kanban-properties-collapsible',
		})

		const propertiesHeader = propertiesContainer.createDiv({
			cls: 'kanban-properties-header',
		})

		const propertiesToggle = propertiesHeader.createSpan({
			cls: 'kanban-properties-toggle',
		})
		setIcon(propertiesToggle, 'chevron-right')

		propertiesHeader.createSpan({
			text: t('PROPERTIES_TITLE'),
			cls: 'kanban-properties-title',
		})

		const propertiesContent = propertiesContainer.createDiv({
			cls: 'kanban-properties-content',
		})

		new Setting(propertiesContent)
			.setName(t('PROPERTY_STATE'))
			.setDesc(board.propertyState)
			.setClass('kanban-setting-section')

		new Setting(propertiesContent)
			.setName(t('PROPERTY_DESCRIPTION'))
			.setDesc(board.propertyDescription)
			.setClass('kanban-setting-section')

		new Setting(propertiesContent)
			.setName(t('PROPERTY_CATEGORY'))
			.setDesc(board.propertyCategory)
			.setClass('kanban-setting-section')

		propertiesContent.createEl('p', {
			text: t('PROPERTIES_NOTE'),
			cls: 'kanban-setting-note',
		})

		propertiesHeader.addEventListener('click', () => {
			const isExpanded = propertiesContainer.classList.contains(
				'kanban-properties-expanded',
			)
			if (isExpanded) {
				propertiesContainer.classList.remove(
					'kanban-properties-expanded',
				)
				setIcon(propertiesToggle, 'chevron-right')
			} else {
				propertiesContainer.classList.add('kanban-properties-expanded')
				setIcon(propertiesToggle, 'chevron-down')
			}
		})
	}

	private renderColumnSettingsSection(setting: Setting) {
		const board = this.plugin.getActiveBoard()
		const columnsSection = setting.controlEl

		columnsSection.addClass('kanban-setting-section')

		board.columns.forEach((column, index) => {
			const section = columnsSection.createDiv({
				cls: 'kanban-setting-card',
			})

			const nameRow = section.createDiv({ cls: 'kanban-card-row' })
			const nameInput = nameRow.createEl('input', {
				cls: 'kanban-card-input',
				attr: {
					type: 'text',
					value: column.title,
					placeholder: t('NEW_COLUMN_PLACEHOLDER'),
				},
			})
			nameInput.addEventListener('change', () => {
				board.columns[index]!.title = nameInput.value
				void this.plugin.saveSettings()
			})

			const actionsRow = section.createDiv({
				cls: 'kanban-card-row',
			})

			const iconBtn = actionsRow.createEl('button', {
				cls: 'kanban-card-icon-btn',
				attr: { title: t('SELECT_ICON') },
			})
			setIcon(iconBtn, column.icon)
			iconBtn.addEventListener('click', () => {
				new IconSuggestModal(this.plugin.app, (selectedIcon) => {
					board.columns[index]!.icon = selectedIcon
					void this.plugin.saveSettings()
					this.update()
				}).open()
			})

			const colorPicker = actionsRow.createEl('input', {
				cls: 'kanban-card-color',
				attr: { type: 'color', value: column.color },
			})
			colorPicker.addEventListener('input', () => {
				board.columns[index]!.color = colorPicker.value
				void this.plugin.saveSettings()
			})

			actionsRow.createSpan({ cls: 'kanban-card-spacer' })

			if (index !== 0) {
				const upBtn = actionsRow.createEl('button', {
					cls: 'kanban-card-action-btn',
					attr: { title: 'Move up' },
				})
				setIcon(upBtn, 'up-chevron-glyph')
				upBtn.addEventListener('click', () => {
					moveArrayElement(board.columns, index, index - 1)
					void this.plugin.saveSettings()
					this.update()
				})
			}

			if (index !== board.columns.length - 1) {
				const downBtn = actionsRow.createEl('button', {
					cls: 'kanban-card-action-btn',
					attr: { title: 'Move down' },
				})
				setIcon(downBtn, 'down-chevron-glyph')
				downBtn.addEventListener('click', () => {
					moveArrayElement(board.columns, index, index + 1)
					void this.plugin.saveSettings()
					this.update()
				})
			}

			const deleteBtn = actionsRow.createEl('button', {
				cls: 'kanban-card-action-btn kanban-card-action-btn--danger',
				attr: { title: t('DELETE_BTN') },
			})
			setIcon(deleteBtn, 'trash')
			deleteBtn.addEventListener('click', () => {
				board.columns.splice(index, 1)
				void this.plugin.saveSettings()
				this.update()
			})
		})

		setting.addButton((btn) =>
			btn
				.setButtonText(t('ADD_COLUMN_BTN'))
				.setCta()
				.onClick(() => {
					const nuevoId = `col-${Date.now()}`
					board.columns.push({
						id: nuevoId,
						icon: 'plus',
						title: '',
						color: '#ffffff',
					})
					void this.plugin.saveSettings()
					this.update()
				}),
		)
	}

	private renderCompletedSettingsSection(setting: Setting) {
		const board = this.plugin.getActiveBoard()

		setting
			.setName(t('COMPLETE_SETTING_BASIC'))
			.setDesc(t('COMPLETE_SETTING_BASIC_DESC'))
			.setClass('kanban-setting-section')
			.addButton((button) => {
				button.setButtonText('')
				button.setIcon(board.completedColumn.icon)
				button.setTooltip(t('SELECT_ICON'))
				button.onClick(() => {
					new IconSuggestModal(this.plugin.app, (selectedIcon) => {
						board.completedColumn.icon = selectedIcon
						void this.plugin.saveSettings()
						this.update()
					}).open()
				})
			})
			.addColorPicker((colorPicker) =>
				colorPicker
					.setValue(board.completedColumn.color)
					.onChange(async (value) => {
						board.completedColumn.color = value
						await this.plugin.saveSettings()
					}),
			)

		setting
			.setName(t('COMPLETE_SETTING_TIME'))
			.setDesc(t('COMPLETE_SETTING_TIME_DESC'))
			.setClass('kanban-setting-section')
			.addDropdown((dropdownComponent) => {
				dropdownComponent
					.addOption(TimeOptions.day.toString(), t('DAY'))
					.addOption(TimeOptions.week.toString(), t('WEEK'))
					.addOption(TimeOptions.month.toString(), t('MONTH'))
					.addOption(TimeOptions.year.toString(), t('YEAR'))
					.setValue(
						board.completedColumn.limitDate
							? board.completedColumn.limitDate.toString()
							: TimeOptions.week.toString(),
					)
					.onChange(async (value) => {
						board.completedColumn.limitDate = parseInt(value)
						await this.plugin.saveSettings()
					})
			})
	}

	private renderCategorySettingsSection(setting: Setting) {
		const board = this.plugin.getActiveBoard()
		const containerEl = setting.controlEl

		containerEl.addClass('kanban-setting-section')

		board.categories.forEach((category, index) => {
			const section = containerEl.createDiv({
				cls: 'kanban-setting-card',
			})

			const nameRow = section.createDiv({ cls: 'kanban-card-row' })
			const nameInput = nameRow.createEl('input', {
				cls: 'kanban-card-input',
				attr: {
					type: 'text',
					value: category.name,
					placeholder: t('NEW_CATEGORY_PLACEHOLDER'),
				},
			})
			nameInput.addEventListener('change', () => {
				board.categories[index]!.name = nameInput.value
				void this.plugin.saveSettings()
			})

			const actionsRow = section.createDiv({
				cls: 'kanban-card-row',
			})

			const iconBtn = actionsRow.createEl('button', {
				cls: 'kanban-card-icon-btn',
				attr: { title: t('SELECT_ICON') },
			})
			setIcon(iconBtn, category.icon || 'tag')
			iconBtn.addEventListener('click', () => {
				new IconSuggestModal(this.plugin.app, (selectedIcon) => {
					board.categories[index]!.icon = selectedIcon
					void this.plugin.saveSettings()
					this.update()
				}).open()
			})

			const colorPicker = actionsRow.createEl('input', {
				cls: 'kanban-card-color',
				attr: { type: 'color', value: category.color },
			})
			colorPicker.addEventListener('input', () => {
				board.categories[index]!.color = colorPicker.value
				void this.plugin.saveSettings()
			})

			actionsRow.createSpan({ cls: 'kanban-card-spacer' })

			const deleteBtn = actionsRow.createEl('button', {
				cls: 'kanban-card-action-btn kanban-card-action-btn--danger',
				attr: { title: t('DELETE_BTN') },
			})
			setIcon(deleteBtn, 'trash')
			deleteBtn.addEventListener('click', () => {
				board.categories.splice(index, 1)
				void this.plugin.saveSettings()
				this.update()
			})
		})

		setting.addButton((btn) =>
			btn
				.setButtonText(t('ADD_CATEGORY_BTN'))
				.setCta()
				.onClick(() => {
					const nuevoId = `cat-${Date.now()}`
					board.categories.push({
						id: nuevoId,
						name: '',
						color: '#ffffff',
						icon: 'tag',
					})
					void this.plugin.saveSettings()
					this.update()
				}),
		)
	}

	private renderPeopleFolderSetting(setting: Setting) {
		setting.addText((text) => {
			text.setPlaceholder(t('PEOPLE_FOLDER_PLACEHOLDER'))
				.setValue(this.plugin.settings.peopleFolder)
				.onChange(async (value) => {
					this.plugin.settings.peopleFolder = value
					await this.plugin.saveSettings()
				})
		})
	}

	private renderPersonSettingsSection(setting: Setting) {
		const containerEl = setting.controlEl

		const peopleSection = containerEl.createDiv({
			cls: 'kanban-properties-collapsible',
		})

		const peopleHeader = peopleSection.createDiv({
			cls: 'kanban-properties-header',
		})

		const peopleToggle = peopleHeader.createSpan({
			cls: 'kanban-properties-toggle',
		})

		setIcon(peopleToggle, 'chevron-right')

		peopleHeader.createSpan({
			text: t('PERSONS_TITLE'),
			cls: 'kanban-properties-title',
		})

		const peopleContent = peopleSection.createDiv({
			cls: 'kanban-properties-content',
		})

		peopleHeader.addEventListener('click', () => {
			peopleSection.classList.toggle('kanban-properties-expanded')
		})

		const renderPeopleList = () => {
			const existingList = peopleContent.querySelector(
				'.kanban-people-global-list',
			)
			if (existingList) {
				existingList.remove()
			}

			const peopleList = peopleContent.createDiv({
				cls: 'kanban-people-global-list',
			})

			if (this.plugin.settings.people.length === 0) {
				peopleList.createEl('p', {
					text: t('PERSON_NONE'),
					cls: 'kanban-setting-note',
				})
			} else {
				this.plugin.settings.people.forEach((person, index) => {
					const personEl = peopleList.createDiv({
						cls: 'kanban-setting-card',
					})

					const personHeader = personEl.createDiv({
						cls: 'kanban-card-row',
					})

					const avatarEl = personHeader.createDiv({
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

					personHeader.createSpan({
						text: person.name,
						cls: 'kanban-person-name',
					})

					const spacer = personHeader.createDiv({
						cls: 'kanban-card-spacer',
					})
					void spacer

					const editBtn = personHeader.createEl('button', {
						cls: 'kanban-card-action-btn',
					})
					setIcon(editBtn, 'pencil')
					editBtn.addEventListener('click', () => {
						const modal = new PersonModal(
							this.plugin.app,
							this.plugin,
							person,
							this.plugin.settings.peopleFolder,
							(updatedPerson: IPerson) => {
								this.plugin.settings.people[index] =
									updatedPerson
								void this.plugin.saveSettings()
								renderPeopleList()
							},
						)
						modal.open()
					})

					const deleteBtn = personHeader.createEl('button', {
						cls: 'kanban-card-action-btn kanban-card-action-btn--danger',
					})
					setIcon(deleteBtn, 'trash-2')
					deleteBtn.addEventListener('click', () => {
						this.plugin.settings.people.splice(index, 1)
						void this.plugin.saveSettings()
						renderPeopleList()
					})
				})
			}

			const addPersonBtn = peopleList.createEl('button', {
				cls: 'kanban-new-task-btn',
				text: t('ADD_PERSON_BTN'),
			})
			addPersonBtn.addEventListener('click', () => {
				const modal = new PersonModal(
					this.plugin.app,
					this.plugin,
					null,
					this.plugin.settings.peopleFolder,
					(person: IPerson) => {
						this.plugin.settings.people.push(person)
						void this.plugin.saveSettings()
						renderPeopleList()
					},
				)
				modal.open()
			})
		}

		renderPeopleList()
	}
}

class DeleteBoardConfirmModal extends Modal {
	plugin: KanbanMoonlight
	board: IBoard
	onConfirm: () => void

	constructor(
		app: App,
		plugin: KanbanMoonlight,
		board: IBoard,
		onConfirm: () => void,
	) {
		super(app)
		this.plugin = plugin
		this.board = board
		this.onConfirm = onConfirm
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.empty()

		this.titleEl.setText(t('DELETE_CONFIRM'))

		contentEl.createEl('p', {
			text: t('SETTINGS_DELETE_BOARD_CONFIRM').replace(
				'{name}',
				this.board.name,
			),
		})

		const buttonContainer = contentEl.createDiv({
			cls: 'kanban-board-modal-footer',
		})

		const cancelBtn = buttonContainer.createEl('button', {
			text: t('CREATE_TASK_CANCEL'),
		})
		cancelBtn.addEventListener('click', () => this.close())

		const deleteBtn = buttonContainer.createEl('button', {
			cls: 'mod-danger',
			text: t('DELETE_CONFIRM_YES'),
		})
		deleteBtn.addEventListener('click', () => {
			void this.deleteBoard()
		})
	}

	private async deleteBoard() {
		const boards = this.plugin.settings.boards
		const index = boards.findIndex((b) => b.id === this.board.id)

		if (index === -1) return

		boards.splice(index, 1)

		if (this.plugin.settings.activeBoardId === this.board.id) {
			this.plugin.settings.activeBoardId = boards[0]?.id || 'default'
		}

		await this.plugin.saveSettings()
		new Notice(t('BOARD_MODAL_DELETED'))
		this.close()
		this.onConfirm()
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
