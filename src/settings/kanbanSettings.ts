import { t } from '../lang/helpers' // Importamos la función de traducción

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

export interface IKanbanSettings {
	tagNotes: string
	folderNotes: string
	propertyState: string
	propertyDescription: string
	propertyCategory: string
	columns: IColumn[]
	categories: ICategory[]
	completedColumn: ICompletedColumn
}

export const DEFAULT_SETTINGS: IKanbanSettings = {
	tagNotes: '#task',
	folderNotes: '',
	propertyState: 'state',
	propertyDescription: 'description',
	propertyCategory: 'category',
	columns: [
		{
			id: 'pending',
			icon: 'clock',
			title: t('COLUMN_PENDING'),
			color: '#ac46ff',
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
		{
			id: 'canceled',
			icon: 'x',
			title: t('COLUMN_CANCELED'),
			color: '#e74c3c',
		},
	],
	categories: [],
	completedColumn: {
		id: 'completed',
		icon: 'check-check',
		title: t('COLUMN_COMPLETED'),
		color: '#27ae60',
		limitDate: TimeOptions.week,
	},
}
