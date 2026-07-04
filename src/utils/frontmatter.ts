import type { CachedMetadata } from 'obsidian'

export type SafeFrontmatter = Record<string, unknown> | undefined

export function toSafeFm(cache: CachedMetadata | null): SafeFrontmatter {
	return cache?.frontmatter
}

export function getFmString(
	fm: SafeFrontmatter,
	key: string,
	fallback = '',
): string {
	const val = fm?.[key]
	return typeof val === 'string' ? val : fallback
}

export function getFmStringArray(fm: SafeFrontmatter, key: string): string[] {
	const val = fm?.[key]
	if (!Array.isArray(val)) return []
	return val.filter((item): item is string => typeof item === 'string')
}

export function getFmRecordArray(
	fm: SafeFrontmatter,
	key: string,
): Array<Record<string, string>> {
	const val = fm?.[key]
	if (!Array.isArray(val)) return []
	return val.filter(
		(item): item is Record<string, string> =>
			typeof item === 'object' &&
			item !== null &&
			!Array.isArray(item),
	)
}
