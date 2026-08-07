import { App, Modal } from 'obsidian'
import { t } from '../lang/helpers'

interface ChangelogSection {
	title: string
	items: string[]
}

export class UpdateModal extends Modal {
	private version: string
	private sections: ChangelogSection[]

	constructor(app: App, version: string, sections: ChangelogSection[]) {
		super(app)
		this.version = version
		this.sections = sections
	}

	onOpen() {
		const { contentEl } = this
		contentEl.empty()
		contentEl.addClass('kanban-update-modal')

		const headerEl = contentEl.createEl('div', {
			cls: 'kanban-update-modal__header',
		})

		headerEl.createEl('h2', {
			text: `Kanban Moonlight v${this.version}`,
			cls: 'kanban-update-modal__title',
		})

		headerEl.createEl('p', {
			text: t('UPDATE_SUBTITLE'),
			cls: 'kanban-update-modal__subtitle',
		})

		const sectionsEl = contentEl.createEl('div', {
			cls: 'kanban-update-modal__sections',
		})

		this.sections.forEach((section) => {
			if (section.items.length === 0) return

			const sectionEl = sectionsEl.createEl('div', {
				cls: 'kanban-update-modal__section',
			})

			sectionEl.createEl('h3', {
				text: section.title,
				cls: 'kanban-update-modal__section-title',
			})

			const listEl = sectionEl.createEl('ul', {
				cls: 'kanban-update-modal__list',
			})

			section.items.forEach((item) => {
				listEl.createEl('li', {
					text: item,
					cls: 'kanban-update-modal__item',
				})
			})
		})

		const closeBtn = contentEl.createEl('button', {
			text: t('UPDATE_CLOSE'),
			cls: 'kanban-update-modal__close-btn',
		})
		closeBtn.addEventListener('click', () => this.close())
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

export function parseChangelog(changelog: string, version: string): ChangelogSection[] {
	const sections: ChangelogSection[] = []
	const versionRegex = new RegExp(`## \\[${escapeRegex(version)}\\]`)
	const nextVersionRegex = /## \[\d+\.\d+\.\d+\]/

	const versionStart = changelog.search(versionRegex)
	if (versionStart === -1) return sections

	const afterVersion = changelog.slice(versionStart)
	const nextVersionMatch = afterVersion.slice(1).search(nextVersionRegex)
	const versionEnd = nextVersionMatch !== -1 ? nextVersionMatch + 1 : afterVersion.length
	const versionBlock = afterVersion.slice(0, versionEnd)

	const sectionRegex = /### (Added|Changed|Fixed|Removed|Migration)\n([\s\S]*?)(?=### |\n## |$)/g
	let match

	while ((match = sectionRegex.exec(versionBlock)) !== null) {
		const title = match[1] ?? ''
		const content = match[2] ?? ''

		const items = content
			.split('\n')
			.map((line) => line.replace(/^- \*\*/, '').replace(/\*\*/, '').replace(/^- /, '').trim())
			.filter((line) => line.length > 0)

		if (items.length > 0) {
			sections.push({ title, items })
		}
	}

	return sections
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
