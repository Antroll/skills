# Existing flags

The project already has a feature-flag system. Offer the user these options, with their consequences, and carry out the one they choose in step 2.

## Separate

Both systems stay. The new module holds only its own flags (`isDevUiEnabled`, `mock*`); the old flags keep their system.

- Cheapest. Nothing existing changes.
- Two places to add a flag, and the old flags get no per-tab overrides or panel.

**Done when:** the module is installed and no old flag is touched.

## Overlay

The old flags become the defaults of new keys in `defaultFeatureConfig`, read from the old source. Consumers move to `featureConfig` over time.

- Old flags gain overrides and the panel without a big-bang migration.
- Until every consumer moves, a flag is read in two ways.

**Done when:** every old boolean flag has a key whose default reads the old source, and the user has the list of consumers still on the old system.

## Replace

The module takes over, and the old system is deleted. Work the whole checklist:

- Move every boolean flag with its default, env expressions included (`process.env.X === 'true'` stays an expression in `defaultFeatureConfig`).
- Leave non-boolean flags out: `FeatureConfig` is `Record<key, boolean>`. Give them a plain config module, and tell the user where they went.
- Move every consumer to `featureConfig.<key>`.
- Fix barrel re-exports (`index.ts` files) that re-export the old module.
- Fix mentions in docs and agent docs, nested `CLAUDE.md` / `AGENTS.md` included.
- Delete the old module.

**Done when:** a repo-wide grep for the old module's name and its exported names finds nothing, docs included, and the typecheck passes.
