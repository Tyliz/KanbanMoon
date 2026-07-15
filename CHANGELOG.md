# Changelog

All notable changes to Kanban Moonlight will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.2.0] - 14/07/2026

### Added

- **Gantt chart**: Rewritten from scratch as a standalone module (`src/views/ganttChart.ts`).
- **Start column configuration**: Each board now has a configurable "Start Column" via radio buttons in the Board Modal. The Gantt chart uses this to calculate task start dates from history.
- **Today line**: A vertical line on the Gantt timeline indicating the current date.

### Changed

- **Gantt date calculation**: Task start/end dates now come from history events (created → start, last completed → end) instead of frontmatter `startDate`/`dueDate`.
- **End date for in-progress tasks**: Tasks not yet completed show their bar extending to today's date instead of last modification date.
- **Timeline headers**: All zoom levels now have two-row headers — Month shows month name + date ranges, Week shows week dates + day names, Day shows month name + day numbers.
- **Month zoom**: Wider layout (minimum 600px) with readable date ranges (`1-7`, `8-14`, etc.) instead of compressed `S1, S2, S3` labels.
- **Day zoom**: Fixed alignment between day numbers and task bars. Days use Obsidian locale via `moment.js`.
- **Bar labels**: Contrast color (black/white) based on background color for readability.
- **Scroll synchronization**: Uses `requestAnimationFrame` with anti-loop flag for smooth synchronized scrolling.
- **Alternating rows**: Subtle background difference for better row tracking.

### Fixed

- Date alignment between timeline header and task bars.
- Zoom level rendering (was inferring zoom from column count instead of using actual setting).
- Scroll sync between left (task names) and right (timeline) panes.
- Month timeline showing confusing `S1, S2, S3` labels.
- Day zoom showing duplicated/overlapping date labels.
- `--small` CSS class overriding today cell text color.

## [1.1.0] - 07/07/2026

### Added

- **Multi-board support**: Create and manage multiple independent Kanban boards, each with its own columns, categories, tag, and folder configuration.
- **Board tabs**: Switch between boards via a tab bar at the top of the Kanban view. Tabs include a tooltip showing available actions.
- **Board modal**: Create or edit boards with name, tag, and folder fields.
- **Delete board**: Remove boards from Settings or Board Modal with a confirmation dialog.
- **Collapsible settings sections**: Frontmatter properties section in Settings is now collapsible.
- **Settings button**: Quick access to Settings from the Kanban view (gear icon, bottom-right).

### Changed

- Each board now has its own independent configuration (columns, categories, completed column).
- Board filtering is now a combination of tag + folder per board.
- CreateTaskModal uses the active board's configuration.

### Migration

- Existing single-board settings are automatically migrated to the new multi-board format.
- A "Default" board is created from previous settings.
- No user action required — migration runs transparently on first load.

## [1.0.1] - 01/07/2025

### Fixed

- Build errors and warning checks for release.
- Manifest ID corrections.

## [1.0.0] - 01/07/2025

### Added

- Initial release with single-board Kanban view.
- Drag & drop between columns.
- Create and delete tasks.
- Search and filter.
- Customizable columns and categories.
- Completion tracking with history log.
- Icon selector for columns and categories.
- i18n (English and Spanish).
- Auto-refresh on note changes.
