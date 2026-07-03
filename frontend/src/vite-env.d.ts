// Pulls in Vite's own ambient types (e.g. import.meta.hot for HMR).
/// <reference types="vite/client" />

// Vite only exposes env vars prefixed VITE_ to browser code, reading from
// import.meta.env (see frontend/.env). TypeScript doesn't know this specific
// var exists unless we declare it here — without this, usePlaces.ts's
// `import.meta.env.VITE_API_URL` would fail to typecheck.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
