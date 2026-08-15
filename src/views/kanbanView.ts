import { ItemView, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import { t } from '../lang/helpers'
import type KanbanMoonlight from '../main'
import { ViewType, GanttZoom } from '../settings/kanbanSettings'
import { renderKanbanColumns } from './renderKanban/renderColumns'
import { getFilteredNotes, searchNotes } from './renderKanban/utils'
import { CreateTaskModal } from '../ui/createTaskModal'
import { BoardModal } from '../ui/boardModal'
import { renderGantt } from './ganttChart'
import { UpdateModal } from '../ui/updateModal'

export const VIEW_TYPE_KANBAN = 'kanban-moonlight-view'

export class KanbanMoonlightView extends ItemView {
	plugin: KanbanMoonlight
	currentView: ViewType = ViewType.kanban

	constructor(leaf: WorkspaceLeaf, plugin: KanbanMoonlight) {
		super(leaf)
		this.plugin = plugin
		this.currentView = plugin.settings.defaultView
	}

	getViewType() {
		return VIEW_TYPE_KANBAN
	}

	getDisplayText() {
		return t('VIEW_TITLE')
	}

	getIcon() {
		return 'lucide-kanban'
	}

	async onOpen() {
		const container = this.contentEl
		container.empty()

		await this.checkForUpdate()

		this.drawCurrentView()
	}

	drawCurrentView = () => {
		switch (this.currentView) {
			case ViewType.gantt:
				this.drawGanttView()
				break
			case ViewType.dashboard:
				this.drawDashboardView()
				break
			case ViewType.kanban:
			default:
				this.drawKanbanBoard()
				break
		}
	}

	drawKanbanBoard = () => {
		const container = this.contentEl
		container.empty()

		this.createTabBar(container)

		const board = this.plugin.getActiveBoard()
		const notesWithTag = getFilteredNotes(this.app, board)

		const filterNotice = container.createDiv({
			cls: 'kanban-filter-notice',
		})
		const tag = board.tagNotes
		const folder = board.folderNotes
		const filters = [tag, folder].filter(Boolean).join(', ')
		filterNotice.createSpan({
			text: t('FILTER_NOTICE') + ` ${filters}`,
			cls: 'kanban-filter-notice-text',
		})

		const mainContainer = container.createDiv({
			cls: 'main-kanban-container',
		})

		const searchContainer = mainContainer.createDiv({
			cls: 'kanban-container-search',
		})

		const searchInput = searchContainer.createEl('input', {
			cls: 'kanban-search-input',
			attr: {
				type: 'text',
				placeholder: t('SEARCH_PLACEHOLDER'),
			},
		})

		const newTaskBtn = searchContainer.createEl('button', {
			cls: 'kanban-new-task-btn',
		})
		setIcon(newTaskBtn, 'plus')
		newTaskBtn.createSpan({
			text: t('CREATE_TASK_BTN'),
		})
		newTaskBtn.addEventListener('click', () => {
			new CreateTaskModal(this.app, this.plugin).open()
		})

		searchInput.addEventListener('input', (event) => {
			const searchTerm = (
				event.target as HTMLInputElement
			).value.toLowerCase()

			if (this.debounceTimer) {
				window.clearTimeout(this.debounceTimer)
			}

			this.debounceTimer = window.setTimeout(() => {
				const filtered = searchNotes(
					notesWithTag,
					this.app,
					board,
					searchTerm,
				)
				renderKanbanColumns(this, filtered)
			}, 300)
		})

		mainContainer.createDiv({
			cls: 'kanban-board',
		})

		renderKanbanColumns(this, notesWithTag)

		const settingsBtn = container.createDiv({
			cls: 'kanban-settings-btn',
			attr: { title: t('OPEN_SETTINGS') },
		})
		setIcon(settingsBtn, 'settings')
		settingsBtn.addEventListener('click', () => {
			this.openPluginSettings()
		})
	}

	drawGanttView = () => {
		const container = this.contentEl
		container.empty()

		this.createTabBar(container)

		const board = this.plugin.getActiveBoard()
		const notesWithTag = getFilteredNotes(this.app, board)

		const filterNotice = container.createDiv({
			cls: 'kanban-filter-notice',
		})
		const tag = board.tagNotes
		const folder = board.folderNotes
		const filters = [tag, folder].filter(Boolean).join(', ')
		filterNotice.createSpan({
			text: t('FILTER_NOTICE') + ` ${filters}`,
			cls: 'kanban-filter-notice-text',
		})

		const mainContainer = container.createDiv({
			cls: 'main-kanban-container',
		})

		const searchContainer = mainContainer.createDiv({
			cls: 'kanban-container-search',
		})

		const searchInput = searchContainer.createEl('input', {
			cls: 'kanban-search-input',
			attr: {
				type: 'text',
				placeholder: t('SEARCH_PLACEHOLDER'),
			},
		})

		const newTaskBtn = searchContainer.createEl('button', {
			cls: 'kanban-new-task-btn',
		})
		setIcon(newTaskBtn, 'plus')
		newTaskBtn.createSpan({
			text: t('CREATE_TASK_BTN'),
		})
		newTaskBtn.addEventListener('click', () => {
			new CreateTaskModal(this.app, this.plugin).open()
		})

		const ganttContainer = mainContainer.createDiv({
			cls: 'kanban-gantt',
		})

		const renderCurrentGantt = (notes: TFile[]) => {
			ganttContainer.empty()
			renderGantt(ganttContainer, notes, {
				app: this.app,
				board,
				zoom: this.plugin.settings.ganttZoom,
				onTaskClick: (note) => {
					void (async () => {
						const leaf = this.plugin.app.workspace.getLeaf(true)
						await leaf.openFile(note)
					})()
				},
				onZoomChange: (zoom: GanttZoom) => {
					this.plugin.settings.ganttZoom = zoom
					void this.plugin.saveSettings()
					renderCurrentGantt(notes)
				},
			})
		}

		renderCurrentGantt(notesWithTag)

		searchInput.addEventListener('input', (event) => {
			const searchTerm = (
				event.target as HTMLInputElement
			).value.toLowerCase()

			if (this.debounceTimer) {
				window.clearTimeout(this.debounceTimer)
			}

			this.debounceTimer = window.setTimeout(() => {
				const filtered = searchNotes(
					notesWithTag,
					this.app,
					board,
					searchTerm,
				)
				renderCurrentGantt(filtered)
			}, 300)
		})

		const settingsBtn = container.createDiv({
			cls: 'kanban-settings-btn',
			attr: { title: t('OPEN_SETTINGS') },
		})
		setIcon(settingsBtn, 'settings')
		settingsBtn.addEventListener('click', () => {
			this.openPluginSettings()
		})
	}

	drawDashboardView = () => {
		const container = this.contentEl
		container.empty()

		this.createTabBar(container)

		const board = this.plugin.getActiveBoard()
		const notesWithTag = getFilteredNotes(this.app, board)

		const filterNotice = container.createDiv({
			cls: 'kanban-filter-notice',
		})
		const tag = board.tagNotes
		const folder = board.folderNotes
		const filters = [tag, folder].filter(Boolean).join(', ')
		filterNotice.createSpan({
			text: t('FILTER_NOTICE') + ` ${filters}`,
			cls: 'kanban-filter-notice-text',
		})

		const mainContainer = container.createDiv({
			cls: 'main-kanban-container',
		})

		const dashboardContainer = mainContainer.createDiv({
			cls: 'kanban-dashboard',
		})

		this.renderDashboard(dashboardContainer, notesWithTag, board)

		const settingsBtn = container.createDiv({
			cls: 'kanban-settings-btn',
			attr: { title: t('OPEN_SETTINGS') },
		})
		setIcon(settingsBtn, 'settings')
		settingsBtn.addEventListener('click', () => {
			this.openPluginSettings()
		})
	}

	private renderDashboard(
		container: HTMLElement,
		notes: TFile[],
		board: {
			columns: Array<{ id: string; title: string; color: string }>
			categories: Array<{ id: string; name: string; color: string }>
		},
	) {
		const dashboardGrid = container.createDiv({
			cls: 'kanban-dashboard__grid',
		})

		const tasksByState = dashboardGrid.createDiv({
			cls: 'kanban-dashboard__card',
		})

		tasksByState.createEl('h3', {
			text: t('DASHBOARD_BY_STATE'),
			cls: 'kanban-dashboard__card-title',
		})

		const stateCounts: Record<string, number> = {}
		board.columns.forEach((col) => {
			stateCounts[col.id] = 0
		})

		notes.forEach((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			const fm = cache?.frontmatter
			const state =
				(fm?.state as string) || board.columns[0]?.id || 'backlog'
			if (stateCounts[state] !== undefined) {
				stateCounts[state]++
			}
		})

		const maxCount = Math.max(...Object.values(stateCounts), 1)

		const stateBars = tasksByState.createDiv({
			cls: 'kanban-dashboard__bars',
		})

		board.columns.forEach((col) => {
			const barRow = stateBars.createDiv({
				cls: 'kanban-dashboard__bar-row',
			})

			barRow.createDiv({
				cls: 'kanban-dashboard__bar-label',
				text: col.title,
			})

			const barContainer = barRow.createDiv({
				cls: 'kanban-dashboard__bar-container',
			})

			const count = stateCounts[col.id] || 0
			const percentage = (count / maxCount) * 100

			barContainer.createDiv({
				cls: 'kanban-dashboard__bar',
				attr: {
					style: `width: ${percentage}%; background-color: ${col.color};`,
				},
			})

			barRow.createDiv({
				cls: 'kanban-dashboard__bar-count',
				text: String(count),
			})
		})

		const tasksByPerson = dashboardGrid.createDiv({
			cls: 'kanban-dashboard__card',
		})

		tasksByPerson.createEl('h3', {
			text: t('DASHBOARD_BY_PERSON'),
			cls: 'kanban-dashboard__card-title',
		})

		const personCounts: Record<string, number> = {}

		notes.forEach((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			const fm = cache?.frontmatter
			const assignees = (fm?.assignee as string[]) || []
			assignees.forEach((id) => {
				personCounts[id] = (personCounts[id] || 0) + 1
			})
		})

		const personList = tasksByPerson.createDiv({
			cls: 'kanban-dashboard__person-list',
		})

		const sortedPersons = Object.entries(personCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)

		if (sortedPersons.length === 0) {
			personList.createEl('p', {
				text: t('DASHBOARD_NO_ASSIGNEES'),
				cls: 'kanban-dashboard__empty',
			})
		} else {
			sortedPersons.forEach(([personId, count]) => {
				const person = this.plugin.settings.people.find(
					(p) => p.id === personId,
				)
				const personRow = personList.createDiv({
					cls: 'kanban-dashboard__person-row',
				})

				const avatar = personRow.createDiv({
					cls: 'kanban-person-avatar',
					attr: {
						style: `background-color: ${person?.color || '#666'};`,
					},
				})
				avatar.textContent = (person?.name || personId)
					.split(' ')
					.map((n) => n[0])
					.join('')
					.toUpperCase()
					.slice(0, 2)

				personRow.createSpan({
					text: person?.name || personId,
					cls: 'kanban-dashboard__person-name',
				})

				personRow.createSpan({
					text: String(count),
					cls: 'kanban-dashboard__person-count',
				})
			})
		}

		const recentActivity = dashboardGrid.createDiv({
			cls: 'kanban-dashboard__card kanban-dashboard__card--wide',
		})

		recentActivity.createEl('h3', {
			text: t('DASHBOARD_RECENT_ACTIVITY'),
			cls: 'kanban-dashboard__card-title',
		})

		const activityList = recentActivity.createDiv({
			cls: 'kanban-dashboard__activity-list',
		})

		interface ActivityEntry {
			noteName: string
			date: string
			type: string
			detail: string
		}

		const activities: ActivityEntry[] = []

		notes.forEach((note) => {
			const cache = this.app.metadataCache.getFileCache(note)
			const fm = cache?.frontmatter
			const history =
				(fm?.history as Array<Record<string, unknown>>) || []

			history.forEach((event) => {
				activities.push({
					noteName: note.basename,
					date: (event.date as string) || '',
					type: (event.type as string) || 'state_changed',
					detail:
						(event.to as string) || (event.column as string) || '',
				})
			})
		})

		activities
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, 10)
			.forEach((activity) => {
				const activityRow = activityList.createDiv({
					cls: 'kanban-dashboard__activity-row',
				})

				activityRow.createSpan({
					text: activity.noteName,
					cls: 'kanban-dashboard__activity-note',
				})

				activityRow.createSpan({
					text: activity.detail,
					cls: 'kanban-dashboard__activity-detail',
				})
				const date = new Date(activity.date)

				const dd = String(date.getDate()).padStart(2, '0')
				const MM = String(date.getMonth() + 1).padStart(2, '0')
				const yyyy = String(date.getFullYear())

				const formatedDate = `${dd}/${MM}/${yyyy}`
				activityRow.createSpan({
					text: formatedDate,
					cls: 'kanban-dashboard__activity-date',
				})
			})
	}

	private createTabBar(container: HTMLElement) {
		const viewBar = container.createDiv({
			cls: 'kanban-view-bar',
		})

		const viewTabs = viewBar.createDiv({
			cls: 'kanban-view-tabs',
		})

		const viewTypes = [
			{ type: ViewType.kanban, icon: 'layout-grid', label: 'Board' },
			{ type: ViewType.gantt, icon: 'gantt-chart', label: 'Gantt' },
			{
				type: ViewType.dashboard,
				icon: 'bar-chart-3',
				label: 'Dashboard',
			},
		]

		viewTypes.forEach(({ type, icon, label }) => {
			const tab = viewTabs.createEl('button', {
				cls: `kanban-view-tab${this.currentView === type ? ' kanban-view-tab--active' : ''}`,
			})
			setIcon(tab, icon)
			tab.createSpan({ text: label })

			tab.addEventListener('click', () => {
				if (this.currentView === type) return
				this.currentView = type
				this.plugin.settings.defaultView = type
				void this.plugin.saveSettings()
				this.drawCurrentView()
			})
		})

		const tabBar = viewBar.createDiv({
			cls: 'kanban-tab-bar',
		})

		const boards = this.plugin.settings.boards
		const activeBoardId = this.plugin.settings.activeBoardId

		boards.forEach((board) => {
			const tab = tabBar.createDiv({
				cls: `kanban-tab${board.id === activeBoardId ? ' kanban-tab--active' : ''}`,
				attr: { title: t('BOARD_TAB_TOOLTIP') },
			})
			tab.createSpan({ text: board.name })

			tab.addEventListener('click', () => {
				if (board.id === activeBoardId) return
				this.plugin.settings.activeBoardId = board.id
				void this.plugin.saveSettings()
				this.drawCurrentView()
			})

			tab.addEventListener('dblclick', (e) => {
				e.stopPropagation()
				new BoardModal(this.app, this.plugin, board).open()
			})
		})

		const addTabBtn = tabBar.createDiv({
			cls: 'kanban-tab kanban-tab-add',
			attr: { title: t('ADD_BOARD') },
		})
		setIcon(addTabBtn, 'plus')
		addTabBtn.addEventListener('click', () => {
			new BoardModal(this.app, this.plugin).open()
		})
	}

	debounceTimer: number | null = null

	private openPluginSettings() {
		const app = this.app as unknown as {
			setting?: { open: () => void; openTabById: (id: string) => void }
		}
		if (app.setting) {
			app.setting.open()
			app.setting.openTabById(this.plugin.manifest.id)
		}
	}

	private async checkForUpdate() {
		const currentVersion = this.plugin.manifest.version
		const lastSeenVersion = this.plugin.settings.lastSeenVersion

		if (currentVersion === lastSeenVersion) return

		const sections = RELEASE_NOTES[currentVersion]

		if (sections && sections.length > 0) {
			new UpdateModal(
				this.app,
				currentVersion,
				sections,
				this.plugin,
			).open()
		}

		this.plugin.settings.lastSeenVersion = currentVersion
		await this.plugin.saveSettings()
	}
}

