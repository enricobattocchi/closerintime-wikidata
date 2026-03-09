# #closerintime

Visualize the time between historical events.

Pick up to three historical events and see them on a proportional timeline ending at *now*. The app generates comparison sentences like *"The Great Pyramid is closer in time to us than to the Big Bang"* and renders them as shareable links with correct Open Graph metadata.

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
- **Dynamic OG images** — shared links generate branded Open Graph images with the comparison sentence text, rendered server-side via `next/og`.
- **Image export** — download the timeline + sentence as a PNG image.

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
    Chooser/                # Autocomplete search with Wikidata results
    Timeline/               # Proportional horizontal/vertical timeline
    Sentence.tsx            # Comparison sentence as shareable link
    HelpModal.tsx           # Instructions modal
    SettingsModal.tsx       # Theme + timespan format settings
    CategoryIcon.tsx        # Maps event type to MUI icon
  lib/
    wikidata.ts             # Wikidata REST API: search + fetch by Q-ID
    date-utils.ts           # UTC date creation, precise diffs, formatting
    timeline-math.ts        # Proportional segment computation
    sentence.ts             # Comparison sentence generation
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
- **Library tests** — date utils, timeline math, sentence generation, URL building
- **Component tests** — Sentence, SettingsModal, TimelineMarker

## How it works

- Events are sourced from Wikidata in real time. The search uses the `wbsearchentities` API for fast text matching, then `wbgetentities` to fetch dates, types, and Wikipedia links. Multiple date properties are checked (P585, P580, P571, P577, P569, P619, P620, P1191, P606) to cover different kinds of events.
- URLs like `/Q43653/Q107` use Wikidata Q-IDs. They are server-rendered with `generateMetadata()` so link previews show the comparison sentence as the page title and a dynamically generated OG image.
- Q-IDs in the URL are always sorted; out-of-order URLs redirect to the canonical form.
- The timeline switches from horizontal to vertical layout below 640px.

## License

GPL-3.0
