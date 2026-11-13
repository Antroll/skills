---
name: setup-feature-config
description: Add dev-overridable feature flags and Mock API mode (offline mode with typed mocks) to a frontend app, with an optional flags panel and lint rule. User-invoked.
disable-model-invocation: true
---

# Setup Feature Config

Install a **feature config** module into a frontend app (React first, any bundler):

- **Flags**: booleans with defaults in code. Where overrides are enabled (local development by default), each flag is overridden per tab through `sessionStorage` (`feature:<key>`) and read once at page load. Where they are disabled (production by default), the app uses the defaults, with every `mock*` flag forced off.
- **Mock API mode**: with the `mockApi` flag on, every request wrapped in `mockable(real, mock)` answers with its mock, so the app runs offline. The type checker holds each mock to the real function's arguments and response. `mockWait()` opens every mock and obeys `mockSlow` / `mockFailing`.

The templates next to this file are the source: read them by their paths relative to this file. **Copy, then adapt**. Adapt only what the project forces (the `overridesEnabled` line, import paths, formatting, UI kit); the behaviour stays as written. [`templates/featureConfig/README.md`](templates/featureConfig/README.md) explains the module to the target project and doubles as your reference for how it works.

## Steps

### 1. Survey the project

Find out, by looking (`package.json`, config files, the source tree):

- **Build tool and dev check**: Vite → `import.meta.env.DEV`; Next.js, webpack and most others → `process.env.NODE_ENV !== 'production'`. Every `next build` is production, deploys to dev and stage included.
- **SSR**: Next.js, React Router framework mode, Remix, Astro and the like render on the server, where `sessionStorage` is missing. Note whether the root layout is a server component (Next.js App Router).
- **Module location**: where shared, cross-feature code lives (`src/lib/`, `src/shared/`, `app/modules/common/`, …) and the import alias, if any. Default: `src/featureConfig/`.
- **Test runner**: vitest, Jest, or none.
- **ESLint**: flat config (`eslint.config.*`) or none.
- **Requests**: where the app's request functions live (fetch wrappers, API client calls, `queryFn`s, server actions called from the client) and how they are named. Also any network traffic that bypasses them: third-party SDKs calling their own backends, WebSockets, other clients the app does not wrap.
- **Agent docs**: `CLAUDE.md`, `AGENTS.md`, or neither, and whether module rules live in nested `CLAUDE.md` / `AGENTS.md` files.
- **Specs**: where the repo keeps specs or plans, if anywhere.
- **Existing flags**: any feature-flag system already in place (a `featureFlags` file, LaunchDarkly, env-var toggles).

Then ask the user, in one message:

- which optional parts to install: the **flags panel** (step 5) and, only if the project uses ESLint flat config, the **lint rule** (step 6);
- whether overrides are needed on **deployed dev/stage**, not only on the local dev server;
- if existing flags were found, how the two systems relate: offer the options in [`EXISTING-FLAGS.md`](EXISTING-FLAGS.md).

**Done when:** every item above is known and the user has answered every question.

### 2. Install the module

Copy [`templates/featureConfig/`](templates/featureConfig/) into the chosen location as a `featureConfig/` folder, test files and `README.md` included. Then adapt:

- `env.ts`: set `overridesEnabled`, the only line tied to the build tool.
  - Local dev server only: the project's dev check from step 1.
  - Deployed dev/stage too: an allowlist of the project's deploy-environment variable, for example `<DEPLOY_ENV> === 'dev' || <DEPLOY_ENV> === 'stage'`. The variable must reach the client bundle (`NEXT_PUBLIC_*`, `VITE_*`). An allowlist keeps an unset variable on the safe side: no overrides, `mock*` forced off.
- Imports: match the project's style (alias, file extensions under `"moduleResolution": "nodenext"`).
- Formatting: run the project's formatter on the new files.
- Existing flags: carry out the option the user chose.

**Done when:** the project's typecheck passes with the module in place, and the chosen existing-flags option meets its own done-when.

### 3. Tests

Only where the project has a test runner:

- **vitest**: keep the `*.test.ts` files as they are.
- **Jest**: rewrite them to Jest (`vi.fn` → `jest.fn`, `vi.stubGlobal` → assigning `globalThis.sessionStorage`, `vi.resetModules` → `jest.resetModules`, `vi.doMock` with `importOriginal` → `jest.doMock` with `jest.requireActual`, fake timers via `jest.useFakeTimers` / `jest.advanceTimersByTimeAsync`).
- **No runner**: delete the `*.test.ts` files, install nothing, and tell the user the module has no tests.

