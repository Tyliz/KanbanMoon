import { describe, it, expect } from 'vitest'
import { migrateSettings } from './migration'
import { DEFAULT_BOARD } from './kanbanSettings'

describe('migrateSettings', () => {
	it('should return default settings when raw is null', () => {
		const result = migrateSettings(null)
		expect(result.boards).toHaveLength(1)
		expect(result.boards[0]).toEqual(DEFAULT_BOARD)
		expect(result.activeBoardId).toBe('default')
	})

	it('should return default settings when raw is empty object', () => {
		const result = migrateSettings({})
		expect(result.boards).toHaveLength(1)
		expect(result.boards[0]).toEqual(DEFAULT_BOARD)
		expect(result.activeBoardId).toBe('default')
	})

	it('should migrate legacy format with tagNotes', () => {
		const legacy = {
			tagNotes: '#my-project',
			folderNotes: '',
			propertyState: 'status',
			propertyDescription: 'desc',
			propertyCategory: 'cat',
			columns: [
				{ id: 'col1', icon: 'inbox', title: 'Column 1', color: '#ff0000' },
			],
			categories: [],
			completedColumn: {
				id: 'done',
				icon: 'check',
				title: 'Done',
				color: '#00ff00',
				limitDate: 1,
			},
		}

		const result = migrateSettings(legacy)
		expect(result.boards).toHaveLength(1)
		expect(result.activeBoardId).toBe('default')
		expect(result.boards[0]!.tagNotes).toBe('#my-project')
		expect(result.boards[0]!.propertyState).toBe('status')
		expect(result.boards[0]!.columns).toHaveLength(1)
		expect(result.boards[0]!.columns[0]!.id).toBe('col1')
	})

	it('should migrate legacy format with folderNotes', () => {
		const legacy = {
			folderNotes: 'Projects/my-project',
		}

		const result = migrateSettings(legacy)
		expect(result.boards[0]!.folderNotes).toBe('Projects/my-project')
		expect(result.boards[0]!.tagNotes).toBe(DEFAULT_BOARD.tagNotes)
	})

	it('should use defaults for missing legacy fields', () => {
		const legacy = {
			tagNotes: '#custom',
		}

		const result = migrateSettings(legacy)
		expect(result.boards[0]!.tagNotes).toBe('#custom')
		expect(result.boards[0]!.propertyState).toBe(DEFAULT_BOARD.propertyState)
		expect(result.boards[0]!.propertyDescription).toBe(DEFAULT_BOARD.propertyDescription)
		expect(result.boards[0]!.propertyCategory).toBe(DEFAULT_BOARD.propertyCategory)
	})

	it('should handle legacy format with empty columns array', () => {
		const legacy = {
			tagNotes: '#test',
			columns: [],
		}

		const result = migrateSettings(legacy)
		expect(result.boards[0]!.columns).toEqual(DEFAULT_BOARD.columns)
	})

	it('should pass through new format unchanged', () => {
		const newFormat = {
			boards: [
				{
					id: 'board-1',
					name: 'Test Board',
					tagNotes: '#test',
					folderNotes: 'test-folder',
					propertyState: 'state',
					propertyDescription: 'description',
					propertyCategory: 'category',
					columns: [],
					categories: [],
					completedColumn: {
						id: 'completed',
						icon: 'check',
						title: 'Completed',
						color: '#00ff00',
						limitDate: 1,
					},
				},
			],
			activeBoardId: 'board-1',
		}

		const result = migrateSettings(newFormat)
		expect(result.boards).toHaveLength(1)
		expect(result.boards[0]!.id).toBe('board-1')
		expect(result.boards[0]!.name).toBe('Test Board')
		expect(result.activeBoardId).toBe('board-1')
	})

	it('should handle multiple boards in new format', () => {
		const newFormat = {
			boards: [
				{ id: 'board-1', name: 'Board 1', tagNotes: '#b1' },
				{ id: 'board-2', name: 'Board 2', tagNotes: '#b2' },
			],
			activeBoardId: 'board-2',
		}

		const result = migrateSettings(newFormat)
		expect(result.boards).toHaveLength(2)
		expect(result.activeBoardId).toBe('board-2')
	})

	it('should handle unknown format by returning defaults', () => {
		const unknown = {
			someRandomField: 'value',
		}

		const result = migrateSettings(unknown)
		expect(result.boards).toHaveLength(1)
		expect(result.boards[0]).toEqual(DEFAULT_BOARD)
	})
})
