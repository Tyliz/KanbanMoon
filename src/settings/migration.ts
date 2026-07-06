import {
	IBoard,
	IKanbanSettings,
	DEFAULT_BOARD,
	DEFAULT_BOARD_COLUMNS,
	DEFAULT_COMPLETED_COLUMN,
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
		}
	}

	if (isNewFormat(raw)) {
		return {
			boards: raw.boards,
			activeBoardId: raw.activeBoardId,
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
		}
	}

	return {
		boards: [{ ...DEFAULT_BOARD }],
		activeBoardId: 'default',
	}
}
