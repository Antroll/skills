import {
  defaultFeatureConfig,
  featureKeys,
  type FeatureConfig,
} from './defaultFeatureConfig';
import { overridesEnabled } from './env';
import { loadFeatureConfig } from './featureStorage';

// Every `mock*` flag is forced off, so a default left on by mistake never
// ships mocks to users.
function defaultsWithMocksOff(): FeatureConfig {
  return Object.fromEntries(
    featureKeys.map(key => [
      key,
      key.startsWith('mock') ? false : defaultFeatureConfig[key],
    ]),
  ) as FeatureConfig;
}

// Read once at module load: a change takes effect after a reload.
export const featureConfig: FeatureConfig = overridesEnabled
  ? loadFeatureConfig()
  : defaultsWithMocksOff();
