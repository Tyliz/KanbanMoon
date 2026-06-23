export interface Columna {
	id: string;
	titulo: string;
}

export interface IKanbanSettings {
	tagProyectos: string;
	columnas: Columna[];
}

export const DEFAULT_SETTINGS: IKanbanSettings = {
	tagProyectos: '#project',
	columnas: [
		{ id: 'pending', titulo: 'Pending' },
		{ id: 'workingOn', titulo: 'Working On' },
		{ id: 'done', titulo: 'Done' },
	],
};
