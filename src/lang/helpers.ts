import { moment } from 'obsidian';

// 1. Definimos los diccionarios para cada idioma
const AUTHORS_LANGS = {
	en: {
		TAG_LABEL: 'Project Tag',
		TAG_DESC: 'The tag that notes must have to appear on the Kanban board.',
		COLUMN_NAME: 'Column',
		COLUMNS_TITLE: 'Board Columns',
		ADD_COLUMN_BTN: '+ Add Column',
		DELETE_BTN: 'Delete',
		NEW_COLUMN_PLACEHOLDER: 'New Column',
		VIEW_TITLE: 'Kanban Moonlight Board',
		FILTER_NOTICE: 'Board: Filtering by',
	},
	es: {
		TAG_LABEL: 'Etiqueta de Proyectos',
		TAG_DESC:
			'La etiqueta (tag) que deben tener tus notas para aparecer en el Kanban.',
		COLUMN_NAME: 'Columna',
		COLUMNS_TITLE: 'Columnas del Tablero',
		ADD_COLUMN_BTN: '+ Añadir Columna',
		DELETE_BTN: 'Eliminar',
		NEW_COLUMN_PLACEHOLDER: 'Nueva Columna',
		VIEW_TITLE: 'Kanban Moonlight Tablero',
		FILTER_NOTICE: 'Tablero: Filtrando por',
	},
};

// 2. Detectamos el idioma actual de Obsidian usando 'moment' (incluido en Obsidian)
const lang = moment.locale();

let locale: (typeof AUTHORS_LANGS)['en'];

// 3. Asignamos el idioma detectado, o usamos inglés por defecto si no está soportado
if (lang.startsWith('es')) {
	locale = AUTHORS_LANGS.es;
} else {
	locale = AUTHORS_LANGS.en;
}

// 4. Exportamos una función corta 't' para traducir de forma limpia en el código
export function t(key: keyof (typeof AUTHORS_LANGS)['en']): string {
	return locale[key] || key;
}
