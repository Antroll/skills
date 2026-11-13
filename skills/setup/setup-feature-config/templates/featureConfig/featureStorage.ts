import {
  defaultFeatureConfig,
  featureKeys,
  type FeatureConfig,
  type FeatureConfigKey,
} from './defaultFeatureConfig';

const storageKey = (key: FeatureConfigKey) => `feature:${key}`;

// sessionStorage is missing outside the browser (SSR), and touching it throws
// when the browser blocks storage; both give the fallback.
function withStorage<T>(use: (storage: Storage) => T, fallback: T): T {
  try {
    if (typeof sessionStorage === 'undefined') return fallback;
    return use(sessionStorage);
  } catch {
    return fallback;
  }
}

function loadFlag(key: FeatureConfigKey): boolean {
  const fallback = defaultFeatureConfig[key];
  return withStorage(storage => {
    const stored = storage.getItem(storageKey(key));
    if (stored !== null) return stored === 'true';
    storage.setItem(storageKey(key), String(fallback));
    return fallback;
  }, fallback);
}

/** Reads every flag, storing the default of each flag not stored yet. */
export function loadFeatureConfig(): FeatureConfig {
  return Object.fromEntries(
    featureKeys.map(key => [key, loadFlag(key)]),
  ) as FeatureConfig;
}

export function setFeatureState(key: FeatureConfigKey, active: boolean) {
  withStorage(
    storage => storage.setItem(storageKey(key), String(active)),
    undefined,
  );
}
