import { App, Modal } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlightPlugin from '../main'

interface ChangelogSection {
	title: string
	items: string[]
}

export class UpdateModal extends Modal {
	private version: string
	private sections: ChangelogSection[]
	private plugin: KanbanMoonlightPlugin

	constructor(app: App, version: string, sections: ChangelogSection[], plugin: KanbanMoonlightPlugin) {
		super(app)
		this.version = version
		this.sections = sections
		this.plugin = plugin
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

		const fundingEl = contentEl.createEl('div', {
			cls: 'kanban-update-modal__funding',
		})

		const fundingUrl = this.getFundingUrl()

		if (fundingUrl) {
			const fundingBtn = fundingEl.createEl('a', {
				text: '☕ Buy Me a Coffee',
				cls: 'kanban-update-modal__funding-btn',
				attr: {
					href: fundingUrl,
					target: '_blank',
					rel: 'noopener noreferrer',
				},
			})
			fundingBtn.addEventListener('click', (e) => {
				e.preventDefault()
				void window.open(fundingUrl, '_blank')
			})
		}
	}

	private getFundingUrl(): string | null {
		const manifest = this.plugin.manifest as unknown as Record<string, unknown>
		const fundingUrl = manifest.fundingUrl

		if (typeof fundingUrl === 'string') {
			return fundingUrl
		}

		if (typeof fundingUrl === 'object' && fundingUrl !== null) {
			const values = Object.values(fundingUrl as Record<string, string>)
			if (values.length > 0) {
				return values[0] ?? null
			}
		}

		return null
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
