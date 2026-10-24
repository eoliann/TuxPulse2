export const DNS_PROVIDERS = [
  { name: 'System Default', id: 'default', primary: '', secondary: '' },
  { name: 'Cloudflare', id: 'cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
  { name: 'Google', id: 'google', primary: '8.8.8.8', secondary: '8.8.4.4' },
  { name: 'OpenDNS', id: 'opendns', primary: '208.67.222.222', secondary: '208.67.220.220' },
  { name: 'Quad9', id: 'quad9', primary: '9.9.9.9', secondary: '149.112.112.112' },
  { name: 'AdGuard', id: 'adguard', primary: '94.140.14.14', secondary: '94.140.15.15' },
];

export function detectDNS(output: string): string {
  const servers = [...new Set(output.split('\n').filter(line => /^IP[46]\.DNS\[\d+\]:/.test(line))
    .map(line => line.slice(line.indexOf(':') + 1).trim()).filter(Boolean))].sort();
  return DNS_PROVIDERS.find(p => p.id !== 'default' &&
    JSON.stringify([p.primary, p.secondary].sort()) === JSON.stringify(servers))?.id ?? 'default';
}
