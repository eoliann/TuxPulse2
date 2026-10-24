import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDNS, DNS_PROVIDERS } from './dns';
import { nativeOperation } from './nativeOperations';

test('detects every provider regardless of order and duplicate device entries', () => {
  for (const p of DNS_PROVIDERS.filter(p => p.id !== 'default')) {
    assert.equal(detectDNS(`GENERAL.DEVICE:enp1s0\nIP4.DNS[1]:${p.secondary}\nIP4.DNS[2]:${p.primary}\nIP4.DNS[1]:${p.primary}\n`), p.id);
  }
});
test('uses default for unknown, empty, partial, mixed or additional resolvers', () => {
  for (const output of ['', 'IP4.DNS[1]:127.0.0.53', 'IP4.DNS[1]:1.1.1.1',
    'IP4.DNS[1]:1.1.1.1\nIP4.DNS[2]:8.8.8.8',
    'IP4.DNS[1]:1.1.1.1\nIP4.DNS[2]:1.0.0.1\nIP6.DNS[1]:fe80::1']) assert.equal(detectDNS(output), 'default');
});
test('UI maps supported operations and rejects legacy shell requests', () => {
  assert.deepEqual(nativeOperation('apt-get', ['install', '-y', 'firefox']), { operation: 'apt.install', parameters: ['firefox'] });
  assert.deepEqual(nativeOperation('uname', ['-a']), { operation: 'system.uname', parameters: [] });
  for (const cmd of ['sh', 'bash', 'pkexec', 'rm']) assert.throws(() => nativeOperation(cmd, ['-c', 'id']));
});
