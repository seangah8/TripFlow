/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Transpile only, no type-checking here — `npm run typecheck` already
        // owns type verification for the whole src tree; this keeps `npm test`
        // fast and consistent with tsx's no-typecheck runtime behavior.
        isolatedModules: true,
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
