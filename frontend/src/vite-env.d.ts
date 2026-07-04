// Pulls in Vite's own ambient types (e.g. import.meta.hot for HMR).
/// <reference types="vite/client" />

// Declares the VITE_-prefixed env vars so import.meta.env.X typechecks —
// TypeScript has no way to know they exist otherwise.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
