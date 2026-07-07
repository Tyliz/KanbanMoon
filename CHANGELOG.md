# Changelog

All notable changes to Kanban Moonlight will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

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
