import { App, getIcon, setIcon, SuggestModal } from 'obsidian'
import { icons } from 'lucide'

export class IconSuggestModal extends SuggestModal<string> {
	private onSelect: (icon: string) => void
	private icons: string[]

	constructor(app: App, onSelect: (icon: string) => void) {
		super(app)
		this.onSelect = onSelect

		this.icons = Object.keys(icons)
			.sort()
			.map((icon) => {
				return icon
					.replaceAll(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
					.substring(1)
					.toLowerCase()
			})
			.filter((icon) => {
				return !!getIcon(icon)
			})
	}

	getSuggestions(query: string): string[] {
		return this.icons.filter((icon) =>
			icon
				.toLowerCase()
				.includes(query.replaceAll(' ', '-').toLowerCase()),
		)
	}

	renderSuggestion(icon: string, el: HTMLElement): void {
		el.addClass('icon-suggest-item') // Puedes darle estilo en tu CSS
		el.style.display = 'flex'
		el.style.alignItems = 'center'
		el.style.gap = '10px'
		const iconPreview = el.createDiv({
			cls: 'kanban-moon-icon-preview',
		})
		iconPreview.style.marginRight = '10px'

		// Función para renderizar el icono en ese contenedor
		const renderIcon = (iconName: string) => {
			iconPreview.empty() // Limpiamos el anterior
			const span = iconPreview.createSpan()
			setIcon(span, iconName)
		}

		renderIcon(icon)
		el.createSpan({
			text: icon,
		})
	}

	// Qué pasa cuando el usuario elige uno
	onChooseSuggestion(icon: string, evt: MouseEvent | KeyboardEvent): void {
		this.onSelect(icon)
	}
}
