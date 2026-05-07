#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.argv[2] || process.cwd();
const appPath = path.join(rootDir, 'src', 'App.tsx');

if (!fs.existsSync(appPath)) {
  console.error(`ERROR: Nu gasesc fisierul: ${appPath}`);
  process.exit(1);
}

let source = fs.readFileSync(appPath, 'utf8');
const original = source;
const changes = [];
const warnings = [];

function replaceOnce(label, pattern, replacement) {
  const before = source;
  source = source.replace(pattern, replacement);
  if (source !== before) {
    changes.push(label);
  } else {
    warnings.push(`Nu am gasit modelul pentru: ${label}`);
  }
}

function ensureFlatpakMaintenance(label, anchorCommand) {
  const alreadyHasRepairNearAnchor = new RegExp(
    `${anchorCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,250}'flatpak repair'[\\s\\S]{0,250}'flatpak uninstall --unused -y'`
  ).test(source);

  if (alreadyHasRepairNearAnchor) {
    changes.push(`${label}: deja actualizat`);
    return;
  }

  const pattern = new RegExp(
    `('${anchorCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\s*)'flatpak update -y'`
  );

  const before = source;
  source = source.replace(pattern, `$1'flatpak repair',\n        'flatpak update -y',\n        'flatpak uninstall --unused -y'`);

  if (source !== before) {
    changes.push(label);
  } else {
    warnings.push(`Nu am gasit secventa Full Maintenance pentru: ${label}`);
  }
}

ensureFlatpakMaintenance('Full Maintenance Debian/Ubuntu/Mint: Flatpak repair/update/uninstall unused', 'apt-get autoclean');
ensureFlatpakMaintenance('Full Maintenance Arch/Manjaro: Flatpak repair/update/uninstall unused', 'pacman -Sc --noconfirm');
ensureFlatpakMaintenance('Full Maintenance Fedora/RedHat: Flatpak repair/update/uninstall unused', 'dnf clean all');

// In Full Maintenance, comenzile sunt trimise catre backend cu sudo/pkexec. Nu se pune literal "sudo" in string,
// ca sa evitam prompturi duble sau eroare fara TTY in interiorul pkexec bash -c.
if (!source.includes('Full maintenance runs through pkexec')) {
  source = source.replace(
    /setMaintenanceOutput\(\(prev: string\) => prev \+ `\\n> Running maintenance sequence\.\.\.\\n`\);\s*const needsSudo = cmds\.some\(c => !c\.startsWith\('flatpak'\)\);/,
    "setMaintenanceOutput((prev: string) => prev + `\\n> Running maintenance sequence...\\n`);\n      // Full maintenance runs through pkexec, so do not prefix commands with sudo here.\n      const needsSudo = cmds.some(c => !c.startsWith('flatpak'));"
  );
}

replaceOnce(
  'Sidebar logo: inlocuieste T cu icon Activity/Pulse',
  /<div className="w-8 h-8 bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xl">\s*T\s*<\/div>/,
  `<div className="w-8 h-8 bg-blue-600 flex-shrink-0 flex items-center justify-center text-white">\n          <Activity className="w-5 h-5 animate-pulse" />\n        </div>`
);

// Elimina cerculetul/butonul TX din dreapta headerului principal.
const txButtonPattern = /\n\s*<button\s+onClick=\{\(\) => addAlert\('info', 'Manual system scan initiated'\)\}\s+className=\{cn\([\s\S]{0,2000}?\)\}\s*>\s*TX\s*<\/button>/m;
const beforeTx = source;
source = source.replace(txButtonPattern, '');
if (source !== beforeTx) {
  changes.push('Header principal: elimina butonul/cerculetul TX din dreapta');
} else if (!source.includes('>TX</button>') && !source.includes('\n            TX\n')) {
  changes.push('Header principal: TX pare deja eliminat');
} else {
  warnings.push('Nu am putut elimina automat butonul TX. Cauta manual textul TX din header si sterge button-ul parinte.');
}

if (source === original) {
  console.error('Nu s-a modificat nimic in src/App.tsx. Posibil ca patch-ul sa fie deja aplicat sau structura fisierului sa fie diferita.');
  if (warnings.length) console.error(warnings.join('\n'));
  process.exit(1);
}

const backupPath = `${appPath}.bak-maintenance-header-fix`;
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, original);
}
fs.writeFileSync(appPath, source);

console.log('Patch aplicat pe src/App.tsx.');
console.log('\nModificari:');
for (const change of changes) console.log(`- ${change}`);
if (warnings.length) {
  console.log('\nAtentionari:');
  for (const warning of warnings) console.log(`- ${warning}`);
}
console.log(`\nBackup initial: ${backupPath}`);
