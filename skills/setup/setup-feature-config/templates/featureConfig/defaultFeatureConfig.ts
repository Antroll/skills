import { isDev } from './env';

/**
 * Every feature flag and its default. To add a flag, add it here: the
 * sessionStorage overrides and the dev panel pick it up from this object.
 * Flags named `mock*` are dev-only: production builds force them off.
 */
export const defaultFeatureConfig = {
  /** If enabled, the feature flags panel is shown. */
  isDevUiEnabled: isDev,
  /**
   * If enabled, every request wrapped in `mockable` answers with its mock,
   * so the app runs without the API.
   */
  mockApi: false,
  /** With Mock API mode: every mock takes 3 s to answer. */
  mockSlow: false,
  /** With Mock API mode: every mock fails. */
  mockFailing: false,
};

export type FeatureConfigKey = keyof typeof defaultFeatureConfig;

export type FeatureConfig = Record<FeatureConfigKey, boolean>;

export const featureKeys = Object.keys(
  defaultFeatureConfig,
) as FeatureConfigKey[];
