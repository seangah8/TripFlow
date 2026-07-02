# Session 0 — Step 2: Backend scaffold

## What was built
- `backend/package.json` — dependencies: `express`, `typeorm`, `pg`, `typeorm-naming-strategies`, `reflect-metadata`, `dotenv`. Dev dependencies: `typescript`, `tsx`, `@types/express`, `@types/node`.
- Scripts: `dev` (`tsx watch src/server.ts`), `build` (`tsc`), `typecheck` (`tsc --noEmit`), `seed` (`tsx src/seeds/seed.ts`).
- `backend/tsconfig.json` — CommonJS + ES2022 target, `strict: true`, `experimentalDecorators` + `emitDecoratorMetadata` enabled (required by TypeORM's decorator-based entities).
- Empty `backend/src/` subfolders matching the structure in `CLAUDE.md` Section 2: `config/`, `entities/`, `api/routes/`, `api/controllers/`, `api/services/`, `seeds/`, `utils/`.
- Ran `npm install` — 189 packages, 0 vulnerabilities.

## Why these decisions were made
- **`tsx` over `ts-node-dev`/`nodemon`** — confirmed with you earlier: single dependency, actively maintained, fast esbuild-based transpilation for `npm run dev`.
- **CommonJS module target** — TypeORM's decorator metadata (`emitDecoratorMetadata`) and its ecosystem are most battle-tested under CommonJS; avoids ESM interop friction with `reflect-metadata`.
- **`strict: true`** — matches `CLAUDE.md` Section 6's TypeScript conventions (explicit types, no implicit `any`).
- **No test runner installed yet** — per the plan's stated assumption, Jest arrives in Session 1 alongside the first real tests (`clustering.ts`). Installing it now with nothing to test would be dead setup.
- **Folder structure mirrors `CLAUDE.md` exactly**, including the `api/services/` layer discussed during planning (controllers never touch the DB directly — only services do).
