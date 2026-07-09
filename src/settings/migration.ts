import {
	IBoard,
	IKanbanSettings,
	DEFAULT_BOARD,
	DEFAULT_BOARD_COLUMNS,
	DEFAULT_COMPLETED_COLUMN,
	IPerson,
} from './kanbanSettings'

interface LegacyKanbanSettings {
	tagNotes?: string
	folderNotes?: string
	propertyState?: string
	propertyDescription?: string
	propertyCategory?: string
	columns?: IBoard['columns']
	categories?: IBoard['categories']
	completedColumn?: IBoard['completedColumn']
}

function isLegacyFormat(
	data: Record<string, unknown>,
): data is Record<string, unknown> & LegacyKanbanSettings {
	return !data.boards && typeof data === 'object' && data !== null
}

function isNewFormat(
	data: Record<string, unknown>,
): data is Record<string, unknown> & IKanbanSettings {
	return (
		Array.isArray(data.boards) &&
		typeof data.activeBoardId === 'string'
	)
}

export function migrateSettings(
	raw: Record<string, unknown> | null,
): IKanbanSettings {
	if (!raw || typeof raw !== 'object') {
		return {
			boards: [{ ...DEFAULT_BOARD }],
			activeBoardId: 'default',
			people: [],
			peopleFolder: 'people',
		}
	}

	if (isNewFormat(raw)) {
		let people: IPerson[] = []
		let peopleFolder = 'people'

		if (Array.isArray(raw.people) && raw.people.length > 0) {
			people = raw.people
			peopleFolder = raw.peopleFolder || 'people'
		} else if (Array.isArray(raw.persons) && raw.persons.length > 0) {
			people = raw.persons as IPerson[]
			peopleFolder = (raw.personsFolder as string) || 'people'
		} else {
			for (const board of raw.boards) {
				const boardData = board as unknown as Record<string, unknown>
				if (
					Array.isArray(boardData.persons) &&
					(boardData.persons as IPerson[]).length > 0
				) {
					people = boardData.persons as IPerson[]
					peopleFolder = (boardData.personsFolder as string) || 'people'
					break
				}
			}
		}

		const boards = raw.boards.map((board) => ({
			...board,
			propertyAssignee:
				(board as unknown as Record<string, unknown>).propertyAssignee || 'assignee',
		})) as IBoard[]

		return {
			boards,
			activeBoardId: raw.activeBoardId,
			people,
			peopleFolder,
		}
	}

	if (isLegacyFormat(raw)) {
		const migratedBoard: IBoard = {
			id: 'default',
			name: 'Default',
			tagNotes:
				(raw.tagNotes as string) || DEFAULT_BOARD.tagNotes,
			folderNotes:
				(raw.folderNotes as string) || DEFAULT_BOARD.folderNotes,
			propertyState:
				(raw.propertyState as string) || DEFAULT_BOARD.propertyState,
			propertyDescription:
				(raw.propertyDescription as string) ||
				DEFAULT_BOARD.propertyDescription,
			propertyCategory:
				(raw.propertyCategory as string) ||
				DEFAULT_BOARD.propertyCategory,
			propertyAssignee: DEFAULT_BOARD.propertyAssignee,
			columns:
				raw.columns && raw.columns.length > 0
					? raw.columns
					: DEFAULT_BOARD_COLUMNS,
			categories: raw.categories || [],
			completedColumn:
				raw.completedColumn ||
				DEFAULT_COMPLETED_COLUMN,
		}

		return {
			boards: [migratedBoard],
			activeBoardId: 'default',
			people: [],
			peopleFolder: 'people',
		}
	}

	return {
		boards: [{ ...DEFAULT_BOARD }],
		activeBoardId: 'default',
		people: [],
		peopleFolder: 'people',
	}
}
