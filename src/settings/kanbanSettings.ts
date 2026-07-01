import { t } from '../lang/helpers' // Importamos la función de traducción

export interface Column {
	id: string
	icon: string
	title: string
	color: string
}

export interface IKanbanSettings {
	tagNotes: string
	propertyState: string
	propertyDescription: string
	columns: Column[]
}

export const DEFAULT_SETTINGS: IKanbanSettings = {
	tagNotes: '#project',
	propertyState: 'state',
	propertyDescription: 'description',
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
		{
			id: 'done',
			icon: 'check',
			title: t('COLUMN_DONE'),
			color: '#27ae60',
		},
	],
}
