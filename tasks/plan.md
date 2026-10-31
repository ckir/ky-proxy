# Implementation Plan: Proxy Support in Ky

## Overview
Implement first-class proxy support and explicit dispatcher typing across supported runtimes (Node.js, Bun, Deno, and Browsers). This feature introduces the `proxy` option (`string | URL | ProxyOptions | false | undefined`), adds explicit typing for `dispatcher`, ensures runtime-specific handling and validation, and enforces Ky's convention of rejecting `null` values with clear TypeErrors.

## Architecture Decisions
1. **Zero Runtime Dependencies:**
   - Ky will maintain zero external runtime dependencies.
   - In Node.js, if a `proxy` option is specified and `dispatcher` is absent, Ky dynamically imports `undici` to instantiate a `ProxyAgent`. If `undici` is not installed, Ky throws a clear, actionable error instructing the user to install `undici` or provide a custom `dispatcher`.
2. **Cross-Runtime Compatibility:**
   - **Bun:** Passed directly to native `fetch()` via `{ proxy }` in `RequestInit`.
   - **Browsers:** Throws an explicit `TypeError` if `proxy` is supplied (since browser Fetch API forbids programmatic client proxy configuration), unless `proxy: false`.
   - **Node.js:** Converts `proxy` to `dispatcher` using Undici's `ProxyAgent` if available; forwards explicit `dispatcher` directly.
3. **Strict Non-Null Conventions:**
   - Passing `null` to `proxy` or `dispatcher` immediately throws a `TypeError` per repository conventions in `AGENTS.md`.
   - `undefined` is used to clear or represent absent options.
4. **Option Inheritance and Deep Merge:**
   - `proxy` and `dispatcher` are properly handled during `ky.create()` and `ky.extend()`.
   - Passing `proxy: undefined` in `.extend()` removes any inherited proxy.
   - Class instances for `dispatcher` (e.g., Undici `Agent` or `ProxyAgent`) replace defaults instead of being merged into plain objects.

## Task List

### Phase 1: Types and Registry Updates
- [ ] Task 1: Add `ProxyOptions`, `proxy`, and `dispatcher` types to `source/types/options.ts` and update option registries in `source/core/constants.ts`
- [ ] Task 2: Implement validation and non-null enforcement in `source/utils/merge.ts` and `source/core/Ky.ts`

### Checkpoint: Foundation
- [ ] TypeScript compiles cleanly with `npm run build`
- [ ] Lint checks pass with `npx xo`

### Phase 2: Runtime Proxy and Dispatcher Resolution
- [ ] Task 3: Implement runtime resolution for `proxy` and `dispatcher` in `source/core/Ky.ts` (handling Node.js, Bun, and browser checks)
- [ ] Task 4: Allow `proxy` and `dispatcher` to be updated in `beforeRetry` hooks

### Checkpoint: Core Implementation
- [ ] All existing tests in `test/fetch.ts` and test suite continue to pass

### Phase 3: Comprehensive Tests and Documentation
- [ ] Task 5: Add unit tests in `test/proxy.ts` covering types, validation, inheritance, non-null assertions, and mock runtime behavior
- [ ] Task 6: Update `readme.md` documentation and remove `@ts-expect-error` from dispatcher/proxy examples

### Checkpoint: Complete
- [ ] Full test suite passes: `npm run build && tsc --project tsconfig.test.json && npx ava test/proxy.ts test/fetch.ts`
- [ ] Linter passes: `npx xo`
- [ ] All success criteria met
