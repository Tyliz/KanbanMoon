import { setIcon, TFile } from 'obsidian'
import { t } from '../../lang/helpers'
import type KanbanMoonlightPlugin from '../../main'
import { toSafeFm } from '../../utils/frontmatter'
import { getHistory } from '../../utils/history'
import type { HistoryEvent } from '../../types/history'

interface GlobalHistoryEntry {
	noteName: string
	notePath: string
	event: HistoryEvent
}

export function renderHistoryPanel(
	container: HTMLElement,
	plugin: KanbanMoonlightPlugin,
	notes: TFile[],
): void {
	if (!plugin.settings.historyEnabled) return

	const allEntries = collectAllEvents(plugin, notes)

	if (allEntries.length === 0) {
		container.createEl('div', {
			text: t('HISTORY_GLOBAL_EMPTY'),
			cls: 'kanban-history-global__empty',
		})
		return
	}

	const sorted = allEntries
		.sort((a, b) => b.event.date.localeCompare(a.event.date))
		.slice(0, plugin.settings.globalHistoryLimit)

	const listEl = container.createEl('div', {
		cls: 'kanban-history-global__list',
	})

	sorted.forEach((entry) => {
		renderGlobalEvent(listEl, entry, plugin)
	})
}

function collectAllEvents(
	plugin: KanbanMoonlightPlugin,
	notes: TFile[],
): GlobalHistoryEntry[] {
	const entries: GlobalHistoryEntry[] = []

	notes.forEach((note) => {
		const cache = plugin.app.metadataCache.getFileCache(note)
		const fm = toSafeFm(cache)
		const history = getHistory(fm)

		history.forEach((event) => {
			entries.push({
				noteName: note.basename,
				notePath: note.path,
				event,
			})
		})
	})

	return entries
}

function renderGlobalEvent(
	container: HTMLElement,
	entry: GlobalHistoryEntry,
	plugin: KanbanMoonlightPlugin,
) {
	const eventEl = container.createEl('div', {
		cls: 'kanban-history-global__event',
	})

	const iconEl = eventEl.createEl('div', {
		cls: 'kanban-history-global__icon',
	})

	const bodyEl = eventEl.createEl('div', {
		cls: 'kanban-history-global__body',
	})

	const titleEl = bodyEl.createEl('a', {
		text: entry.noteName,
		cls: 'kanban-history-global__title internal-link',
	})
	titleEl.setAttribute('data-href', entry.notePath.replace(/\.md$/, ''))
	titleEl.setAttribute('href', entry.notePath.replace(/\.md$/, ''))
	titleEl.addEventListener('click', () => {
		void (async () => {
			const file = plugin.app.vault.getFileByPath(entry.notePath)
			if (file) {
				const leaf = plugin.app.workspace.getLeaf(true)
				await leaf.openFile(file)
			}
		})()
	})

	const textEl = bodyEl.createEl('div', {
		cls: 'kanban-history-global__text',
	})

	eventEl.createEl('div', {
		cls: 'kanban-history-global__date',
		text: entry.event.date,
	})

	const event = entry.event

	switch (event.type) {
		case 'created': {
			setIcon(iconEl, 'plus-circle')
			textEl.textContent = t('HISTORY_EVENT_CREATED')
				.replace('{title}', '')
				.replace('{column}', event.column)
			break
		}
		case 'state_changed': {
			setIcon(iconEl, 'arrow-right-circle')
			textEl.textContent = t('HISTORY_EVENT_STATE_CHANGED')
				.replace('{title}', '')
				.replace('{from}', event.from)
				.replace('{to}', event.to)
			break
		}
		case 'assignee_changed': {
			setIcon(iconEl, 'users')
			textEl.textContent = t('HISTORY_EVENT_ASSIGNEE_CHANGED')
				.replace('{title}', '')
			break
		}
		case 'category_changed': {
			setIcon(iconEl, 'tag')
			textEl.textContent = t('HISTORY_EVENT_CATEGORY_CHANGED')
				.replace('{title}', '')
			break
		}
	}
}
