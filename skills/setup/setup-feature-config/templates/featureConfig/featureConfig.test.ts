import { describe, expect, it } from 'vitest';
import { defaultFeatureConfig, featureKeys } from './defaultFeatureConfig';
import { productionFeatureConfig } from './featureConfig';

describe('productionFeatureConfig', () => {
  it('forces every mock* flag off, even when its default is on', () => {
    const allOn = Object.fromEntries(
      featureKeys.map(key => [key, true]),
    ) as typeof defaultFeatureConfig;

    const config = productionFeatureConfig(allOn);

    for (const key of featureKeys) {
      expect(config[key]).toBe(!key.startsWith('mock'));
    }
  });

  it('keeps the defaults of the other flags', () => {
    const config = productionFeatureConfig({
      ...defaultFeatureConfig,
      isDevUiEnabled: true,
    });

    expect(config.isDevUiEnabled).toBe(true);
  });
});
