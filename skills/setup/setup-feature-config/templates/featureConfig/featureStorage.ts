import {
  defaultFeatureConfig,
  featureKeys,
  type FeatureConfig,
  type FeatureConfigKey,
} from './defaultFeatureConfig';

const storageKey = (key: FeatureConfigKey) => `feature:${key}`;

// sessionStorage is missing outside the browser, and reading it throws when
// the browser blocks storage; both count as "nothing stored".
function readItem(key: FeatureConfigKey): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(storageKey(key));
  } catch {
    return null;
  }
}

function writeItem(key: FeatureConfigKey, value: string) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(storageKey(key), value);
  } catch {
    // Storage is unavailable or full; the flag keeps its current value.
  }
}

/** Seeds missing flags with their defaults, then reads every flag. */
export function getFeatureConfigFromSessionStorage(): FeatureConfig {
  writeFeatureConfigToSessionStorage(defaultFeatureConfig);
  return Object.fromEntries(
    featureKeys.map(key => [key, isFeatureActive(key)]),
  ) as FeatureConfig;
}

/** Stores the given value of every flag that has none stored yet. */
export function writeFeatureConfigToSessionStorage(config: FeatureConfig) {
  for (const key of featureKeys) {
    if (readItem(key) === null) setFeatureState(key, config[key]);
  }
}

export function isFeatureActive(key: FeatureConfigKey): boolean {
  return readItem(key) === 'true';
}

export function setFeatureState(key: FeatureConfigKey, active: boolean) {
  writeItem(key, String(active));
}
