import { useState, useSyncExternalStore, type CSSProperties } from 'react';
// Adapt this path to where the featureConfig module lives.
import {
  featureConfig,
  featureDescriptions,
  setFeatureState,
  type FeatureConfig,
  type FeatureConfigKey,
} from './featureConfig';

const noSubscription = () => () => {};

function camelCaseToTitle(value: string): string {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

const styles = {
  root: {
    position: 'fixed',
    left: 8,
    bottom: 8,
    zIndex: 2147483647,
    maxWidth: 'min(360px, calc(100vw - 16px))',
    font: '12px/1.4 system-ui, sans-serif',
    color: '#111',
  },
  toggle: {
    padding: '4px 8px',
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    font: 'inherit',
  },
  card: {
    marginBottom: 6,
    padding: 12,
    border: '1px solid #ccc',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 4px 16px rgb(0 0 0 / 0.15)',
  },
  note: { margin: '0 0 8px', color: '#555' },
  item: { display: 'flex', gap: 8, marginBottom: 8, cursor: 'pointer' },
  description: { display: 'block', color: '#666' },
} satisfies Record<string, CSSProperties>;

/**
 * A floating panel with one checkbox per feature flag. Changes are stored in
 * sessionStorage and apply after a reload; a new tab starts from the defaults.
 */
export function FeatureFlagsPanel() {
  // False on the server and during hydration, true after: with SSR, the
  // server has no sessionStorage, so the panel renders on the client only.
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<FeatureConfig>(featureConfig);
  if (!hydrated) return null;

  const keys = Object.keys(config) as FeatureConfigKey[];
  const isChanged = (key: FeatureConfigKey) =>
    config[key] !== featureConfig[key];

  return (
    <div style={styles.root}>
      {open && (
        <div style={styles.card}>
          <p style={styles.note}>
            Changes apply after a reload; a new tab resets to the defaults.
          </p>
          {keys.map(key => (
            <label key={key} style={styles.item}>
              <input
                type="checkbox"
                checked={config[key]}
                onChange={event => {
                  const { checked } = event.target;
                  setFeatureState(key, checked);
                  setConfig(current => ({ ...current, [key]: checked }));
                }}
              />
              <span>
                <strong>{camelCaseToTitle(key)}</strong>
                {isChanged(key) && ' 🔃'}
                <span style={styles.description}>
                  {featureDescriptions[key]}
                </span>
              </span>
            </label>
          ))}
          {keys.some(isChanged) && (
            <button
              type="button"
              style={styles.toggle}
              onClick={() => window.location.reload()}
            >
              🔃 Reload to apply
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        style={styles.toggle}
        onClick={() => setOpen(current => !current)}
      >
        🧪 Flags{featureConfig.mockApi && ' · ⚠️ Mock API is on'}
      </button>
    </div>
  );
}
