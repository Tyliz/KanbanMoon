import { TFile, App } from 'obsidian'
import type { IBoard } from '../../settings/kanbanSettings'
import { toSafeFm, getFmStringArray, getFmString } from '../../utils/frontmatter'

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
): TFile[] {
	if (!searchTerm) return notes

	const normalizedFolder = board.folderNotes
		? board.folderNotes.replace(/^\/+/, '').replace(/\/?$/, '/')
		: ''

	return notes.filter((note) => {
		const cache = app.metadataCache.getFileCache(note)
		const fm = toSafeFm(cache)

		const inFolder =
			normalizedFolder && note.path.startsWith(normalizedFolder)

		const hasTag = board.tagNotes.trim()
			? getFmStringArray(fm, 'tags').some((tag) => {
				const normalizedSearch = normalizeTag(board.tagNotes).toLowerCase()
				return normalizeTag(tag).toLowerCase().includes(normalizedSearch)
			})
			: false

		const isProjectNote = hasTag || inFolder
		if (!isProjectNote) return false

		const title = note.basename.toLowerCase()
		const description = getFmString(
			fm,
			board.propertyDescription || 'description',
		)
		const category = getFmString(
			fm,
			board.propertyCategory || 'category',
		)

		const tags = getFmStringArray(fm, 'tags').map((t) =>
			t.toLowerCase(),
		)

		return (
			title.includes(searchTerm) ||
			description.toLowerCase().includes(searchTerm) ||
			category.toLowerCase().includes(searchTerm) ||
			tags.some((tag: string) =>
				tag.toLowerCase().includes(searchTerm),
			)
		)
	})
}

export { getContrastColor } from '../../utils/color'
