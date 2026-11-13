---
name: setup-feature-config
description: Add dev-overridable feature flags and Mock API mode (offline mode with typed mocks) to a frontend app, with an optional flags panel and lint rule. User-invoked.
disable-model-invocation: true
---

# Setup Feature Config

Install a **feature config** module into a frontend app (React first, any bundler):

- **Flags**: booleans with defaults in code. In local development each flag is overridden per tab through `sessionStorage` (`feature:<key>`) and read once at page load. Production uses the defaults, with every `mock*` flag forced off.
- **Mock API mode**: with the `mockApi` flag on, every request wrapped in `mockable(real, mock)` answers with its mock, so the app runs offline. The type checker holds each mock to the real function's arguments and response. `mockWait()` opens every mock and obeys `mockSlow` / `mockFailing`.

The templates next to this file are the source: **copy, then adapt**. Adapt only what the project forces (the `isDev` line, import paths, formatting, UI kit); the behaviour stays as written. [`templates/featureConfig/README.md`](templates/featureConfig/README.md) explains the module to the target project and doubles as your reference for how it works.

## Steps

### 1. Survey the project

Find out, by looking (`package.json`, config files, the source tree):

- **Build tool and dev check**: Vite → `import.meta.env.DEV`; Next.js, webpack and most others → `process.env.NODE_ENV !== 'production'`.
- **SSR**: Next.js, React Router framework mode, Remix, Astro and the like render on the server, where `sessionStorage` is missing.
- **Module location**: where shared, cross-feature code lives (`src/lib/`, `src/shared/`, `app/modules/common/`, …) and the import alias, if any. Default: `src/featureConfig/`.
- **Test runner**: vitest, Jest, or none.
- **ESLint**: flat config (`eslint.config.*`) or none.
- **Requests**: where the app's request functions live (fetch wrappers, API client calls, `queryFn`s, server actions called from the client) and how they are named.
- **Agent docs**: `CLAUDE.md`, `AGENTS.md`, or neither.
- **Existing flags**: any feature-flag system already in place (a `featureFlags` file, LaunchDarkly, env-var toggles). If one exists, stop and ask the user how the two should relate before writing anything.

Then ask the user, in one message, which optional parts to install: the **flags panel** (step 5) and, only if the project uses ESLint flat config, the **lint rule** (step 6).

**Done when:** every item above is known and the user has answered about the optional parts.

### 2. Install the module

Copy [`templates/featureConfig/`](templates/featureConfig/) into the chosen location as a `featureConfig/` folder, test files and `README.md` included. Then adapt:

- `env.ts`: set `isDev` to the project's dev check from step 1. This is the only line tied to the build tool.
- Imports: match the project's style (alias, file extensions under `"moduleResolution": "nodenext"`).
- Formatting: run the project's formatter on the new files.

**Done when:** the project's typecheck passes with the module in place.

### 3. Tests

Only where the project has a test runner:

- **vitest**: keep the `*.test.ts` files as they are.
- **Jest**: rewrite them to Jest (`vi.fn` → `jest.fn`, `vi.stubGlobal` → assigning `globalThis.sessionStorage`, fake timers via `jest.useFakeTimers` / `jest.advanceTimersByTimeAsync`).
- **No runner**: delete the `*.test.ts` files, install nothing, and tell the user the module has no tests. The production guard still holds: it lives in `productionFeatureConfig`, not in a test.

**Done when:** the new tests pass, or the user has been told there are none.

### 4. Wrap one request

Pick one real request function the app calls on a page you can open, and convert it the way the module README shows:

- Add the mock at the bottom of the same file: unexported, named `mock<FunctionName>`, starting with `await mockWait()`, answering in the real response type from invented fixtures (fake names, `example.com` emails, no tokens).
- At the call site, call `mockable(realFn, mockFn)(...args)` where the request runs, not at module load.

Then list every other request function to the user as remaining work, file by file. Converting them needs fixtures the user should shape, so the list is the deliverable for those.

**Done when:** one request is wrapped and typechecks, and the user has the list of the rest.

### 5. Flags panel (if chosen)

Copy [`templates/devUi/FeatureFlagsPanel.tsx`](templates/devUi/FeatureFlagsPanel.tsx) next to the app's other dev or shared components and point its import at the module. Restyle it with the project's UI kit when there is one; the inline styles are a fallback. Mount it once at the app root, lazily, so production never downloads it:

```tsx
const FeatureFlagsPanel = lazy(() =>
  import('./FeatureFlagsPanel').then(m => ({ default: m.FeatureFlagsPanel })),
);

// in the root component
{featureConfig.isDevUiEnabled && (
  <Suspense>
    <FeatureFlagsPanel />
  </Suspense>
)}
```

The panel renders only after hydration, so it is safe under SSR as written.

**Done when:** the panel shows in dev, ticking a flag and reloading keeps it ticked, and a production build contains no panel code in its entry chunk.

### 6. Lint rule (if chosen)

Copy [`templates/eslint/`](templates/eslint/) to the project's scripts or lint-rules folder. Register `requireMockable` in `eslint.config.*` under a local plugin. Scope it with `files` to where request functions live, and set `pattern` to the project's naming of request functions if it differs from `^(fetch|send)[A-Z]`. Add `require-mockable.rule-test.mjs` to the project's test command (`node --test <path>`), or run it once by hand when there is no test command. Its name keeps vitest and Jest from collecting it.

Prove it bites: add an unwrapped request function to a covered file, run ESLint and see it fail with `unwrapped`, then remove it and see ESLint pass.

**Done when:** you have observed the fail and the pass.

### 7. Document

Keep the copied `featureConfig/README.md`, with paths and examples adjusted to this project. Add one pointer line to the agent docs (`CLAUDE.md` if present, else `AGENTS.md`, creating `AGENTS.md` if neither exists), for example:

`Feature flags and Mock API mode: see [src/featureConfig/README.md](src/featureConfig/README.md). Wrap every new request function in mockable() with a mock.`

**Done when:** the README matches the project and the agent docs link to it.

### 8. Verify end to end

Run the dev server and open the page that calls the wrapped request. Turn `mockApi` on (panel, or `sessionStorage.setItem('feature:mockApi', 'true')`), reload, and see the page show fixture data with the API unreachable or never called (network tab). Turn `mockSlow` and `mockFailing` on in turn and see the loading and error states.

When you cannot drive a browser, give the user these steps and wait for their confirmation:

1. Run the dev server and open `<page>`.
2. In DevTools, run `sessionStorage.setItem('feature:mockApi', 'true')` and reload.
3. Confirm the page shows `<fixture data>` and the network tab has no request to the API.

**Done when:** mock data has been seen on the page, by you or confirmed by the user. Then summarise what was installed, what was skipped and why, and the list of requests left to wrap. Leave the changes uncommitted for the user to review.
