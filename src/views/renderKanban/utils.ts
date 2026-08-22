import { TFile, App } from 'obsidian'
import type { IBoard } from '../../settings/kanbanSettings'
import { toSafeFm, getFmStringArray, getFmString } from '../../utils/frontmatter'

export interface BoardFilters {
	category: string
	priority: string
	assignee: string
}

export const DEFAULT_FILTERS: BoardFilters = {
	category: '',
	priority: '',
	assignee: '',
}

export const normalizeTag = (tag: string): string => tag.replace(/^#/, '')

export const sortByMtime = (a: TFile, b: TFile) => {
	const aDate = a.stat.mtime || a.stat.ctime
	const bDate = b.stat.mtime || b.stat.ctime

	if (!aDate || !bDate) return 0
	if (aDate === bDate) return 0

	return -(new Date(aDate).getTime() - new Date(bDate).getTime())
}

export function getFilteredNotes(app: App, board: IBoard): TFile[] {
	const tagNotes = board.tagNotes
	const folderNotes = board.folderNotes
	const allNotes = app.vault.getMarkdownFiles()

	const normalizedFolder = folderNotes
		? folderNotes.replace(/^\/+/, '').replace(/\/?$/, '/')
		: ''

	return allNotes.filter((note) => {
		const cache = app.metadataCache.getFileCache(note)
		const fm = toSafeFm(cache)

		const inFolder =
			normalizedFolder && note.path.startsWith(normalizedFolder)

		const hasTag = tagNotes.trim()
			? getFmStringArray(fm, 'tags').some((tag) =>
				normalizeTag(tag).startsWith(normalizeTag(tagNotes)),
			)
			: false

		return hasTag || inFolder
	})
}

export function searchNotes(
	notes: TFile[],
	app: App,
	board: IBoard,
	searchTerm: string,
	filters: BoardFilters = DEFAULT_FILTERS,
): TFile[] {
	const hasActiveFilter =
		searchTerm ||
		filters.category ||
		filters.priority ||
		filters.assignee

	if (!hasActiveFilter) return notes

	const normalizedFolder = board.folderNotes
		? board.folderNotes.replace(/^\/+/, '').replace(/\/?$/, '/')
		: ''

	const normalizedSearch = searchTerm.toLowerCase()

	return notes.filter((note) => {
		const cache = app.metadataCache.getFileCache(note)
		const fm = toSafeFm(cache)

		const inFolder =
			normalizedFolder && note.path.startsWith(normalizedFolder)

		const hasTag = board.tagNotes.trim()
			? getFmStringArray(fm, 'tags').some((tag) => {
				const tagNorm = normalizeTag(board.tagNotes).toLowerCase()
				return normalizeTag(tag).toLowerCase().includes(tagNorm)
			})
			: false

		const isProjectNote = hasTag || inFolder
		if (!isProjectNote) return false

		const category = getFmString(
			fm,
			board.propertyCategory || 'category',
		)
		const priority = getFmString(
			fm,
			board.propertyPriority || 'priority',
		)
		const assigneeIds = getFmStringArray(
			fm,
			board.propertyAssignee || 'assignee',
		)

		if (filters.category && category !== filters.category) return false
		if (filters.priority && priority !== filters.priority) return false
		if (filters.assignee && !assigneeIds.includes(filters.assignee))
			return false

		if (!searchTerm) return true

		const title = note.basename.toLowerCase()
		const description = getFmString(
			fm,
			board.propertyDescription || 'description',
		)
		const tags = getFmStringArray(fm, 'tags').map((t) =>
			t.toLowerCase(),
		)

		return (
			title.includes(normalizedSearch) ||
			description.toLowerCase().includes(normalizedSearch) ||
			category.toLowerCase().includes(normalizedSearch) ||
			priority.toLowerCase().includes(normalizedSearch) ||
			tags.some((tag: string) =>
				tag.toLowerCase().includes(normalizedSearch),
			)
		)
	})
}

export { getContrastColor } from '../../utils/color'
