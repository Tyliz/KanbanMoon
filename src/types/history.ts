export type HistoryEventType =
	| 'created'
	| 'state_changed'
	| 'assignee_changed'
	| 'category_changed'
	| 'comment'

export interface HistoryEventCreated {
	type: 'created'
	date: string
	column: string
}

export interface HistoryEventStateChanged {
	type: 'state_changed'
	date: string
	from: string
	to: string
}

export interface HistoryEventAssigneeChanged {
	type: 'assignee_changed'
	date: string
	added: string[]
	removed: string[]
}

export interface HistoryEventCategoryChanged {
	type: 'category_changed'
	date: string
	from: string
	to: string
}

export interface HistoryEventComment {
	type: 'comment'
	date: string
	note: string
}

export type HistoryEvent =
	| HistoryEventCreated
	| HistoryEventStateChanged
	| HistoryEventAssigneeChanged
	| HistoryEventCategoryChanged
	| HistoryEventComment

export interface LegacyHistoryEntry {
	state?: string
	stateId?: string
	date?: string
	from?: string
	[key: string]: unknown
}