const RELEASE_NOTES: Record<
	string,
	Array<{ title: string; items: string[] }>
> = {
	'1.4.0': [
		{
			title: 'Added',
			items: [
				'People data syncs bidirectionally with Markdown files.',
				'Deleting a person removes its .md file from the vault.',
				'Changing a person name auto-renames the .md file.',
				'Unique personId field in frontmatter for stable identification.',
				'Person files are synced on plugin load.',
			],
		},
		{
			title: 'Changed',
			items: [
				'Gantt chart uses window.moment for better compatibility.',
			],
		},
	],
	'1.3.1': [
		{
			title: 'Changed',
			items: [
				'Improved settings UI for better compatibility with Obsidian 1.13.4.',
				'Redesigned spacing, border radius, hover states, and visual consistency.',
				'Fixed settings duplication bug when switching active board.',
			],
		},
	],
	'1.3.0': [
		{
			title: 'Added',
			items: [
				'Pending tasks shown in cards with checkbox toggle.',
				'External link icon on cards with externalLink property.',
				'Update modal shows changelog on first open after update.',
			],
		},
	],
	'1.2.0': [
		{
			title: 'Added',
			items: [
				'Gantt chart rewritten from scratch.',
				'Start column configuration.',
				'Today line on Gantt timeline.',
			],
		},
	],
	'1.1.0': [
		{
			title: 'Added',
			items: [
				'Multi-board support.',
				'Board tabs with tooltip.',
				'Board modal for create/edit.',
				'Delete board with confirmation.',
				'Collapsible settings sections.',
				'Settings button in Kanban view.',
			],
		},
		{
			title: 'Migration',
			items: [
				'Existing settings automatically migrated to multi-board format.',
				'No user action required.',
			],
		},
	],
}
