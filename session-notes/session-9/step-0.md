# Session 9 (v9) — Step 0: Design system foundation

## What was built
- `frontend/src/styles/_tokens.scss` (new) — SCSS variables for color, spacing (xs–xl), border-radius, shadow, and font, plus a `mobile` mixin wrapping `@media (max-width: 639px)`. Values currently mirror the app's existing hardcoded palette 1:1 (e.g. `$color-primary: #2563eb`) — this step is pure scaffolding, not a redesign; the palette itself gets reconsidered in Step 1.
- `frontend/src/styles/main.scss` (was empty, unused) — now `@use`s `tokens` and holds the app's one global CSS reset (`box-sizing: border-box`, margin reset, base font/color), imported exactly once in `main.tsx`.
- `frontend/src/main.tsx` — added the `main.scss` import.
- `frontend/index.html` — page `<title>` changed from the default "frontend" to "TripFlow".
- `lucide-react` added as a dependency (`npm install` run, 0 vulnerabilities).

## Why each decision was made
- **SCSS variables over CSS custom properties** — user's explicit choice; simpler, compile-time only, no runtime cost, matches this app's single-theme scope (no dark mode planned).
- **Two files instead of one `main.scss`** — Vite compiles each component's imported `.scss` independently (no shared compilation graph), so a variables file that also emits real CSS rules would get that CSS silently duplicated into every component that `@use`s it for variables. Splitting into a rules-free `_tokens.scss` (safe to `@use` anywhere) and a `main.scss` holding the actual global rules (imported once, never `@use`d elsewhere) avoids that duplication bug while still matching the plan's "one shared token file" intent.
- **Palette values left unchanged from the current hardcoded ones** — Step 0 is meant to be pure plumbing; deliberately deferred any real color/background decisions to Step 1 so this step carries zero visual risk.
- **`lucide-react`** — confirmed with the user during planning as the icon library for the rest of the session (header/nav, Google Maps button, spinners, etc.), added now so every later step can just import from it.

Suggested commit title: `chore: add SCSS design tokens, global reset, and lucide-react`
