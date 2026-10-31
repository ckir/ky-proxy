# Task List: Proxy Support

## Task 1: Add `ProxyOptions`, `proxy`, and `dispatcher` types & option registries
**Description:** Define `ProxyOptions` and add `proxy` and `dispatcher` to `KyOptions` and `Options` in `source/types/options.ts`. Update `kyOptionKeys` in `source/core/constants.ts` so Ky recognises these options.

**Acceptance criteria:**
- [x] `ProxyOptions` type is exported with `url: string | URL` and optional `headers?: Record<string, string>`.
- [x] `proxy?: string | URL | ProxyOptions | false | undefined` is added to `KyOptions`.
- [x] `dispatcher?: unknown | undefined` is added to `Options` and `KyOptions`.
- [x] `kyOptionKeys` includes `proxy: true` and `dispatcher: true`.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npx xo`

**Dependencies:** None
**Files likely touched:**
- `source/types/options.ts`
- `source/core/constants.ts`
**Estimated scope:** Small (2 files)

---

## Task 2: Implement validation and non-null enforcement
**Description:** Ensure that passing `null` to `proxy` or `dispatcher` throws an explicit `TypeError` per repository conventions in `AGENTS.md`. Handle clearing with `undefined` during `ky.create()` and `ky.extend()` in `source/utils/merge.ts` and constructor validation in `source/core/Ky.ts`.

**Acceptance criteria:**
- [x] Passing `proxy: null` throws `The \`proxy\` option must not be \`null\`. Use \`undefined\` to clear it.`.
- [x] Passing `dispatcher: null` throws `The \`dispatcher\` option must not be \`null\`. Use \`undefined\` to clear it.`.
- [x] Passing invalid proxy type (e.g., number) throws a descriptive `TypeError`.
- [x] Clearing with `proxy: undefined` in `.extend()` works cleanly.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npx xo`

**Dependencies:** Task 1
**Files likely touched:**
- `source/utils/merge.ts`
- `source/core/Ky.ts`
**Estimated scope:** Small (2 files)

---

## Checkpoint: Foundation
- [x] TypeScript compiles cleanly with `npm run build`
- [x] Lint passes with `npx xo`

---

## Task 3: Implement runtime resolution in `Ky.ts`
**Description:** In `source/core/Ky.ts`, resolve `proxy` and `dispatcher` appropriately per runtime. In Node.js, attempt to resolve `proxy` to an Undici `ProxyAgent` when available, or throw an actionable error if `undici` is not installed. In Bun / runtimes with native proxy fetch, forward `proxy` in the init object. In browser environments, throw a `TypeError` if `proxy` is supplied. Forward `dispatcher` to `fetch`.

**Acceptance criteria:**
- [x] Browser environment detects `proxy` and throws `TypeError` ('The \`proxy\` option is not supported in browser environments.').
- [x] Node.js environment dynamically creates `ProxyAgent` from `undici` if `undici` is available; throws helpful guidance if missing.
- [x] Both `proxy` and `dispatcher` are passed to `fetch()` in the init object.
- [x] Specifying both conflicting `proxy` and `dispatcher` options throws a `TypeError`.

**Verification:**
- [x] Existing fetch tests pass: `npx ava test/fetch.ts`
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 2
**Files likely touched:**
- `source/core/Ky.ts`
- `source/utils/options.ts`
**Estimated scope:** Medium (2 files)

---

## Task 4: Allow `proxy` and `dispatcher` in `beforeRetry` hooks
**Description:** Update `beforeRetryOptionKeys` in `source/core/constants.ts` and attempt options re-evaluation in `source/core/Ky.ts` so retries can adjust or rotate proxies/dispatchers.

**Acceptance criteria:**
- [x] `beforeRetryOptionKeys` includes `'proxy'` and `'dispatcher'`.
- [x] A `beforeRetry` hook can return updated `proxy` or `dispatcher`.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npx xo`

**Dependencies:** Task 3
**Files likely touched:**
- `source/core/constants.ts`
- `source/core/Ky.ts`
**Estimated scope:** Small (2 files)

---

## Checkpoint: Core Implementation
- [x] Existing tests in `test/fetch.ts` and `test/hooks.ts` continue to pass
- [x] Build succeeds: `npm run build`

---

## Task 5: Add comprehensive tests in `test/proxy.ts`
**Description:** Write a full test suite in `test/proxy.ts` verifying all proxy and dispatcher behaviors, edge cases, error conditions, non-null guarantees, option merging, and mock runtime pass-throughs.

**Acceptance criteria:**
- [x] Tests verify `proxy` as string, `URL`, object, and `false`.
- [x] Tests verify `null` rejection for `proxy` and `dispatcher`.
- [x] Tests verify inheritance and clearing via `undefined`.
- [x] Tests verify browser rejection when window is present.
- [x] Tests verify pass-through to custom `fetch`.
- [x] Tests verify conflicting `proxy` and `dispatcher` rejection.

**Verification:**
- [x] `npx ava test/proxy.ts` passes with 100% green tests.

**Dependencies:** Task 4
**Files likely touched:**
- `test/proxy.ts`
**Estimated scope:** Medium (1 file)

---

## Task 6: Update documentation in `readme.md`
**Description:** Update `readme.md` to document the new `proxy` option, clean up the `dispatcher` examples to remove `@ts-expect-error`, and document cross-runtime behavior.

**Acceptance criteria:**
- [x] `readme.md` includes documentation and examples for `proxy`.
- [x] `@ts-expect-error` comments removed from `dispatcher` examples.
- [x] Formatting and markdown linting clean.

**Verification:**
- [x] Full verification: `npm run build && tsc --project tsconfig.test.json && npx ava test/proxy.ts test/fetch.ts && npx xo`

**Dependencies:** Task 5
**Files likely touched:**
- `readme.md`
**Estimated scope:** Small (1 file)

---

## Checkpoint: Complete
- [x] Full test suite passes: `npm run build && tsc --project tsconfig.test.json && npx ava test/proxy.ts test/fetch.ts`
- [x] Lint passes with zero errors: `npx xo`
- [x] All success criteria met
