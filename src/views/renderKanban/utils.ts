import { TFile } from 'obsidian'

export const sortByMtime = (a: TFile, b: TFile) => {
	const aDate = a.stat.mtime || a.stat.ctime
	const bDate = b.stat.mtime || b.stat.ctime

	if (!aDate || !bDate) return 0
	if (aDate === bDate) return 0

	return -(new Date(aDate).getTime() - new Date(bDate).getTime())
}

export const getContrastColor = (hexColor: string) => {
	const hex = hexColor.replace('#', '')

	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)

	const yiq = (r * 299 + g * 587 + b * 114) / 1000

	return yiq >= 128 ? '#000000' : '#ffffff'
}
