import { moment } from 'obsidian'

// 1. Definimos los diccionarios para cada idioma
const AUTHORS_LANGS = {
	en: {
		TAG_LABEL: 'Project Tag',
		TAG_DESC: 'The tag that notes must have to appear on the Kanban board.',
		FOLDER_LABEL: 'Project Folder',
		FOLDER_DESC: 'Optional folder path. Notes inside will appear on the board. Leave empty to use only the tag.',
		COLUMN_NAME: 'Column',
		COLUMNS_TITLE: 'Board Columns',
		COLUMN_CANCELED: 'Canceled',
		COLUMN_PENDING: 'Pending',
		COLUMN_WORKING_ON: 'Working On',
		COLUMN_REVIEW: 'Review',
		COLUMN_COMPLETED: 'Completed',
		COMPLETE_NOTE: 'Complete',
		COMPLETED_SETTINGS_TITLE: 'Settings for completed column',
		COMPLETE_SETTING_BASIC: 'Completed column style',
		COMPLETE_SETTING_BASIC_DESC: `Icon and color for 'completed' column`,
		COMPLETE_SETTING_TIME: 'Historical task limit',
		COMPLETE_SETTING_TIME_DESC:
			'Define how far back in time your past tasks will be displayed.',
		DAY: 'Day',
		ADD_COLUMN_BTN: '+ Add Column',
		DELETE_BTN: 'Delete',
		EMPTY_COLUMN: 'No tasks',
		NEW_COLUMN_PLACEHOLDER: 'New Column',
		VIEW_TITLE: 'Kanban Moonlight Board',
		FILTER_NOTICE: 'Board: Filtering by',
		MOVED_NOTE_TO: 'Note moved to',
		NOTE_NOT_FOUND: 'Note not found.',
		SEARCH_PLACEHOLDER: 'Search...',
		SELECT_ICON: 'Change Icon',
		TYPES_TITLE: 'Types',
		ADD_TYPE_BTN: '+ Add Type',
		TYPE_NAME: 'Type Name',
		TYPE_COLOR: 'Type Color',
		TYPE_ICON: 'Type Icon',
		MONTH: 'Month',
		NEW_TYPE_PLACEHOLDER: 'New Type',
		NOTICE_COMPLETED: 'Note was marked as completed',
		WEEK: 'Week',
		YEAR: 'Year',
	},
	es: {
		TAG_LABEL: 'Etiqueta de Proyectos',
		TAG_DESC:
			'La etiqueta (tag) que deben tener tus notas para aparecer en el Kanban.',
		FOLDER_LABEL: 'Carpeta de Proyectos',
		FOLDER_DESC:
			'Ruta de carpeta opcional. Las notas dentro aparecerán en el tablero. Dejar vacío para usar solo la etiqueta.',
		COLUMN_NAME: 'Columna',
		COLUMNS_TITLE: 'Columnas del Tablero',
		COLUMN_CANCELED: 'Cancelado',
		COLUMN_PENDING: 'Pendiente',
		COLUMN_REVIEW: 'Revisión',
		COLUMN_WORKING_ON: 'En Progreso',
		COLUMN_COMPLETED: 'Completado',
		COMPLETE_NOTE: 'Completar',
		COMPLETED_SETTINGS_TITLE:
			'Configuraciones para la columna de completado',
		COMPLETE_SETTING_BASIC: 'Estilos de la columna de completados',
		COMPLETE_SETTING_BASIC_DESC: `Cambia el icono y color de la columna de 'completado'`,
		COMPLETE_SETTING_TIME: 'Límite de tareas históricas',
		COMPLETE_SETTING_TIME_DESC:
			'Define hasta qué punto en el tiempo se mostrarán tus tareas anteriores.',
		DAY: 'Día',
		ADD_COLUMN_BTN: '+ Añadir Columna',
		DELETE_BTN: 'Eliminar',
		EMPTY_COLUMN: 'Sin tareas',
		VIEW_TITLE: 'Tablero Kanban Moonlight',
		FILTER_NOTICE: 'Tablero: Filtrando por',
		MOVED_NOTE_TO: 'Nota movida a',
		NOTE_NOT_FOUND: 'Nota no encontrada.',
		SEARCH_PLACEHOLDER: 'Buscar...',
		SELECT_ICON: 'Cambiar icono',
		TYPES_TITLE: 'Tipos',
		ADD_TYPE_BTN: '+ Añadir Tipo',
		TYPE_NAME: 'Nombre del Tipo',
		TYPE_COLOR: 'Color del Tipo',
		TYPE_ICON: 'Icono del Tipo',
		MONTH: 'Mes',
		NEW_COLUMN_PLACEHOLDER: 'Nueva Columna',
		NEW_TYPE_PLACEHOLDER: 'Nuevo Tipo',
		NOTICE_COMPLETED: 'La nota fue completada',
		WEEK: 'Semana',
		YEAR: 'Año',
	},
}

// 2. Detectamos el idioma actual de Obsidian usando 'moment' (incluido en Obsidian)
const lang = moment.locale()

let locale: (typeof AUTHORS_LANGS)['en']

// 3. Asignamos el idioma detectado, o usamos inglés por defecto si no está soportado
if (lang.startsWith('es')) {
	locale = AUTHORS_LANGS.es
} else {
	locale = AUTHORS_LANGS.en
}

// 4. Exportamos una función corta 't' para traducir de forma limpia en el código
export function t(key: keyof (typeof AUTHORS_LANGS)['en']): string {
	return locale[key] || key
}
