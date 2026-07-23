import { App, Modal, PluginSettingTab, Setting, setIcon, Notice } from 'obsidian'
import type KanbanMoonlight from '../main'
import { t } from '../lang/helpers'
import { IBoard } from './kanbanSettings'
import { renderCategorySettings } from './renderSettings/categorySettings'
import { renderColumnSettings } from './renderSettings/columnSettings'
import { renderCompletedSettings } from './renderSettings/completedSettings'
import { renderPersonSettings } from './renderSettings/personSettings'
import { BoardModal } from '../ui/boardModal'

export class KanbanMoonlightSettingTab extends PluginSettingTab {
	plugin: KanbanMoonlight

	constructor(app: App, plugin: KanbanMoonlight) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		containerEl.addClass('kanban-settings-container')

		const boards = this.plugin.settings.boards
		const activeBoardId = this.plugin.settings.activeBoardId
		const board = this.plugin.getActiveBoard()

		new Setting(containerEl).setName(t('VIEW_TITLE')).setHeading()

		const boardSelector = new Setting(containerEl)
			.setName(t('SETTINGS_BOARD_SELECT'))
			.setDesc(t('SETTINGS_BOARD_SELECT_DESC'))
			.setClass('kanban-setting-section')
			.addDropdown((dropdown) => {
				boards.forEach((b) => {
					dropdown.addOption(b.id, b.name)
				})
				dropdown.setValue(activeBoardId)
				dropdown.onChange(async (value) => {
					this.plugin.settings.activeBoardId = value
					await this.plugin.saveSettings()
					this.display()
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

		void boardSelector

		containerEl.createEl('div', {
			cls: 'kanban-settings-board-name',
			text: `${t('SETTINGS_BOARD_CURRENT')}: ${board.name}`,
		})

		if (boards.length > 1) {
			const deleteBoardSetting = new Setting(containerEl)
				.setName(t('SETTINGS_DELETE_BOARD'))
				.setDesc(t('SETTINGS_DELETE_BOARD_DESC'))
				.setClass('kanban-setting-section')
				.addButton((btn) => {
					btn
						.setButtonText(t('DELETE_BTN'))
						.setWarning()
						.onClick(() => {
							new DeleteBoardConfirmModal(
								this.app,
								this.plugin,
								board,
								() => this.display(),
							).open()
						})
				})

			void deleteBoardSetting
		}

		const propertiesContainer = containerEl.createEl('div', {
			cls: 'kanban-properties-collapsible',
		})

		const propertiesHeader = propertiesContainer.createEl('div', {
			cls: 'kanban-properties-header',
		})

		const propertiesToggle = propertiesHeader.createEl('span', {
			cls: 'kanban-properties-toggle',
		})
		setIcon(propertiesToggle, 'chevron-right')

		propertiesHeader.createEl('span', {
			text: t('PROPERTIES_TITLE'),
			cls: 'kanban-properties-title',
		})

		const propertiesContent = propertiesContainer.createEl('div', {
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
				propertiesContainer.classList.remove('kanban-properties-expanded')
				setIcon(propertiesToggle, 'chevron-right')
			} else {
				propertiesContainer.classList.add('kanban-properties-expanded')
				setIcon(propertiesToggle, 'chevron-down')
			}
		})

		renderColumnSettings(this.plugin, containerEl, this.display.bind(this))

		renderCompletedSettings(
			this.plugin,
			containerEl,
			this.display.bind(this),
		)

		renderCategorySettings(
			this.plugin,
			containerEl,
			this.display.bind(this),
		)

		renderPersonSettings(
			this.plugin,
			containerEl,
			this.display.bind(this),
		)
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

		const buttonContainer = contentEl.createEl('div', {
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
