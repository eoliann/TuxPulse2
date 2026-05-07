#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_ARG="${1:-}"

if [[ ! -f "$ROOT_DIR/package.json" || ! -d "$ROOT_DIR/src-tauri" || ! -f "$ROOT_DIR/src/App.tsx" ]]; then
  echo "Run this script from the TuxPulse2 repository root." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/scripts" "$ROOT_DIR/src"
cp "$SCRIPT_DIR/scripts/sync-version.mjs" "$ROOT_DIR/scripts/sync-version.mjs"
chmod +x "$ROOT_DIR/scripts/sync-version.mjs"

node --input-type=module <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';

const packageJsonPath = 'package.json';
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const scripts = packageJson.scripts ?? {};

packageJson.scripts = {
  ...scripts,
  'version:sync': 'node scripts/sync-version.mjs',
  'version:check': 'node scripts/sync-version.mjs --check',
  predev: 'npm run version:sync',
  prebuild: 'npm run version:sync',
};

await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
NODE

if [[ -n "$VERSION_ARG" ]]; then
  node --input-type=module - "$VERSION_ARG" <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';

const nextVersion = process.argv[2];
const semverRe = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!semverRe.test(nextVersion)) {
  console.error(`Invalid version: ${nextVersion}`);
  process.exit(1);
}

const files = ['package.json', 'package-lock.json'];
for (const file of files) {
  try {
    const json = JSON.parse(await readFile(file, 'utf8'));
    json.version = nextVersion;
    if (json.packages?.['']) {
      json.packages[''].version = nextVersion;
    }
    await writeFile(file, `${JSON.stringify(json, null, 2)}\n`);
  } catch (error) {
    if (file !== 'package-lock.json') throw error;
  }
}
NODE
fi

node --input-type=module <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';

const appPath = 'src/App.tsx';
let app = await readFile(appPath, 'utf8');

if (!app.includes("from './version'")) {
  const importAnchor = "import { APPS_CATALOG } from './constants/apps';";
  if (app.includes(importAnchor)) {
    app = app.replace(importAnchor, `${importAnchor}\nimport { APP_VERSION } from './version';`);
  } else {
    app = `import { APP_VERSION } from './version';\n${app}`;
  }
}

app = app.replace(/\n\s*const APP_VERSION\s*=\s*['\"]v[^'\"]+['\"];\n/, '\n');

await writeFile(appPath, app);
NODE

npm run version:sync
npm run version:check

echo "Version sync fix applied."
