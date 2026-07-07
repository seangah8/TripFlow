/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Defensive, on top of tsconfig.build.json already excluding tests from dist/ —
  // stops a stale/pre-fix dist/ from ever making Jest run every test twice.
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Transpile-only (no type-checking) is inferred from tsconfig.json's
        // own `isolatedModules: true` — `npm run typecheck` already owns type
        // verification for the whole src tree; this keeps `npm test` fast and
        // consistent with tsx's no-typecheck runtime behavior.
        // Override NodeNext to plain CommonJS/Node just for the Jest transform:
        // the backend has no "type": "module" in package.json (so it already
        // runs as CommonJS via tsx), but re-deriving that from NodeNext inside
        // ts-jest's transform is a known rough edge — sidestep it explicitly.
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
        },
      },
    ],
  },
};