**Done when:** the new tests pass, or the user has been told there are none.

### 4. Wrap one request

Pick one real request function the app calls on a page you can open, and convert it the way the module README shows:

- Add the mock at the bottom of the same file: unexported, named `mock<FunctionName>`, starting with `await mockWait()`, answering in the real response type from invented fixtures (fake names, `example.com` emails, no tokens).
- At the call site, call `mockable(realFn, mockFn)(...args)` where the request runs, not at module load.

Then list every other request to the user as remaining work, file by file, in two groups: **to wrap** (request functions, for `mockable`) and **stays live** (traffic that bypasses them, which Mock API mode does not cover). Converting them needs fixtures the user should shape, so the list is the deliverable for those.

**Done when:** one request is wrapped and typechecks, and the user has the grouped list of the rest.

### 5. Flags panel (if chosen)

Copy [`templates/devUi/FeatureFlagsPanel.tsx`](templates/devUi/FeatureFlagsPanel.tsx) next to the app's other dev or shared components; with none, into the module as `featureConfig/FeatureFlagsPanel/`. Point its import at the module. Restyle it with the project's UI kit when there is one; the inline styles are a fallback. Mount it once at the app root, lazily, so production never downloads it:

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

When the root is a server component (Next.js App Router `app/layout.tsx`), mount it through a client wrapper and render `<FeatureFlagsPanelLoader />` in the layout:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { featureConfig } from '@/featureConfig';

const FeatureFlagsPanel = dynamic(
  () => import('./FeatureFlagsPanel').then(m => m.FeatureFlagsPanel),
  { ssr: false },
);

export function FeatureFlagsPanelLoader() {
  return featureConfig.isDevUiEnabled ? <FeatureFlagsPanel /> : null;
}
```

**Done when:** the panel shows in dev, ticking a flag and reloading keeps it ticked, and in a production build `Reload to apply` (a string only the panel has) appears only in a separate chunk, never in a file the HTML loads directly.

### 6. Lint rule (if chosen)

Copy [`templates/eslint/`](templates/eslint/) to the project's scripts or lint-rules folder. Register `requireMockable` in `eslint.config.*` under a local plugin. Scope it with `files` to where request functions live, and set `pattern` to the project's naming of request functions if it differs from `^(fetch|send)[A-Z]`. Add `require-mockable.rule-test.mjs` to the project's test command (`node --test <path>`), or run it once by hand when there is no test command. Its name keeps vitest and Jest from collecting it.

Prove it bites: add an unwrapped request function to a covered file, run ESLint and see it fail with `unwrapped`, then remove it and see ESLint pass.

**Done when:** you have observed the fail and the pass.

### 7. Document

Keep the copied `featureConfig/README.md` for people, with paths and examples adjusted to this project. Put the module's rules for agents where this repo keeps module rules:

- **Nested agent docs**: a `CLAUDE.md` / `AGENTS.md` inside the module folder holding the rules, plus its entry in the repo's list of nested docs, if there is one.
- **Otherwise**: one pointer line in the root agent docs (`CLAUDE.md` if present, else `AGENTS.md`, creating `AGENTS.md` if neither exists), for example:

`Feature flags and Mock API mode: see [src/featureConfig/README.md](src/featureConfig/README.md). Wrap every new request function in mockable() with a mock.`

**Done when:** the README matches the project and the agent docs carry the rules the repo's way.

### 8. Verify end to end

Run the dev server and open the page that calls the wrapped request, driving it with a browser tool or the `run` skill when the session has one. Turn `mockApi` on (panel, or `sessionStorage.setItem('feature:mockApi', 'true')`), reload, and see the page show fixture data with the API unreachable or never called (network tab). Turn `mockSlow` and `mockFailing` on in turn and see the loading and error states.

With no way to drive a browser, give the user these steps and wait for their confirmation:

1. Run the dev server and open `<page>`.
2. In DevTools, run `sessionStorage.setItem('feature:mockApi', 'true')` and reload.
3. Confirm the page shows `<fixture data>` and the network tab has no request to the API.

**Done when:** mock data has been seen on the page, by you or confirmed by the user. Then summarise the run: what was installed, what was skipped and why, the grouped list of requests left to wrap, every answer from step 1, and every departure from the templates. Write the same summary to the repo's spec location when step 1 found one, so a later review has it. Leave the changes uncommitted for the user to review.
