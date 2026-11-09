import assert from 'node:assert/strict';
import { test } from 'node:test';
import { distroFamily, packageListCommand } from './distro';
import { nativeOperation } from './nativeOperations';

test('uses pacman for the CachyOS and other Arch distribution names', () => {
  for (const name of ['CachyOS', 'CachyOS Linux', 'Arch Linux', 'Manjaro Linux', 'EndeavourOS']) {
    assert.equal(distroFamily(name), 'arch');
    const command = packageListCommand(name);
    assert.deepEqual(command, ['pacman', ['-Q']]);
    assert.ok(command);
    assert.deepEqual(nativeOperation(...command), { operation: 'arch.list', parameters: [] });
  }
});

test('uses the appropriate package reader and leaves unknown systems alone', () => {
  assert.deepEqual(packageListCommand('Linux Mint'), ['dpkg', ['-l']]);
  assert.deepEqual(packageListCommand('Fedora Linux'), ['rpm', ['-qa']]);
  assert.deepEqual(packageListCommand('openSUSE Tumbleweed'), ['zypper', ['se', '--installed-only']]);
  assert.equal(packageListCommand('Unknown Linux'), undefined);
});
