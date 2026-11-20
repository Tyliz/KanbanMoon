import { App, EventRef, Modal, setIcon, TFile } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'
import { toSafeFm } from '../utils/frontmatter'
import { getHistory } from '../utils/history'
import type { HistoryEvent } from '../types/history'
import { CommentModal } from './commentModal'

export class HistoryModal extends Modal {
	plugin: KanbanMoonlightPlugin
	file: TFile
	private timelineHost!: HTMLElement
	private changedRef: EventRef | null = null

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

		const actionsEl = contentEl.createDiv({
			cls: 'kanban-history-modal__actions',
		})

		const addCommentBtn = actionsEl.createEl('button', {
			cls: 'kanban-new-task-btn',
			text: t('HISTORY_COMMENT_ADD'),
		})
		addCommentBtn.addEventListener('click', () => {
			new CommentModal(this.app, this.plugin, this.file, () =>
				this.renderTimeline(),
			).open()
		})

		this.timelineHost = contentEl.createDiv({
			cls: 'kanban-history-modal__timeline',
		})

		this.changedRef = this.plugin.app.metadataCache.on(
			'changed',
			(file) => {
				if (file.path === this.file.path) {
					this.renderTimeline()
				}
			},
		)

		this.renderTimeline()
	}

	private renderTimeline() {
		this.timelineHost.empty()

		const board = this.plugin.getActiveBoard()
		const noteCache = this.plugin.app.metadataCache.getFileCache(this.file)
		const fm = toSafeFm(noteCache)
		const history = getHistory(fm)

		if (history.length === 0) {
			this.timelineHost.createEl('p', {
				text: t('HISTORY_EMPTY'),
				cls: 'kanban-history-empty',
			})
			return
		}

		const timelineEl = this.timelineHost.createDiv({
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
		const eventEl = container.createDiv({
			cls: 'kanban-history-event',
		})

		const iconEl = eventEl.createDiv({
			cls: 'kanban-history-event__icon',
		})

		const contentEl = eventEl.createDiv({
			cls: 'kanban-history-event__content',
		})

		eventEl.createDiv({
			cls: 'kanban-history-event__date',
			text: event.date,
		})

		switch (event.type) {
			case 'created': {
				setIcon(iconEl, 'plus-circle')
				contentEl.createSpan({
					text: t('HISTORY_CREATED'),
					cls: 'kanban-history-event__label',
				})
				contentEl.createSpan({
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
				contentEl.createSpan({
					text,
					cls: 'kanban-history-event__label',
				})
				break
			}
			case 'assignee_changed': {
				setIcon(iconEl, 'users')
				contentEl.createSpan({
					text: t('HISTORY_ASSIGNEE_CHANGED'),
					cls: 'kanban-history-event__label',
				})

				if (event.added.length > 0) {
					const names = this.resolvePersonNames(event.added)
					contentEl.createDiv({
						text: t('HISTORY_ASSIGNEE_ADDED').replace(
							'{names}',
							names,
						),
						cls: 'kanban-history-event__detail kanban-history-event__detail--added',
					})
				}

				if (event.removed.length > 0) {
					const names = this.resolvePersonNames(event.removed)
					contentEl.createDiv({
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
				contentEl.createSpan({
					text,
					cls: 'kanban-history-event__label',
				})
				break
			}
			case 'priority_changed': {
				setIcon(iconEl, 'flag')
				const text = t('HISTORY_PRIORITY_CHANGED')
					.replace('{from}', event.from || '—')
					.replace('{to}', event.to || '—')
				contentEl.createSpan({
					text,
					cls: 'kanban-history-event__label',
				})
				break
			}
			case 'comment': {
				setIcon(iconEl, 'sticky-note')
				contentEl.createSpan({
					text: t('HISTORY_COMMENT'),
					cls: 'kanban-history-event__label',
				})
				contentEl.createDiv({
					text: event.note,
					cls: 'kanban-history-event__detail kanban-history-event__detail--comment',
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
		if (this.changedRef) {
			this.plugin.app.metadataCache.offref(this.changedRef)
			this.changedRef = null
		}

		const { contentEl } = this
		contentEl.empty()
	}
}
