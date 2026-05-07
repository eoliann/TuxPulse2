# TuxPulse2 version sync fix

This patch makes `package.json` the single source of truth for the application version.

It adds:

- `scripts/sync-version.mjs`
- `src/version.ts`, generated automatically
- `package.json` scripts:
  - `version:sync`
  - `version:check`
  - `predev`
  - `prebuild`

It also removes the hardcoded `const APP_VERSION = 'v...'` from `src/App.tsx` and imports it from `src/version.ts`.

## Apply

From the TuxPulse2 repository root:

```bash
bash /path/to/apply-version-sync-fix.sh 6.0.6
```

Use `6.0.6` because the current UI/Tauri/Cargo version is already `6.0.6`, while `package.json` is behind.

## Future version change

Example for a new version:

```bash
npm version 6.0.7 --no-git-tag-version
npm run version:sync
npm run version:check
npm run tauri build
```

`npm run build` and `npm run dev` will also run synchronization automatically through `prebuild` and `predev`.
