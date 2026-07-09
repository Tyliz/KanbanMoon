import { TFile } from 'obsidian'

export const normalizeTag = (tag: string): string => tag.replace(/^#/, '')

export const sortByMtime = (a: TFile, b: TFile) => {
	const aDate = a.stat.mtime || a.stat.ctime
	const bDate = b.stat.mtime || b.stat.ctime

	if (!aDate || !bDate) return 0
	if (aDate === bDate) return 0

	return -(new Date(aDate).getTime() - new Date(bDate).getTime())
}

export { getContrastColor } from '../../utils/color'
