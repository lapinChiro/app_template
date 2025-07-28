# Progressive Type Checking Strategy

This project implements a progressive type checking approach that aligns with TDD principles.

## Why Progressive Type Checking?

Traditional monorepo setups often fail type checking until all packages are implemented. This leads to:
- Late discovery of type errors
- Large batches of errors to fix
- High cost of fixing accumulated type issues

## Our Approach

### Unified Configuration Strategy

1. **Single tsconfig.json** - Same configuration for type checking and building
2. **Test files included in build** - Ensures type safety is never compromised
3. **Progressive checking** - `tsconfig.active.json` tracks only implemented packages
4. **npm publish filtering** - `files` field excludes test files from published package

### Key Benefits

- **No configuration mismatch** - Type checking and build use identical settings
- **Complete type safety** - TypeScript handles all files consistently
- **Clean npm packages** - Test files excluded via `package.json` files field
- **Simple to understand** - One source of truth for TypeScript configuration

## Usage

### During Development (Recommended)
```bash
# Type check only implemented packages (includes test files)
npm run typecheck

# Auto-detect implemented packages and type check
npm run typecheck:update
```

### For CI/CD or Full Validation
```bash
# Type check all packages including Next.js apps
npm run typecheck:all

# Type check individual packages
npm run typecheck:packages
```

### Special Handling for Next.js Apps

Next.js apps are excluded from TypeScript project references due to fundamental incompatibility:
- Next.js requires `noEmit: true`
- Project references require `noEmit: false`

They are type-checked separately when running `typecheck:all`.

### Building Packages
```bash
# Build all TypeScript files (including tests)
cd packages/shared
npm run build  # Uses tsconfig.json
```

## How It Works

The `scripts/update-active-packages.js` script:
1. Scans all packages and apps
2. Detects which have TypeScript source files
3. Updates `tsconfig.active.json` with only active packages
4. Enables incremental type checking as you build

## Package Configuration

Each package has a single `tsconfig.json` that includes all source files (including tests).

Example `packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Example `packages/shared/package.json`:
```json
{
  "files": [
    "dist",
    "!dist/**/*.test.*",
    "!dist/**/test-utils",
    "!dist/**/__tests__"
  ],
  "scripts": {
    "build": "tsc"
  }
}
```

The `files` field ensures that when publishing to npm:
- All compiled files in `dist` are included
- Test files are excluded from the published package
- Development utilities are not distributed

## Adding a New Package

When you implement a new package:
1. Create the package structure
2. Add TypeScript source files
3. Create `tsconfig.json` (includes all source files)
4. Add `files` field to `package.json` to exclude test files from npm
5. Run `npm run typecheck:update`
6. Fix any cross-package type errors immediately

This ensures type safety is maintained incrementally, following TDD principles.

## Philosophy

By including test files in the TypeScript build:
- We ensure complete type safety across all code
- TypeScript's compiler guarantees consistency
- No post-processing that could introduce errors
- Simple, predictable behavior

The `files` field in `package.json` handles distribution concerns separately from build concerns, maintaining proper separation of responsibilities.