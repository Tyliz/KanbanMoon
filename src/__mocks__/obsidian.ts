import { vi } from 'vitest'

vi.mock('obsidian', () => ({
	moment: {
		locale: () => 'en',
	},
}))
