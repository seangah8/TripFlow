# Session 9 (v9) — Step 1: App header and background

## Live design decisions (asked before building)
- Header content: logo/home-link + account email + logout (consolidating what was duplicated in DashboardPage/VacationPage).
- Header appears on every authenticated page, including TripPage, which keeps its own contextual sub-header underneath.
- Primary color: `#35aae6` (user-specified).
- App background: literally midway between the primary color and white (user-specified), computed via Sass's `color.mix()`.

## What was built
- `frontend/src/components/Header.tsx` + `Header.scss` (new) — persistent header with brand/home-link, account email, logout button.
- `App.tsx` — authenticated routes now render inside an `.app-shell` wrapper (`Header` + `.app-shell__content`), added to `main.scss`.
- `_tokens.scss` — `$color-primary: #35aae6`; new `$color-bg-app: color.mix($color-primary, white, 50%)`, applied as the shell content's background.
- `DashboardPage.tsx`/`.scss`, `VacationPage.tsx`/`.scss` — removed now-duplicated header markup/styles.
- `TripPage.scss` — `.trip-page`/`.trip-page__status` changed `height: 100vh` → `height: 100%` so the page fills the shell's remaining space instead of double-counting the header's height against the full viewport.

## Why each decision was made
- Consolidating the header removes duplicate title/account/logout code that existed separately in two pages.
- Wrapping every authenticated page (including TripPage) in the shell keeps chrome consistent app-wide; TripPage's own back-link/city/maps-export sub-header stays as page-specific content underneath it.
- `color.mix()` in Sass directly computes the "literally in the middle" background you asked for, rather than a hand-picked approximation.
- Deliberately left every other file's hardcoded `#2563eb` untouched — palette rollout to the rest of the app happens incrementally in Steps 2–9, each in its own file. The app will show two slightly different blues until then; that's expected, not a bug.
- Verified via `npm run typecheck` and `npm run build` (both clean) — visual confirmation is yours to do in the browser.

Suggested commit title: `feat: add shared app header, layout shell, and primary color/background tokens`
