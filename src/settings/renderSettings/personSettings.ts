import { Setting, setIcon } from 'obsidian'
import { t } from '../../lang/helpers'
import { getContrastColor } from '../../utils/color'
import { IPerson } from '../kanbanSettings'
import { PersonModal } from '../../ui/boardModal'
import type KanbanMoonlightPlugin from '../../main'

export function renderPersonSettings(
	plugin: KanbanMoonlightPlugin,
	containerEl: HTMLElement,
	onRefresh: () => void,
) {
	const peopleSection = containerEl.createEl('div', {
		cls: 'kanban-properties-collapsible',
	})

	const peopleHeader = peopleSection.createEl('div', {
		cls: 'kanban-properties-header',
	})

	const peopleToggle = peopleHeader.createEl('div', {
		cls: 'kanban-properties-toggle',
	})
	setIcon(peopleToggle, 'chevron-right')

	peopleHeader.createEl('span', {
		text: t('PERSONS_TITLE'),
		cls: 'kanban-properties-title',
	})

	const peopleContent = peopleSection.createEl('div', {
		cls: 'kanban-properties-content',
	})

	peopleHeader.addEventListener('click', () => {
		peopleSection.classList.toggle('kanban-properties-expanded')
	})

	new Setting(peopleContent)
		.setName(t('PEOPLE_FOLDER'))
		.setDesc(t('PEOPLE_FOLDER_DESC'))
		.setClass('kanban-setting-section')
		.addText((text) =>
			text
				.setPlaceholder(t('PEOPLE_FOLDER_PLACEHOLDER'))
				.setValue(plugin.settings.peopleFolder)
				.onChange(async (value) => {
					plugin.settings.peopleFolder = value
					await plugin.saveSettings()
				}),
		)

	const renderPeopleList = () => {
		const existingList = peopleContent.querySelector(
			'.kanban-people-global-list',
		)
		if (existingList) {
			existingList.remove()
		}

		const peopleList = peopleContent.createEl('div', {
			cls: 'kanban-people-global-list',
		})

		if (plugin.settings.people.length === 0) {
			peopleList.createEl('p', {
				text: t('PERSON_NONE'),
				cls: 'kanban-setting-note',
			})
		} else {
			plugin.settings.people.forEach((person, index) => {
				const personEl = peopleList.createEl('div', {
					cls: 'kanban-setting-card',
				})

				const personHeader = personEl.createEl('div', {
					cls: 'kanban-card-row',
				})

				const avatarEl = personHeader.createEl('div', {
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

				personHeader.createEl('span', {
					text: person.name,
					cls: 'kanban-person-name',
				})

				const spacer = personHeader.createEl('div', {
					cls: 'kanban-card-spacer',
				})
				void spacer

				const editBtn = personHeader.createEl('button', {
					cls: 'kanban-card-action-btn',
				})
				setIcon(editBtn, 'pencil')
				editBtn.addEventListener('click', () => {
					const modal = new PersonModal(
						plugin.app,
						plugin,
						person,
						plugin.settings.peopleFolder,
						(updatedPerson: IPerson) => {
							plugin.settings.people[index] = updatedPerson
							void plugin.saveSettings()
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
					plugin.settings.people.splice(index, 1)
					void plugin.saveSettings()
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
				plugin.app,
				plugin,
				null,
				plugin.settings.peopleFolder,
				(person: IPerson) => {
					plugin.settings.people.push(person)
					void plugin.saveSettings()
					renderPeopleList()
				},
			)
			modal.open()
		})
	}

	renderPeopleList()
}
