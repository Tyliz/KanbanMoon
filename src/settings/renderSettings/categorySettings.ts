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

	plugin.settings.categories.forEach((category, index) => {
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
			plugin.settings.categories[index]!.name = nameInput.value
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
				plugin.settings.categories[index]!.icon = selectedIcon
				plugin.saveSettings()
				display()
			}).open()
		})

		const colorPicker = actionsRow.createEl('input', {
			cls: 'kanban-card-color',
			attr: { type: 'color', value: category.color },
		})
		colorPicker.addEventListener('input', async () => {
			plugin.settings.categories[index]!.color = colorPicker.value
			await plugin.saveSettings()
		})

		actionsRow.createEl('span', { cls: 'kanban-card-spacer' })

		const deleteBtn = actionsRow.createEl('button', {
			cls: 'kanban-card-action-btn kanban-card-action-btn--danger',
			attr: { title: t('DELETE_BTN') },
		})
		setIcon(deleteBtn, 'trash')
		deleteBtn.addEventListener('click', () => {
			plugin.settings.categories.splice(index, 1)
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
					plugin.settings.categories.push({
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
