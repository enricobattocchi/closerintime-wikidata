# #closerintime

Visualize the time between historical events.

Pick up to three historical events and see them on a proportional timeline ending at *now*. The app generates comparison sentences like *"The Great Pyramid is closer in time to us than to the Big Bang"* and renders them as shareable links with correct Open Graph metadata.

## Tech stack

- **Next.js 16** (App Router, SSR, TypeScript)
- **Netlify Blobs** for event storage (JSON key-value, ~330 events)
- **IndexedDB** via Dexie (user-added local events, stored in browser)
- **CSS Modules** with responsive horizontal/vertical timeline layout
- **MUI Icons** for event category icons
- **PWA** via @ducanh2912/next-pwa (service worker, offline support)

## Getting started

Requires Node.js 22+ and the [Netlify CLI](https://docs.netlify.com/cli/get-started/).

```bash
npm install
netlify link                    # link to your Netlify site
npm run seed:blobs              # one-time: uploads events.json to Netlify Blobs
npm run dev                     # starts netlify dev (wraps next dev)
```

Open [http://localhost:8888](http://localhost:8888).

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server via `netlify dev` (provides Blobs API locally) |
| `npm run dev:next` | Start Next.js dev server directly (no Blobs, uses `--webpack` for PWA) |
| `npm run build` | Production build (uses `--webpack` for PWA service worker) |
| `npm run build:watch` | Re-runs production build on source file changes |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run lint` | Run ESLint |
| `npm run seed:blobs` | One-time: upload events.json to Netlify Blobs |
| `npm run backup` | Backup Netlify Blobs data |

### Environment variables

Create `.env.local`:

```
ADMIN_TOKEN=your-secure-token
```

Set the same token on Netlify:

```bash
netlify env:set ADMIN_TOKEN your-secure-token
```

Optional Telegram notifications for new submissions:

```
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

## Building for production

```bash
npm run build
```

The build uses `--webpack` to enable PWA service worker generation (Turbopack does not support the PWA plugin). Event pages use ISR with a 1-hour revalidation window; admin actions trigger on-demand revalidation.

## Features

- **Dark mode** — automatic via system preference, or manually toggle between System / Light / Dark in Settings. Choice persists across sessions.
- **Category filters** — filter the event search by category (history, science, music, etc.) using filter chips in the dropdown.
- **Dynamic OG images** — shared links generate branded Open Graph images with the comparison sentence text, rendered server-side via `next/og`.
- **Image export** — download the timeline + sentence as a PNG image.
- **Local events** — add personal events stored in your browser (IndexedDB). They appear in the timeline but never leave your device.
- **Event submissions** — submit events for inclusion in the main database. Submissions go through admin approval at `/admin`.

## Project structure

```
src/
  app/
    layout.tsx              # Root layout, metadata, fonts, theme script
    page.tsx                # Home (empty state)
    [...ids]/page.tsx       # ISR for /id1, /id1/id2, /id1/id2/id3
    admin/page.tsx          # Admin dashboard (submissions + event management)
    api/
      events/route.ts       # GET all enabled events as JSON
      og/route.tsx           # Dynamic Open Graph image generation
      submissions/route.ts  # POST user event submissions
      admin/
        submissions/route.ts # GET/PATCH pending submissions (auth required)
        events/route.ts      # GET/PATCH/DELETE events (auth required)
  components/
    Chooser/                # Autocomplete search, category filters, add event form
    Timeline/               # Proportional horizontal/vertical timeline
    Admin/                  # Admin shell, submission review, event manager
    Sentence.tsx            # Comparison sentence as shareable link
    HelpModal.tsx           # Instructions modal
    SettingsModal.tsx       # Theme + timespan format settings
    CategoryIcon.tsx        # Maps event type to MUI icon
  lib/
    date-utils.ts           # UTC date creation, precise diffs, formatting
    timeline-math.ts        # Proportional segment computation
    sentence.ts             # Comparison sentence generation
    url-params.ts           # URL segment parsing (shared by page + OG route)
    db.ts                   # Netlify Blobs store accessors
    events.ts               # Async event reads from Blobs
    types.ts                # TypeScript interfaces + EVENT_TYPES constant
  hooks/
    useLocalEvents.ts       # IndexedDB CRUD for personal events
    useSettings.ts          # localStorage for theme + display preferences
    useExport.ts            # Image export logic (html2canvas)
    useCachedEvents.ts      # Client-side event cache
  styles/                   # CSS Modules
data/
  events.json               # Historical event data (reference copy)
scripts/
  seed-blobs.ts             # One-time migration: uploads events.json to Blobs
```

## Testing

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
```

Tests use Vitest with jsdom. Coverage includes:
- **Library tests** — date utils, timeline math, sentence generation, custom event URLs
- **Component tests** — Sentence, SettingsModal, TimelineMarker
- **API route tests** — submission validation/rate-limiting, admin auth/CRUD

## How it works

- URLs like `/42/107` are server-rendered with `generateMetadata()` so link previews show the comparison sentence as the page title and a dynamically generated OG image.
- IDs in the URL are always sorted ascending; out-of-order URLs redirect to the canonical form.
- User-added events get negative IDs and stay in IndexedDB — they never touch the server.
- Users can optionally submit events for inclusion in the main database. Submissions go through admin approval at `/admin`.
- The admin dashboard also allows editing, disabling, and deleting existing events. Admin changes trigger ISR revalidation.
- The timeline switches from horizontal to vertical layout below 640px.

## License

GPL-3.0
