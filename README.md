# Kanban Moonlight

A native Kanban board plugin for Obsidian. Transform your markdown notes into an interactive, visual Kanban board using frontmatter metadata.

## Features

- **Kanban Board View**: Renders notes tagged with a configurable tag (default `#project`) as cards in customizable columns.
- **Drag & Drop**: Move notes between columns by dragging cards — frontmatter state is updated automatically.
- **Search / Filter**: Real-time search across note titles, descriptions, types, and tags.
- **Customizable Columns**: Add, remove, reorder and rename columns. Configure each column's icon and color.
- **Types System**: Define types with custom colors to categorize notes (displayed as colored borders and tags).
- **Completion Tracking**: Mark tasks as complete with a single click. Completed notes appear in a dedicated column with a configurable time window (day/week/month/year).
- **History Log**: Every state change and completion is recorded in the note's frontmatter `history` array.
- **Auto-refresh**: The board refreshes automatically when notes are modified, created, or deleted.
- **i18n**: English and Spanish built-in.

## How it works

Notes are displayed as Kanban cards based on their frontmatter:

| Frontmatter property | Default | Description |
|---|---|---|
| `tags` | `#project` | Tag that determines which notes appear on the board |
| `state` | `Pending` | Current column (Pending, Working On, Review, Canceled, Completed) |
| `description` | — | Short description shown on the card |
| `type` | — | Category for color-coded borders |
| `completed` | `false` | Whether the task is completed |
| `history` | — | Auto-generated log of state changes |

## Screenshots

> Coming soon. Add your screenshots here.
