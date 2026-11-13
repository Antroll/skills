// Run with: node --test <path to this file>. Named .rule-test.mjs so vitest and Jest skip it.
import { describe, it } from 'node:test';
import { RuleTester } from 'eslint';

import { requireMockable } from './require-mockable.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

tester.run('require-mockable', requireMockable, {
  valid: [
    {
      name: 'a wrapped function passes',
      code: `
        async function fetchUsers() {}
        mockable(fetchUsers, mockFetchUsers);
      `,
    },
    {
      name: 'a file without request functions passes',
      code: `
        async function loadUsers() {}
        function mockFetchUsers() {}
      `,
    },
    {
      name: 'a custom pattern ignores names it does not match',
      code: 'async function fetchUsers() {}',
      options: [{ pattern: '^api[A-Z]' }],
    },
  ],
  invalid: [
    {
      name: 'an unwrapped function fails',
      code: 'async function fetchUsers() {}',
      errors: [{ messageId: 'unwrapped', data: { name: 'fetchUsers' } }],
    },
    {
      name: 'one wrapped and one unwrapped function fail on the unwrapped one',
      code: `
        async function fetchUsers() {}
        const sendCreateUser = async () => {};
        mockable(fetchUsers, mockFetchUsers);
      `,
      errors: [{ messageId: 'unwrapped', data: { name: 'sendCreateUser' } }],
    },
    {
      name: 'a custom pattern catches its own names',
      code: 'async function apiGetUsers() {}',
      options: [{ pattern: '^api[A-Z]' }],
      errors: [{ messageId: 'unwrapped', data: { name: 'apiGetUsers' } }],
    },
  ],
});
