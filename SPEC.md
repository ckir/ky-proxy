# Spec: Proxy Support in Ky

## Objective
Provide first-class proxy configuration and typing in Ky across supported runtimes (Node.js, Bun, Deno, and Browsers).

Currently, developers using Ky in Node.js must use untyped `dispatcher` options with `@ts-expect-error` or rely on process-level environment variable flags (`NODE_USE_ENV_PROXY=1`). There is no standardized, cross-runtime `proxy` option in Ky's API.

This feature will:
1. Introduce a unified `proxy` option in Ky's options (`string | URL | ProxyOptions | false | undefined`).
2. Add first-class typing for `dispatcher` (`unknown | undefined`) to remove the need for `@ts-expect-error` in Node.js.
3. Automatically adapt proxy configuration to the underlying runtime environment:
   - **Bun:** Passed natively to `fetch()` via the `proxy` option.
   - **Node.js:** Dynamically resolved to an Undici `ProxyAgent` when a proxy URL or config is provided (falling back gracefully with an actionable error if `undici` is not available), or forwarded via `dispatcher`.
   - **Browser:** Throws a clear `TypeError` if a proxy option is passed, since the Fetch API in web browsers does not permit client-side proxy configuration.
4. Enforce project conventions: reject `null` values with an explicit `TypeError` (`The \`proxy\` option must not be \`null\`. Use \`undefined\` to clear it.`).
5. Support `ky.create()` and `ky.extend()` inheritance and clearing (using `undefined`).

## Tech Stack
- TypeScript (5.9+)
- Node.js (>=22, current test environment: Node 24.21.0)
- Ava test runner
- XO linter
- Zero runtime dependencies for core Ky

## Commands
- Build: `npm run build` (`del-cli distribution && tsc --project tsconfig.dist.json`)
- Test: `npm test` (`xo && npm run build && tsc --project tsconfig.test.json && ava`)
- Single test run: `npx ava test/proxy.ts`
- Lint: `npx xo`

## Project Structure
- `source/types/options.ts` — Definition of `ProxyOptions`, `proxy`, and `dispatcher` in `KyOptions` and `Options`
- `source/core/constants.ts` — Option registry updates (`kyOptionKeys`, `requestOptionsRegistry`)
- `source/core/Ky.ts` — Proxy normalization, runtime dispatching, error validation, and passing to `fetch`
- `source/utils/options.ts` — Validation and unknown options handling
- `test/proxy.ts` — Unit and integration tests for proxy configuration across scenarios
- `readme.md` — Updated documentation and examples without `@ts-expect-error`

## Code Style
Strict TypeScript with ESM modules. No `null` accepted for options; `undefined` represents absence.
```ts
// Example: Proxy configuration
import ky from 'ky';

// URL string
const api = ky.create({
	proxy: 'http://proxy.example.com:8080'
});

// Object format with custom proxy headers
const response = await ky('https://example.com', {
	proxy: {
		url: 'http://proxy.example.com:8080',
		headers: {
			'Proxy-Authorization': 'Bearer token123'
		}
	}
});

// Explicitly bypass proxy (e.g. In Bun or when env proxy is active)
const direct = await ky('https://example.com', {
	proxy: false
});
```

## Testing Strategy
- Unit tests in `test/proxy.ts`:
  - Validate option types: string, `URL`, `ProxyOptions` object, and `false`.
  - Reject `null` with explicit `TypeError`.
  - Validate option inheritance in `ky.create()` and `ky.extend()`.
  - Validate clearing proxy with `undefined`.
  - Verify pass-through of `proxy` to `fetch()` in environments supporting native `proxy` (simulated via custom `fetch`).
  - Verify resolution of `proxy` to `dispatcher` in Node.js when `undici` is available.
  - Verify meaningful error when `proxy` is supplied in browser environment.
  - Verify `dispatcher` typing and pass-through without `@ts-expect-error`.

## Boundaries
- **Always do:**
  - Reject `null` values on `proxy` and `dispatcher` with an explicit `TypeError`.
  - Run `npm run build` and `npx xo` before finalizing.
  - Ensure zero mandatory runtime dependencies in `package.json`.
- **Ask first:**
  - Adding new npm runtime dependencies to `package.json`.
  - Changing existing behavior of `dispatcher` or unknown options.
- **Never do:**
  - Accept `null` as absent or fallback to default on `null`.
  - Break browser compatibility.
  - Silently swallow proxy resolution failures.

## Success Criteria
1. `proxy` option is fully typed and exported in `Options` and `KyOptions`.
2. `dispatcher` option is typed on `Options` and `KyOptions`.
3. In Node.js, `proxy` strings or `URL`s seamlessly work with Node's fetch mechanism (via `ProxyAgent` or `dispatcher`).
4. In Bun or environments with native `proxy` support, `proxy` is passed directly in the fetch init object.
5. In browser environments, passing `proxy` throws a clear, descriptive `TypeError`.
6. Passing `null` to `proxy` or `dispatcher` throws a descriptive `TypeError`.
7. `readme.md` is updated with clean, error-free examples.
8. All new and existing unit tests pass, and linter checks pass with 0 errors.

## Open Questions
1. **Node.js Proxy Implementation:** In Node.js, `fetch` does not natively support `{ proxy }`; it uses Undici's `dispatcher`. Should Ky attempt to dynamically import `undici` to instantiate `ProxyAgent` automatically when `proxy` is specified, or should we recommend/support both `proxy` (auto-detect) and explicit `dispatcher`?
2. **Proxy Authentication:** Should `proxy` support username/password in the URL (e.g. `http://user:pass@host:port`), or also a dedicated `auth` field in `ProxyOptions`? (Note: URLs with embedded credentials work in both Undici and Bun).
3. **Browser Behavior:** When running in a browser, should passing a `proxy` option throw a `TypeError`, or log a warning and ignore it? (Recommended: throw a `TypeError` to catch configuration bugs early).
