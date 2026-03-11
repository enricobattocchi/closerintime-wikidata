# wiki.closerintime

A refactor of [closerintime](https://github.com/enricobattocchi/closerintime) that replaces the curated event database with real-time Wikidata search.

Search for any number of historical events and see them on a proportional timeline. Give your timeline a custom title, share it as a link, or export it as a PNG image.

## Tech stack

- **Next.js 16** (App Router, SSR, TypeScript)
- **Wikidata** for real-time event search (REST API: `wbsearchentities` + `wbgetentities`)
- **CSS Modules** with responsive horizontal/vertical timeline layout
- **MUI Icons** for event category icons
- **PWA** via @ducanh2912/next-pwa (service worker, offline support)

## Getting started

Requires Node.js 22+.

```bash
npm install
npm run dev:next                # starts Next.js dev server
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server via `netlify dev` |
| `npm run dev:next` | Start Next.js dev server directly (uses `--webpack` for PWA) |
| `npm run build` | Production build (uses `--webpack` for PWA service worker) |
| `npm run build:watch` | Re-runs production build on source file changes |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run lint` | Run ESLint |

## Building for production

```bash
npm run build
```

The build uses `--webpack` to enable PWA service worker generation (Turbopack does not support the PWA plugin). Event pages use ISR with a 1-hour revalidation window.

## Features

- **Real-time Wikidata search** — search for any historical event, person, or milestone in Wikidata's knowledge base. Results are fetched on demand with debounced queries.
- **Dark mode** — automatic via system preference, or manually toggle between System / Light / Dark in Settings. Choice persists across sessions.
- **Unlimited events** — add as many events as you want. For people, choose between birth and death dates directly from the dropdown.
- **Editable title** — click the pencil icon to name your timeline; the title is used in the page title, OG image, and share dialog.
- **Zoom mode** — toggle zoom on crowded timelines. The width scales based on the smallest gap between markers so info cards never overlap.
- **Removable "Now" marker** — when you have 2+ events, you can hide the present-day marker and re-add it later.
- **Smart overlap detection** — marker info cards that would overlap are automatically flipped above the timeline line.
- **Dynamic OG images** — shared links generate branded Open Graph images with the timeline title, rendered server-side via `next/og`.
- **Image export** — download the timeline as a PNG image with a "wiki:closerintime" watermark. Disabled while zoomed to avoid cropped output.
- **Random event** — add a random Wikidata event to your timeline with one click.

## Project structure

```
src/
  app/
    layout.tsx              # Root layout, metadata, fonts, theme script
    page.tsx                # Home (empty state)
    [...ids]/page.tsx       # ISR for /Q42, /Q42/Q107, etc.
    api/
      search/route.ts       # GET /api/search?q=... → Wikidata search proxy
      og/route.tsx           # Dynamic Open Graph image generation
  components/
    Chooser/                # Single search input with Wikidata autocomplete
    Timeline/               # Proportional horizontal/vertical timeline with interactive markers
    EditableTitle.tsx        # Editable timeline title with auto-resize
    ShareToolbar.tsx         # Copy link, share, export, zoom, edit-title, and show-Now buttons
    HelpModal.tsx           # Instructions modal
    SettingsModal.tsx       # Theme + timespan format settings
    CategoryIcon.tsx        # Maps event type to MUI icon
  lib/
    wikidata.ts             # Wikidata REST API: search + fetch by Q-ID
    date-utils.ts           # UTC date creation, precise diffs, formatting
    timeline-math.ts        # Proportional segment computation
    url-params.ts           # URL segment parsing (Q-IDs)
    custom-event-url.ts     # Shareable path builder
    types.ts                # TypeScript interfaces + EVENT_TYPES constant
  hooks/
    useWikidataSearch.ts    # Debounced search hook (300ms, AbortController)
    useSettings.ts          # localStorage for theme + display preferences
    useExport.ts            # Image export logic (html2canvas)
  styles/                   # CSS Modules
```

## Testing

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
```

Tests use Vitest with jsdom. Coverage includes:
- **Library tests** — date utils, timeline math, URL building
- **Component tests** — SettingsModal, TimelineMarker

## How it works

- Events are sourced from Wikidata in real time. The search uses the `wbsearchentities` API for fast text matching, then `wbgetentities` to fetch dates, types, and Wikipedia links. Multiple date properties are checked (P585, P580, P571, P577, P569, P619, P620, P1191, P606) to cover different kinds of events.
- URLs like `/Q43653/Q107` use Wikidata Q-IDs. Append `~d` for death dates (e.g. `/Q42~d`). They are server-rendered with `generateMetadata()` so link previews show the timeline title and a dynamically generated OG image. The custom title and "hide Now" preference are stored as query params (`?t=...&now=0`).
- Q-IDs in the URL are always sorted; out-of-order URLs redirect to the canonical form.
- The timeline switches from horizontal to vertical layout below 640px.

## License

GPL-3.0
