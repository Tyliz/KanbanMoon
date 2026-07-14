import { App, Modal, setIcon, TFile } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'
import { toSafeFm } from '../utils/frontmatter'
import { getHistory } from '../utils/history'
import type { HistoryEvent } from '../types/history'

export class HistoryModal extends Modal {
	plugin: KanbanMoonlightPlugin
	file: TFile

	constructor(app: App, plugin: KanbanMoonlightPlugin, file: TFile) {
		super(app)
		this.plugin = plugin
		this.file = file
	}

	onOpen() {
		const { contentEl } = this
		contentEl.empty()
		contentEl.addClass('kanban-history-modal')
		this.titleEl.setText(t('HISTORY_TITLE'))

		const board = this.plugin.getActiveBoard()
		const noteCache = this.plugin.app.metadataCache.getFileCache(this.file)
		const fm = toSafeFm(noteCache)
		const history = getHistory(fm)

		if (history.length === 0) {
			contentEl.createEl('p', {
				text: t('HISTORY_EMPTY'),
				cls: 'kanban-history-empty',
			})
			return
		}

		const timelineEl = contentEl.createEl('div', {
			cls: 'kanban-history-timeline',
		})

		const reversed = [...history].reverse()

		reversed.forEach((event) => {
			this.renderEvent(timelineEl, event, board)
		})
	}

	private renderEvent(
		container: HTMLElement,
		event: HistoryEvent,
		board: { columns: Array<{ id: string; title: string; color: string }> },
	) {
		const eventEl = container.createEl('div', {
			cls: 'kanban-history-event',
		})

		const iconEl = eventEl.createEl('div', {
			cls: 'kanban-history-event__icon',
		})

		const contentEl = eventEl.createEl('div', {
			cls: 'kanban-history-event__content',
		})

		eventEl.createEl('div', {
			cls: 'kanban-history-event__date',
			text: event.date,
		})

		switch (event.type) {
			case 'created': {
				setIcon(iconEl, 'plus-circle')
				contentEl.createEl('span', {
					text: t('HISTORY_CREATED'),
					cls: 'kanban-history-event__label',
				})
				contentEl.createEl('span', {
					text: event.column,
					cls: 'kanban-history-event__detail',
				})
				break
			}
			case 'state_changed': {
				setIcon(iconEl, 'arrow-right-circle')
				const text = t('HISTORY_STATE_CHANGED')
					.replace('{from}', event.from)
					.replace('{to}', event.to)
				contentEl.createEl('span', {
					text,
					cls: 'kanban-history-event__label',
				})
				break
			}
			case 'assignee_changed': {
				setIcon(iconEl, 'users')
				contentEl.createEl('span', {
					text: t('HISTORY_ASSIGNEE_CHANGED'),
					cls: 'kanban-history-event__label',
				})

				if (event.added.length > 0) {
					const names = this.resolvePersonNames(event.added)
					contentEl.createEl('div', {
						text: t('HISTORY_ASSIGNEE_ADDED').replace(
							'{names}',
							names,
						),
						cls: 'kanban-history-event__detail kanban-history-event__detail--added',
					})
				}

				if (event.removed.length > 0) {
					const names = this.resolvePersonNames(event.removed)
					contentEl.createEl('div', {
						text: t('HISTORY_ASSIGNEE_REMOVED').replace(
							'{names}',
							names,
						),
						cls: 'kanban-history-event__detail kanban-history-event__detail--removed',
					})
				}
				break
			}
			case 'category_changed': {
				setIcon(iconEl, 'tag')
				const text = t('HISTORY_CATEGORY_CHANGED')
					.replace('{from}', event.from || '—')
					.replace('{to}', event.to || '—')
				contentEl.createEl('span', {
					text,
					cls: 'kanban-history-event__label',
				})
				break
			}
		}
	}

	private resolvePersonNames(ids: string[]): string {
		const people = this.plugin.settings.people
		return ids
			.map((id) => {
				const person = people.find((p) => p.id === id)
				return person?.name || id
			})
			.join(', ')
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
