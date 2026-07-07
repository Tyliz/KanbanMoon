import { Setting, setIcon } from 'obsidian'
import type KanbanMoonlight from '../../main'
import { t } from '../../lang/helpers'
import { IconSuggestModal } from './iconSuggestModal'

export const renderCategorySettings = (
	plugin: KanbanMoonlight,
	containerEl: HTMLElement,
	display: () => void,
): void => {
	new Setting(containerEl).setName(t('CATEGORIES_TITLE')).setHeading()

	const board = plugin.getActiveBoard()

	board.categories.forEach((category, index) => {
		const section = containerEl.createEl('div', {
			cls: 'kanban-setting-card',
		})

		const nameRow = section.createEl('div', { cls: 'kanban-card-row' })
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
			void plugin.saveSettings()
		})

		const actionsRow = section.createEl('div', { cls: 'kanban-card-row' })

		const iconBtn = actionsRow.createEl('button', {
			cls: 'kanban-card-icon-btn',
			attr: { title: t('SELECT_ICON') },
		})
		setIcon(iconBtn, category.icon || 'tag')
		iconBtn.addEventListener('click', () => {
			new IconSuggestModal(plugin.app, (selectedIcon) => {
				board.categories[index]!.icon = selectedIcon
				void plugin.saveSettings()
				display()
			}).open()
		})

		const colorPicker = actionsRow.createEl('input', {
			cls: 'kanban-card-color',
			attr: { type: 'color', value: category.color },
		})
		colorPicker.addEventListener('input', () => {
			board.categories[index]!.color = colorPicker.value
			void plugin.saveSettings()
		})

		actionsRow.createEl('span', { cls: 'kanban-card-spacer' })

		const deleteBtn = actionsRow.createEl('button', {
			cls: 'kanban-card-action-btn kanban-card-action-btn--danger',
			attr: { title: t('DELETE_BTN') },
		})
		setIcon(deleteBtn, 'trash')
		deleteBtn.addEventListener('click', () => {
			board.categories.splice(index, 1)
			void plugin.saveSettings()
			display()
		})
	})

	new Setting(containerEl)
		.setClass('kanban-setting-section')
		.addButton((btn) =>
			btn
				.setButtonText(t('ADD_CATEGORY_BTN'))
				.setCta()
				.onClick(() => {
					const nuevoId = `cat-${Date.now()}`
					board.categories.push({
						id: nuevoId,
						name: t('NEW_CATEGORY_PLACEHOLDER'),
						color: '#ffffff',
						icon: 'tag',
					})
					void plugin.saveSettings()
					display()
				}),
		)
}
