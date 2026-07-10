import { TFile, App } from 'obsidian'
import { t } from '../lang/helpers'
import { GanttZoom, IBoard } from '../settings/kanbanSettings'
import { getContrastColor } from '../utils/color'

interface GanttTask {
	note: TFile
	title: string
	start: Date
	end: Date
	color: string
	state: string
}

interface GanttConfig {
	app: App
	board: IBoard
	zoom: GanttZoom
	onTaskClick: (note: TFile) => void
	onZoomChange: (zoom: GanttZoom) => void
}

const DAY_MS = 1000 * 60 * 60 * 24

function startOfDay(date: Date): Date {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d
}

function daysBetween(a: Date, b: Date): number {
	return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

function addDays(date: Date, days: number): Date {
	const d = new Date(date)
	d.setDate(d.getDate() + days)
	return d
}

function getMonthStart(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthEnd(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function formatMonthLabel(date: Date): string {
	return date.toLocaleDateString(undefined, {
		month: 'short',
		year: 'numeric',
	})
}

function isToday(date: Date): boolean {
	const today = new Date()
	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	)
}

function isWeekend(date: Date): boolean {
	const day = date.getDay()
	return day === 0 || day === 6
}

function getDayWidth(zoom: GanttZoom): number {
	return zoom === GanttZoom.day ? 50 : zoom === GanttZoom.week ? 20 : 8
}

interface TimelineColumn {
	date: Date
	label: string
	widthDays: number
}

function buildTimeline(
	minDate: Date,
	maxDate: Date,
	zoom: GanttZoom,
): TimelineColumn[] {
	const columns: TimelineColumn[] = []

	if (zoom === GanttZoom.day) {
		const total = daysBetween(minDate, maxDate)
		for (let i = 0; i <= total; i++) {
			const date = addDays(minDate, i)
			columns.push({
				date,
				label: date.toLocaleDateString(undefined, { day: 'numeric' }),
				widthDays: 1,
			})
		}
	} else if (zoom === GanttZoom.week) {
		let current = new Date(minDate)
		while (current <= maxDate) {
			columns.push({
				date: new Date(current),
				label: current.toLocaleDateString(undefined, {
					day: 'numeric',
					month: 'short',
				}),
				widthDays: 7,
			})
			current = addDays(current, 7)
		}
	} else {
		let current = getMonthStart(minDate)
		const end = addDays(maxDate, 1)
		while (current < end) {
			const monthEnd = getMonthEnd(current)
			const daysInMonth = daysBetween(current, monthEnd) + 1
			const daysUntilEnd = daysBetween(current, end)
			const widthDays = Math.min(daysInMonth, daysUntilEnd)
			columns.push({
				date: new Date(current),
				label: formatMonthLabel(current),
				widthDays,
			})
			current = addDays(monthEnd, 1)
		}
	}

	return columns
}

function parseTasks(notes: TFile[], board: IBoard, app: App): GanttTask[] {
	return notes
		.map((note) => {
			const cache = app.metadataCache.getFileCache(note)
			const fm = cache?.frontmatter

			const startDate = fm?.[board.propertyStartDate] as
				| string
				| undefined
			const dueDate = fm?.[board.propertyDueDate] as string | undefined

			const createdAt = new Date(note.stat.ctime)
			const modifiedAt = new Date(note.stat.mtime)

			const start = startDate
				? startOfDay(new Date(startDate))
				: startOfDay(createdAt)
			const end = dueDate
				? startOfDay(new Date(dueDate))
				: startOfDay(modifiedAt)

			const state = (fm?.state as string) || 'backlog'
			const column = board.columns.find((c) => c.id === state)
			const color = column?.color || '#666'

			return {
				note,
				title: note.basename,
				start,
				end,
				color,
				state,
			}
		})
		.filter(
			(task) => !isNaN(task.start.getTime()) && !isNaN(task.end.getTime()),
		)
}

function getDateRange(tasks: GanttTask[]): {
	minDate: Date
	maxDate: Date
} {
	const firstTask = tasks[0]
	if (!firstTask) {
		const now = new Date()
		return { minDate: now, maxDate: now }
	}

	let minTime = firstTask.start.getTime()
	let maxTime = firstTask.end.getTime()

	for (const task of tasks) {
		if (task.start.getTime() < minTime) minTime = task.start.getTime()
		if (task.end.getTime() > maxTime) maxTime = task.end.getTime()
	}

	const minDate = startOfDay(new Date(minTime))
	const maxDate = startOfDay(new Date(maxTime))

	minDate.setDate(minDate.getDate() - 2)
	maxDate.setDate(maxDate.getDate() + 2)

	return { minDate, maxDate }
}

function synchronizeScroll(
	leftBody: HTMLElement,
	rightBody: HTMLElement,
): void {
	let isSyncing = false

	rightBody.addEventListener('scroll', () => {
		if (isSyncing) return
		isSyncing = true
		window.requestAnimationFrame(() => {
			leftBody.scrollTop = rightBody.scrollTop
			isSyncing = false
		})
	})

	leftBody.addEventListener('scroll', () => {
		if (isSyncing) return
		isSyncing = true
		window.requestAnimationFrame(() => {
			rightBody.scrollTop = leftBody.scrollTop
			isSyncing = false
		})
	})
}

function renderTimelineHeader(
	container: HTMLElement,
	columns: TimelineColumn[],
	totalDays: number,
	totalWidthPx: number,
	zoom: GanttZoom,
): void {

	if (columns.length === 0) return

	if (zoom === GanttZoom.month) {
		const months = new Map<
			string,
			{ startIdx: number; endIdx: number; label: string }
		>()

		columns.forEach((col, idx) => {
			const key = `${col.date.getFullYear()}-${col.date.getMonth()}`
			const existing = months.get(key)
			if (existing) {
				existing.endIdx = idx
			} else {
				months.set(key, {
					startIdx: idx,
					endIdx: idx,
					label: col.label,
				})
			}
		})

		const row1 = container.createEl('div', {
			cls: 'gantt-timeline-row',
			attr: {
				style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
			},
		})

		months.forEach(({ startIdx, endIdx, label }) => {
			const widthDays =
				columns
					.slice(startIdx, endIdx + 1)
					.reduce((sum, c) => sum + c.widthDays, 0)
			const cellWidth = (widthDays / totalDays) * 100
			const cell = row1.createEl('div', {
				cls: 'gantt-timeline-cell',
				text: label,
				attr: { style: `width: ${cellWidth}%;` },
			})
			const midIdx = Math.floor((startIdx + endIdx) / 2)
			if (columns[midIdx] && isToday(columns[midIdx].date)) {
				cell.classList.add('gantt-timeline-cell--today')
			}
		})

		const row2 = container.createEl('div', {
			cls: 'gantt-timeline-row',
			attr: {
				style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
			},
		})

		columns.forEach((col) => {
			const monthStart = col.date
			const monthEnd = getMonthEnd(monthStart)
			let weekStart = new Date(monthStart)

			while (weekStart <= monthEnd) {
				const weekEnd = addDays(weekStart, 6)
				const actualEnd = weekEnd > monthEnd ? monthEnd : weekEnd
				const startDay = weekStart.getDate()
				const endDay = actualEnd.getDate()
				const daysInWeek = daysBetween(weekStart, actualEnd) + 1
				const cellWidth = (daysInWeek / totalDays) * 100

				row2.createEl('div', {
					cls: 'gantt-timeline-cell gantt-timeline-cell--small',
					text: `${startDay}-${endDay}`,
					attr: { style: `width: ${cellWidth}%;` },
				})

				weekStart = addDays(actualEnd, 1)
			}
		})
	} else if (zoom === GanttZoom.week) {
		const row1 = container.createEl('div', {
			cls: 'gantt-timeline-row',
			attr: {
				style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
			},
		})

		const weeks = new Map<
			string,
			{ startIdx: number; endIdx: number; label: string }
		>()

		columns.forEach((col, idx) => {
			const weekStart = addDays(col.date, -col.date.getDay())
			const key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
			const existing = weeks.get(key)
			if (existing) {
				existing.endIdx = idx
			} else {
				weeks.set(key, {
					startIdx: idx,
					endIdx: idx,
					label: col.label,
				})
			}
		})

		weeks.forEach(({ startIdx, endIdx, label }) => {
			const widthDays =
				(endIdx - startIdx + 1) * 7
			const cellWidth = (widthDays / totalDays) * 100
			row1.createEl('div', {
				cls: 'gantt-timeline-cell',
				text: label,
				attr: { style: `width: ${cellWidth}%;` },
			})
		})

		const row2 = container.createEl('div', {
			cls: 'gantt-timeline-row',
			attr: {
				style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
			},
		})

		columns.forEach((col) => {
			const cellWidth = (col.widthDays / totalDays) * 100
			const dayName = col.date.toLocaleDateString(undefined, {
				weekday: 'short',
			})
			row2.createEl('div', {
				cls: `gantt-timeline-cell gantt-timeline-cell--small${isWeekend(col.date) ? ' gantt-timeline-cell--weekend' : ''}`,
				text: dayName.substring(0, 2),
				attr: { style: `width: ${cellWidth}%;` },
			})
		})
	} else {
		const months = new Map<
			string,
			{ startIdx: number; endIdx: number; label: string }
		>()

		columns.forEach((col, idx) => {
			const key = `${col.date.getFullYear()}-${col.date.getMonth()}`
			const existing = months.get(key)
			if (existing) {
				existing.endIdx = idx
			} else {
				months.set(key, {
					startIdx: idx,
					endIdx: idx,
					label: col.date.toLocaleDateString(undefined, {
						month: 'long',
						year: 'numeric',
					}),
				})
			}
		})

		const row1 = container.createEl('div', {
			cls: 'gantt-timeline-row',
			attr: {
				style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
			},
		})

		months.forEach(({ startIdx, endIdx, label }) => {
			const daysInMonth = endIdx - startIdx + 1
			const cellWidth = (daysInMonth / totalDays) * 100
			const cell = row1.createEl('div', {
				cls: 'gantt-timeline-cell',
				text: label,
				attr: { style: `width: ${cellWidth}%;` },
			})
			const midIdx = Math.floor((startIdx + endIdx) / 2)
			if (columns[midIdx] && isToday(columns[midIdx].date)) {
				cell.classList.add('gantt-timeline-cell--today')
			}
		})

		const row2 = container.createEl('div', {
			cls: 'gantt-timeline-row',
			attr: {
				style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
			},
		})

		columns.forEach((col) => {
			const cellWidth = (1 / totalDays) * 100
			const today = isToday(col.date)
			const isSun = col.date.getDay() === 0
			const isSat = col.date.getDay() === 6
			row2.createEl('div', {
				cls: `gantt-timeline-cell gantt-timeline-cell--small${isSun || isSat ? ' gantt-timeline-cell--weekend' : ''}${today ? ' gantt-timeline-cell--today' : ''}`,
				text: `${col.date.getDate()}`,
				attr: { style: `width: ${cellWidth}%;` },
			})
		})
	}
}

function addTodayLine(
	rightBody: HTMLElement,
	minDate: Date,
	totalDays: number,
	dayWidth: number,
	taskCount: number,
): void {
	const today = startOfDay(new Date())
	const daysSinceStart = daysBetween(minDate, today)

	if (daysSinceStart < 0 || daysSinceStart > totalDays) return

	const lineX = daysSinceStart * dayWidth

	rightBody.createEl('div', {
		cls: 'gantt-today-line',
		attr: {
			style: `left: ${lineX}px; height: ${taskCount * 40 + 8}px;`,
		},
	})
}

export function renderGantt(
	container: HTMLElement,
	notes: TFile[],
	config: GanttConfig,
): void {
	const header = container.createEl('div', {
		cls: 'gantt-header',
	})

	header.createEl('h3', {
		text: t('GANTT_TITLE'),
		cls: 'gantt-header__title',
	})

	const zoomContainer = header.createEl('div', {
		cls: 'gantt-header__zoom',
	})

	const zoomLevels: Array<{ key: GanttZoom; label: string }> = [
		{ key: GanttZoom.day, label: t('GANTT_ZOOM_DAY') },
		{ key: GanttZoom.week, label: t('GANTT_ZOOM_WEEK') },
		{ key: GanttZoom.month, label: t('GANTT_ZOOM_MONTH') },
	]
	zoomLevels.forEach(({ key, label }) => {
		const btn = zoomContainer.createEl('button', {
			cls: `gantt-zoom-btn${config.zoom === key ? ' gantt-zoom-btn--active' : ''}`,
			text: label,
		})
		btn.addEventListener('click', () => {
			config.onZoomChange(key)
		})
	})

	if (notes.length === 0) {
		container.createEl('div', {
			text: t('GANTT_EMPTY'),
			cls: 'gantt-empty',
		})
		return
	}

	const tasks = parseTasks(notes, config.board, config.app)
	const { minDate, maxDate } = getDateRange(tasks)
	const totalDays = daysBetween(minDate, maxDate)

	const columns = buildTimeline(minDate, maxDate, config.zoom)
	const dayWidth = getDayWidth(config.zoom)
	const totalWidthPx = totalDays * dayWidth

	const wrapper = container.createEl('div', {
		cls: 'gantt-wrapper',
	})

	const leftPane = wrapper.createEl('div', {
		cls: 'gantt-left-pane',
	})

	const rightPane = wrapper.createEl('div', {
		cls: 'gantt-right-pane',
	})

	const leftHeader = leftPane.createEl('div', {
		cls: 'gantt-left-header',
	})
	leftHeader.createEl('span', {
		text: t('GANTT_TITLE'),
		cls: 'gantt-left-header__label',
	})

	const rightHeader = rightPane.createEl('div', {
		cls: 'gantt-right-header',
	})
	rightHeader.createEl('div', {
		cls: 'gantt-timeline-header',
		attr: {
			style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
		},
	})

	const timelineHeaderEl = rightHeader.querySelector('.gantt-timeline-header')
	if (timelineHeaderEl) {
		renderTimelineHeader(
			timelineHeaderEl as HTMLElement,
			columns,
			totalDays,
			totalWidthPx,
			config.zoom,
		)
	}

	const leftBody = leftPane.createEl('div', {
		cls: 'gantt-left-body',
	})

	const rightBody = rightPane.createEl('div', {
		cls: 'gantt-right-body',
		attr: {
			style: `min-width: ${totalWidthPx}px; width: ${totalWidthPx}px;`,
		},
	})

	synchronizeScroll(leftBody, rightBody)

	const ROW_HEIGHT = 40

	tasks.forEach((task, index) => {
		const isOdd = index % 2 === 1

		const taskRow = leftBody.createEl('div', {
			cls: `gantt-task-row${isOdd ? ' gantt-task-row--alt' : ''}`,
			attr: { style: `height: ${ROW_HEIGHT}px;` },
		})

		taskRow.createEl('div', {
			cls: 'gantt-task-dot',
			attr: { style: `background-color: ${task.color};` },
		})

		const taskTitle = taskRow.createEl('div', {
			cls: 'gantt-task-title',
			text: task.title,
		})

		taskTitle.addEventListener('click', () => {
			config.onTaskClick(task.note)
		})

		const barRow = rightBody.createEl('div', {
			cls: `gantt-bar-row${isOdd ? ' gantt-bar-row--alt' : ''}`,
			attr: { style: `height: ${ROW_HEIGHT}px;` },
		})

		const startOffsetDays = daysBetween(minDate, task.start)
		const durationDays = Math.max(1, daysBetween(task.start, task.end))

		const barLeft = startOffsetDays * dayWidth
		const barWidth = Math.max(durationDays * dayWidth, dayWidth)

		const bar = barRow.createEl('div', {
			cls: 'gantt-bar',
			attr: {
				style: `left: ${barLeft}px; width: ${barWidth}px; background-color: ${task.color};`,
				title: `${task.title}: ${task.start.toLocaleDateString()} - ${task.end.toLocaleDateString()} (${durationDays}d)`,
			},
		})

		if (barWidth > 60) {
			const textColor = getContrastColor(task.color)
			bar.createEl('span', {
				cls: 'gantt-bar-label',
				text: task.title,
				attr: { style: `color: ${textColor};` },
			})
		}
	})

	addTodayLine(rightBody, minDate, totalDays, dayWidth, tasks.length)

	leftBody.createEl('div', { cls: 'gantt-spacer' })
	rightBody.createEl('div', { cls: 'gantt-spacer' })
}
