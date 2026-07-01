import { moment } from 'obsidian'

// 1. Definimos los diccionarios para cada idioma
const AUTHORS_LANGS = {
	en: {
		TAG_LABEL: 'Project Tag',
		TAG_DESC: 'The tag that notes must have to appear on the Kanban board.',
		COLUMN_NAME: 'Column',
		COLUMNS_TITLE: 'Board Columns',
		COLUMN_CANCELED: 'Canceled',
		COLUMN_PENDING: 'Pending',
		COLUMN_WORKING_ON: 'Working On',
		COLUMN_REVIEW: 'Review',
		COLUMN_DONE: 'Done',
		ADD_COLUMN_BTN: '+ Add Column',
		DELETE_BTN: 'Delete',
		NEW_COLUMN_PLACEHOLDER: 'New Column',
		VIEW_TITLE: 'Kanban Moonlight Board',
		FILTER_NOTICE: 'Board: Filtering by',
		MOVED_NOTE_TO: 'Note moved to',
		NOTE_NOT_FOUND: 'Note not found.',
		SEARCH_PLACEHOLDER: 'Search...',
		SELECT_ICON: 'Change Icon',
	},
	es: {
		TAG_LABEL: 'Etiqueta de Proyectos',
		TAG_DESC:
			'La etiqueta (tag) que deben tener tus notas para aparecer en el Kanban.',
		COLUMN_NAME: 'Columna',
		COLUMNS_TITLE: 'Columnas del Tablero',
		COLUMN_CANCELED: 'Cancelado',
		COLUMN_PENDING: 'Pendiente',
		COLUMN_REVIEW: 'Revisión',
		COLUMN_WORKING_ON: 'En Progreso',
		COLUMN_DONE: 'Completado',
		ADD_COLUMN_BTN: '+ Añadir Columna',
		DELETE_BTN: 'Eliminar',
		NEW_COLUMN_PLACEHOLDER: 'Nueva Columna',
		VIEW_TITLE: 'Kanban Moonlight Tablero',
		FILTER_NOTICE: 'Tablero: Filtrando por',
		MOVED_NOTE_TO: 'Nota movida a',
		NOTE_NOT_FOUND: 'Nota no encontrada.',
		SEARCH_PLACEHOLDER: 'Buscar...',
		SELECT_ICON: 'Cambiar icono',
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
