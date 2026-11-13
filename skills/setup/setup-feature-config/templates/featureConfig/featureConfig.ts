import {
  defaultFeatureConfig,
  featureKeys,
  type FeatureConfig,
} from './defaultFeatureConfig';
import { isDev } from './env';
import { getFeatureConfigFromSessionStorage } from './featureStorage';

/**
 * The production config: the defaults, with every dev-only `mock*` flag
 * forced off, so a default left on by mistake never ships mocks to users.
 */
export function productionFeatureConfig(
  defaults: FeatureConfig = defaultFeatureConfig,
): FeatureConfig {
  return Object.fromEntries(
    featureKeys.map(key => [key, key.startsWith('mock') ? false : defaults[key]]),
  ) as FeatureConfig;
}

/**
 * In local dev, flags are read from sessionStorage; in production, the
 * production config is used. Read once at module load: a change takes effect
 * after a reload.
 */
export const featureConfig: FeatureConfig = isDev
  ? getFeatureConfigFromSessionStorage()
  : productionFeatureConfig();
