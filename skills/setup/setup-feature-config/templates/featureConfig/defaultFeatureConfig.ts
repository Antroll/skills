import { overridesEnabled } from './env';

// Every feature flag and its default. To add a flag, add it here and in
// featureDescriptions. Flags named `mock*` are forced off
// wherever overrides are disabled.
export const defaultFeatureConfig = {
  isDevUiEnabled: overridesEnabled,
  mockApi: false,
  mockSlow: false,
  mockFailing: false,
};

export type FeatureConfigKey = keyof typeof defaultFeatureConfig;

export type FeatureConfig = Record<FeatureConfigKey, boolean>;

export const featureKeys = Object.keys(
  defaultFeatureConfig,
) as FeatureConfigKey[];

export const featureDescriptions: Record<FeatureConfigKey, string> = {
  isDevUiEnabled:
    'Shows the feature flags panel. Works only where overrides are enabled.',
  mockApi:
    'Every request wrapped in mockable answers with its mock, so the app runs without the API.',
  mockSlow: 'With Mock API mode: every mock takes 3 seconds to answer.',
  mockFailing: 'With Mock API mode: every mock fails.',
};
