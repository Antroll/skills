# Feature config

Boolean feature flags with defaults in code, overridable per tab where overrides are enabled (local development by default), plus **Mock API mode**: every request answers with a mock, so the app runs offline, without the API.

## Flags

- Defaults live in `defaultFeatureConfig.ts`. To add a flag, add a key to `defaultFeatureConfig` and its line to `featureDescriptions`; the flags panel and the storage overrides pick it up.
- Where overrides are enabled, each flag is stored in `sessionStorage` as `feature:<key>` (`"true"` / `"false"`). Change it in the flags panel or in DevTools, then reload: flags are read once at page load. A new tab starts from the defaults.
- Where overrides are disabled (production by default), `sessionStorage` is never read: the app uses the defaults, and every flag named `mock*` is forced off. Name a flag `mock*` only if it must never reach users.
- `env.ts` holds the one line that decides where overrides are enabled.

### Server rendering

- The server has no `sessionStorage`, so it renders every flag at its default. Server components never see an override.
- A client component that renders an overridden flag differs from the server HTML, so React warns about a hydration mismatch. That warning is expected while a flag is overridden.

## Mock API mode

Mock API mode covers wrapped functions only. Requests that bypass them (third-party SDKs, WebSockets) stay live.

Every request function gets a mock at the bottom of its own file, with the same arguments and the same response type. The call site picks one through `mockable`:

```ts
export async function fetchUsers(params: UsersParams) {
  // the real request
}

// call site
const users = await mockable(fetchUsers, mockFetchUsers)(params);

async function mockFetchUsers({ role }: UsersParams) {
  await mockWait();
  return { users: mockUsers.filter(u => u.role === role) };
}
```

- `mockable` returns the mock while `mockApi` is on. The type checker rejects a mock whose arguments or response differ from the real function's.
- Call `mockable` where the request runs (inside `queryFn`, the mutation function, the effect), not at module load, so it reads the flag the page loaded with.
- Every mock starts with `await mockWait()`: 300 ms by default, 3 s with `mockSlow`, and a thrown error with `mockFailing`, so loading and error states can be checked by hand.
- Mocks answer from shared fixtures and change nothing: a read after a write returns the same fixtures.
- **Fixtures hold invented data only**: fake names, `example.com` emails, no tokens, no real user data. Mocks and fixtures ship in the production bundle.

### Turning it on

Run the frontend alone (no API needed), open the flags panel, tick **Mock API**, reload. Without the panel: set `feature:mockApi` to `true` in `sessionStorage` and reload.

## Trade-offs

- Mocks and fixtures are in the production bundle, where `mockApi` is always off. Shipping them keeps every call site a plain `mockable(real, mock)`. If bundle size ever matters, load mocks with `import()` behind the flag instead.
- Mocks bypass what the real functions do with a response (error mapping, auth redirects), so Mock API mode does not exercise those paths.
