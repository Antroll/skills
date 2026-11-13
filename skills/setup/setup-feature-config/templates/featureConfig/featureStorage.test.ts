import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFeatureConfig, featureKeys } from './defaultFeatureConfig';
import {
  getFeatureConfigFromSessionStorage,
  isFeatureActive,
  setFeatureState,
  writeFeatureConfigToSessionStorage,
} from './featureStorage';

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: key => items.get(key) ?? null,
    key: index => [...items.keys()][index] ?? null,
    removeItem: key => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
}

let storage: Storage;

beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal('sessionStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setFeatureState and isFeatureActive', () => {
  it('round-trips a flag through a feature:-prefixed key', () => {
    setFeatureState('mockApi', true);

    expect(storage.getItem('feature:mockApi')).toBe('true');
    expect(isFeatureActive('mockApi')).toBe(true);

    setFeatureState('mockApi', false);

    expect(storage.getItem('feature:mockApi')).toBe('false');
    expect(isFeatureActive('mockApi')).toBe(false);
  });
});

describe('writeFeatureConfigToSessionStorage', () => {
  it('writes the given values for missing keys', () => {
    writeFeatureConfigToSessionStorage({
      ...defaultFeatureConfig,
      mockApi: false,
      isDevUiEnabled: true,
    });

    expect(storage.getItem('feature:mockApi')).toBe('false');
    expect(storage.getItem('feature:isDevUiEnabled')).toBe('true');
  });

  it('never overwrites a stored value', () => {
    storage.setItem('feature:mockApi', 'true');
    storage.setItem('feature:isDevUiEnabled', 'false');

    writeFeatureConfigToSessionStorage({
      ...defaultFeatureConfig,
      mockApi: false,
      isDevUiEnabled: true,
    });

    expect(storage.getItem('feature:mockApi')).toBe('true');
    expect(storage.getItem('feature:isDevUiEnabled')).toBe('false');
  });
});

describe('getFeatureConfigFromSessionStorage', () => {
  it('reads every flag as a boolean from storage', () => {
    storage.setItem('feature:mockApi', 'true');
    storage.setItem('feature:isDevUiEnabled', 'false');

    expect(getFeatureConfigFromSessionStorage()).toEqual({
      ...defaultFeatureConfig,
      mockApi: true,
      isDevUiEnabled: false,
    });
  });

  it('falls back to the defaults for flags not stored yet', () => {
    expect(getFeatureConfigFromSessionStorage()).toEqual(defaultFeatureConfig);
  });
});

describe.each([
  ['missing', () => vi.stubGlobal('sessionStorage', undefined)],
  [
    'blocked',
    () =>
      Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        get: () => {
          throw new DOMException('Access denied', 'SecurityError');
        },
      }),
  ],
])('with sessionStorage %s', (_, makeUnavailable) => {
  beforeEach(() => {
    makeUnavailable();
  });

  afterEach(() => {
    // vi.unstubAllGlobals can't undo a property defined by hand.
    Reflect.deleteProperty(globalThis, 'sessionStorage');
  });

  it('reads every flag as false', () => {
    expect(isFeatureActive('isDevUiEnabled')).toBe(false);
    expect(getFeatureConfigFromSessionStorage()).toEqual(
      Object.fromEntries(featureKeys.map(key => [key, false])),
    );
  });

  it('ignores writes', () => {
    expect(() => setFeatureState('mockApi', true)).not.toThrow();
    expect(() =>
      writeFeatureConfigToSessionStorage(defaultFeatureConfig),
    ).not.toThrow();
  });
});
