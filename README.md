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

### Environment variables

Create `.env.local`:

```
ADMIN_TOKEN=your-secure-token
```

Set the same token on Netlify:

```bash
netlify env:set ADMIN_TOKEN your-secure-token
```

## Building for production

```bash
npm run build
```

The build uses `--webpack` to enable PWA service worker generation (Turbopack does not support the PWA plugin). Pages are `force-dynamic` since they read from Netlify Blobs at request time.

## Project structure

```
src/
  app/
    layout.tsx              # Root layout, metadata, fonts
    page.tsx                # Home (empty state)
    [...ids]/page.tsx       # SSR for /id1, /id1/id2, /id1/id2/id3
    admin/page.tsx          # Admin dashboard (submissions + event management)
    api/
      events/route.ts       # GET all enabled events as JSON
      submissions/route.ts  # POST user event submissions
      admin/
        submissions/route.ts # GET/PATCH pending submissions (auth required)
        events/route.ts      # GET/PATCH/DELETE events (auth required)
  components/
    Chooser/                # Autocomplete search + add event form
    Timeline/               # Proportional horizontal/vertical timeline
    Admin/                  # Admin shell, submission review, event manager
    Sentence.tsx            # Comparison sentence as shareable link
    HelpModal.tsx           # Instructions modal
    SettingsModal.tsx       # Timespan format toggle
    CategoryIcon.tsx        # Maps event type to MUI icon
  lib/
    date-utils.ts           # UTC date creation, precise diffs, formatting
    timeline-math.ts        # Proportional segment computation
    sentence.ts             # Comparison sentence generation
    db.ts                   # Netlify Blobs store accessors
    events.ts               # Async event reads from Blobs
    types.ts                # TypeScript interfaces
  hooks/
    useLocalEvents.ts       # IndexedDB CRUD for personal events
    useSettings.ts          # localStorage for display preferences
  styles/                   # CSS Modules
data/
  events.json               # Historical event data (reference copy)
scripts/
  seed-blobs.ts             # One-time migration: uploads events.json to Blobs
```

## How it works

- URLs like `/42/107` are server-rendered with `generateMetadata()` so link previews show the comparison sentence as the page title.
- IDs in the URL are always sorted ascending; out-of-order URLs redirect to the canonical form.
- User-added events get negative IDs and stay in IndexedDB — they never touch the server.
- Users can optionally submit events for inclusion in the main database. Submissions go through admin approval at `/admin`.
- The admin dashboard also allows editing, disabling, and deleting existing events.
- The timeline switches from horizontal to vertical layout below 640px.

## License

GPL-3.0
