import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

// featureConfig is read once at module load, so each test loads it afresh,
// with the defaults of that same load to compare against.
async function loadModule() {
  vi.resetModules();
  const { defaultFeatureConfig, featureKeys } = await import(
    './defaultFeatureConfig'
  );
  return { ...(await import('./index')), defaultFeatureConfig, featureKeys };
}

function enableOverrides(enabled: boolean) {
  vi.doMock('./env', () => ({ overridesEnabled: enabled }));
}

let storage: Storage;

beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal('sessionStorage', storage);
  enableOverrides(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock('./env');
  vi.doUnmock('./defaultFeatureConfig');
});

describe('with overrides enabled', () => {
  it('reads every stored flag', async () => {
    storage.setItem('feature:mockApi', 'true');
    storage.setItem('feature:isDevUiEnabled', 'false');

    const { featureConfig, defaultFeatureConfig } = await loadModule();

    expect(featureConfig).toEqual({
      ...defaultFeatureConfig,
      mockApi: true,
      isDevUiEnabled: false,
    });
  });

  it('uses and stores the default of a flag not stored yet', async () => {
    const { featureConfig, defaultFeatureConfig } = await loadModule();

    expect(featureConfig).toEqual(defaultFeatureConfig);
    expect(storage.getItem('feature:mockApi')).toBe('false');
  });

  it('keeps a flag set with setFeatureState for the next load', async () => {
    const { setFeatureState } = await loadModule();

    setFeatureState('mockApi', true);

    expect(storage.getItem('feature:mockApi')).toBe('true');
    expect((await loadModule()).featureConfig.mockApi).toBe(true);
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

  it('uses the defaults, as the server render does', async () => {
    const { featureConfig, defaultFeatureConfig } = await loadModule();

    expect(featureConfig).toEqual(defaultFeatureConfig);
  });

  it('ignores writes', async () => {
    const { setFeatureState } = await loadModule();

    expect(() => setFeatureState('mockApi', true)).not.toThrow();
  });
});

describe('without overrides', () => {
  beforeEach(() => {
    enableOverrides(false);
  });

  it('ignores stored flags', async () => {
    storage.setItem('feature:mockApi', 'true');

    const { featureConfig } = await loadModule();

    expect(featureConfig.mockApi).toBe(false);
  });

  it('forces every mock* flag off, even when its default is on', async () => {
    vi.doMock('./defaultFeatureConfig', async importOriginal => {
      const actual =
        await importOriginal<typeof import('./defaultFeatureConfig')>();
      return {
        ...actual,
        defaultFeatureConfig: Object.fromEntries(
          actual.featureKeys.map(key => [key, true]),
        ),
      };
    });

    const { featureConfig, featureKeys } = await loadModule();

    for (const key of featureKeys) {
      expect(featureConfig[key]).toBe(!key.startsWith('mock'));
    }
  });
});
