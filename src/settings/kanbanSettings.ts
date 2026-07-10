import { t } from '../lang/helpers'

export interface IColumn {
	id: string
	icon: string
	title: string
	color: string
}

export enum TimeOptions {
	day,
	week,
	month,
	year,
}

export interface ICompletedColumn extends IColumn {
	limitDate: TimeOptions
}

export interface ICategory {
	id: string
	name: string
	color: string
	icon: string
}

export interface IPerson {
	id: string
	name: string
	email: string
	color: string
	notes: string
}

export interface IBoard {
	id: string
	name: string
	tagNotes: string
	folderNotes: string
	propertyState: string
	propertyDescription: string
	propertyCategory: string
	propertyAssignee: string
	propertyStartDate: string
	propertyDueDate: string
	columns: IColumn[]
	categories: ICategory[]
	completedColumn: ICompletedColumn
}

export const DEFAULT_BOARD_COLUMNS: IColumn[] = [
	{
		id: 'backlog',
		icon: 'inbox',
		title: t('COLUMN_BACKLOG'),
		color: '#ac46ff',
	},
	{
		id: 'todo',
		icon: 'clipboard-list',
		title: t('COLUMN_TODO'),
		color: '#3498db',
	},
	{
		id: 'workingOn',
		icon: 'cog',
		title: t('COLUMN_WORKING_ON'),
		color: '#00a8ff',
	},
	{
		id: 'review',
		icon: 'eye',
		title: t('COLUMN_REVIEW'),
		color: '#f39c12',
	},
]

export const DEFAULT_COMPLETED_COLUMN: ICompletedColumn = {
	id: 'completed',
	icon: 'check-check',
	title: t('COLUMN_COMPLETED'),
	color: '#27ae60',
	limitDate: TimeOptions.week,
}

export const DEFAULT_BOARD: IBoard = {
	id: 'default',
	name: 'Default',
	tagNotes: '#task',
	folderNotes: '',
	propertyState: 'state',
	propertyDescription: 'description',
	propertyCategory: 'category',
	propertyAssignee: 'assignee',
	propertyStartDate: 'startDate',
	propertyDueDate: 'dueDate',
	columns: DEFAULT_BOARD_COLUMNS,
	categories: [],
	completedColumn: DEFAULT_COMPLETED_COLUMN,
}

export enum ViewType {
	kanban = 'kanban',
	gantt = 'gantt',
	dashboard = 'dashboard',
}

export enum GanttZoom {
	day = 'day',
	week = 'week',
	month = 'month',
}

export interface IKanbanSettings {
	boards: IBoard[]
	activeBoardId: string
	people: IPerson[]
	peopleFolder: string
	historyEnabled: boolean
	maxHistoryEvents: number
	globalHistoryLimit: number
	defaultView: ViewType
	ganttZoom: GanttZoom
}

export const DEFAULT_SETTINGS: IKanbanSettings = {
	boards: [DEFAULT_BOARD],
	activeBoardId: 'default',
	people: [],
	peopleFolder: 'people',
	historyEnabled: true,
	maxHistoryEvents: 50,
	globalHistoryLimit: 20,
	defaultView: ViewType.kanban,
	ganttZoom: GanttZoom.week,
}

export function getActiveBoard(settings: IKanbanSettings): IBoard {
	return (
		settings.boards.find((b) => b.id === settings.activeBoardId) ||
		settings.boards[0] ||
		DEFAULT_BOARD
	)
}
