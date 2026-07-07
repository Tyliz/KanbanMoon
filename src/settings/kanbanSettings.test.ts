import { describe, it, expect } from 'vitest'
import {
	getActiveBoard,
	DEFAULT_SETTINGS,
	DEFAULT_BOARD,
	DEFAULT_BOARD_COLUMNS,
	DEFAULT_COMPLETED_COLUMN,
	TimeOptions,
} from './kanbanSettings'

describe('getActiveBoard', () => {
	it('should return the active board by id', () => {
		const settings = {
			boards: [
				{ ...DEFAULT_BOARD, id: 'board-1', name: 'Board 1' },
				{ ...DEFAULT_BOARD, id: 'board-2', name: 'Board 2' },
			],
			activeBoardId: 'board-2',
		}

		const result = getActiveBoard(settings)
		expect(result.id).toBe('board-2')
		expect(result.name).toBe('Board 2')
	})

	it('should return the first board if activeBoardId not found', () => {
		const settings = {
			boards: [
				{ ...DEFAULT_BOARD, id: 'board-1', name: 'Board 1' },
				{ ...DEFAULT_BOARD, id: 'board-2', name: 'Board 2' },
			],
			activeBoardId: 'nonexistent',
		}

		const result = getActiveBoard(settings)
		expect(result.id).toBe('board-1')
	})

	it('should return DEFAULT_BOARD if boards array is empty', () => {
		const settings = {
			boards: [],
			activeBoardId: '',
		}

		const result = getActiveBoard(settings)
		expect(result).toEqual(DEFAULT_BOARD)
	})
})

describe('DEFAULT_SETTINGS', () => {
	it('should have one board', () => {
		expect(DEFAULT_SETTINGS.boards).toHaveLength(1)
	})

	it('should have activeBoardId as default', () => {
		expect(DEFAULT_SETTINGS.activeBoardId).toBe('default')
	})

	it('should have default board with correct properties', () => {
		const board = DEFAULT_SETTINGS.boards[0]!
		expect(board.id).toBe('default')
		expect(board.name).toBe('Default')
		expect(board.tagNotes).toBe('#task')
		expect(board.folderNotes).toBe('')
		expect(board.propertyState).toBe('state')
		expect(board.propertyDescription).toBe('description')
		expect(board.propertyCategory).toBe('category')
	})
})

describe('DEFAULT_BOARD', () => {
	it('should have 4 columns', () => {
		expect(DEFAULT_BOARD.columns).toHaveLength(4)
	})

	it('should have backlog as first column', () => {
		expect(DEFAULT_BOARD.columns[0]!.id).toBe('backlog')
	})

	it('should have empty categories', () => {
		expect(DEFAULT_BOARD.categories).toHaveLength(0)
	})

	it('should have completed column with limitDate week', () => {
		expect(DEFAULT_BOARD.completedColumn.limitDate).toBe(TimeOptions.week)
	})
})

describe('DEFAULT_BOARD_COLUMNS', () => {
	it('should have 4 columns', () => {
		expect(DEFAULT_BOARD_COLUMNS).toHaveLength(4)
	})

	it('should have correct column ids', () => {
		const ids = DEFAULT_BOARD_COLUMNS.map((c) => c.id)
		expect(ids).toEqual(['backlog', 'todo', 'workingOn', 'review'])
	})

	it('each column should have required properties', () => {
		DEFAULT_BOARD_COLUMNS.forEach((col) => {
			expect(col).toHaveProperty('id')
			expect(col).toHaveProperty('icon')
			expect(col).toHaveProperty('title')
			expect(col).toHaveProperty('color')
			expect(typeof col.id).toBe('string')
			expect(typeof col.icon).toBe('string')
			expect(typeof col.title).toBe('string')
			expect(typeof col.color).toBe('string')
		})
	})
})

describe('DEFAULT_COMPLETED_COLUMN', () => {
	it('should have correct properties', () => {
		expect(DEFAULT_COMPLETED_COLUMN.id).toBe('completed')
		expect(DEFAULT_COMPLETED_COLUMN.icon).toBe('check-check')
		expect(DEFAULT_COMPLETED_COLUMN.title).toBe('Completed')
		expect(DEFAULT_COMPLETED_COLUMN.color).toBe('#27ae60')
		expect(DEFAULT_COMPLETED_COLUMN.limitDate).toBe(TimeOptions.week)
	})
})

describe('TimeOptions', () => {
	it('should have correct values', () => {
		expect(TimeOptions.day).toBe(0)
		expect(TimeOptions.week).toBe(1)
		expect(TimeOptions.month).toBe(2)
		expect(TimeOptions.year).toBe(3)
	})
})
