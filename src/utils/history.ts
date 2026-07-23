import type {
	HistoryEvent,
	LegacyHistoryEntry,
} from '../types/history'
import type { SafeFrontmatter } from './frontmatter'
import { getFmRecordArray } from './frontmatter'

function migrateLegacyEntry(
	entry: Record<string, string> | LegacyHistoryEntry,
): HistoryEvent {
	if (
		'type' in entry &&
		typeof entry.type === 'string'
	) {
		return entry as unknown as HistoryEvent
	}

	const state = 'state' in entry ? entry.state : undefined
	const from = 'from' in entry ? entry.from : undefined
	const date = 'date' in entry ? entry.date : undefined

	const dateStr = date || new Date().toISOString().split('T')[0] || ''

	if (state !== undefined && from !== undefined) {
		return {
			type: 'state_changed',
			date: dateStr,
			from,
			to: state,
		}
	}

	return {
		type: 'state_changed',
		date: dateStr,
		from: '',
		to: state || '',
	}
}

export function getHistory(fm: SafeFrontmatter): HistoryEvent[] {
	const raw = getFmRecordArray(fm, 'history')
	return raw.map(migrateLegacyEntry)
}

export function pushHistoryEvent(
	fm: Record<string, unknown>,
	event: HistoryEvent,
	maxEvents: number,
): void {
	const raw = getFmRecordArray(fm, 'history')
	const migrated = raw.map(migrateLegacyEntry)
	migrated.push(event)

	const trimmed =
		maxEvents > 0 ? migrated.slice(-maxEvents) : migrated

	fm['history'] = trimmed
}

export function getToday(): string {
	return new Date().toISOString().split('T')[0] || ''
}
