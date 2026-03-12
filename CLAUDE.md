# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

wiki.closerintime — a real-time historical event timeline visualizer built with Next.js 16 and React 19. Users search for events via the Wikidata API, which are rendered as proportionally-spaced markers on a horizontal (desktop) or vertical (mobile) timeline.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server via `netlify dev` (port 8888) |
| `npm run dev:next` | Next.js dev server directly (port 3000, uses --webpack for PWA) |
| `npm run build` | Production build (must use --webpack, not Turbopack, for PWA service worker) |
| `npm test` | Run all Vitest tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint via `next lint` |

Node 22 required (see `.nvmrc`).

## Architecture

### Data Flow

```
EventAutocomplete (Wikidata search) → Chooser (state + URL building) → router.push()
  → [...ids]/page.tsx (SSR fetch + metadata) → Timeline (proportional rendering + animations)
```

### URL Structure

Routes are catch-all at `src/app/[...ids]/page.tsx`. Format: `/Q42/Q107/Q1234~d`
- Q-IDs are Wikidata entity identifiers, always sorted for canonical URLs (redirects enforce order)
- `~d` suffix marks death date instead of birth date
- Query params: `?t=customTitle&now=0`
- ISR with 1-hour revalidation

### Wikidata Integration (`src/lib/wikidata.ts`)

Two-step search: `wbsearchentities` (text match) → `wbgetentities` (full data fetch). Checks 9 date properties in priority order (P585, P580, P577, P571, P569, P619, P620, P1191, P606). Maps Wikidata types to 16 EVENT_TYPES for UI icons. No auth required.

### Timeline Rendering (`src/components/Timeline/`)

- Proportional segments computed by `src/lib/timeline-math.ts`
- Smart overlap detection: info cards auto-flip above/below
- Zoom mode scales container width based on smallest gap
- Animations via Web Animations API
- Responsive: horizontal → vertical at 640px breakpoint

### State Management

- URL-driven: navigation triggers SSR data fetch
- `Chooser` (`src/components/Chooser/Chooser.tsx`) orchestrates event selection and URL building
- `useWikidataSearch` hook: 300ms debounce with AbortController cancellation
- `useSettings` hook: localStorage for theme (light/dark/system) and timespan format

### Date Handling (`src/lib/date-utils.ts`)

All dates are UTC. Supports B.C. dates, leap years, and three timespan display formats (days, years, precise).

### Styling

CSS Modules in `src/styles/`. Theme variables support light/dark mode. No CSS framework.

## Testing

Vitest with jsdom environment and @testing-library/react. Tests are co-located in `src/lib/` (`.test.ts`) and `src/components/` (`.test.tsx`). Setup file: `src/test-setup.ts`.

## Deployment

GitHub Actions (`deploy.yml`): build → test → deploy to Netlify. PRs get preview deploys with comment links. PWA with service worker via @ducanh2912/next-pwa.
