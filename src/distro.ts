export type DistroFamily = 'debian' | 'arch' | 'fedora' | 'unknown';

export function distroFamily(name: string): DistroFamily {
  const distro = name.toLowerCase();
  if (['arch', 'manjaro', 'endeavour', 'cachyos'].some(id => distro.includes(id))) return 'arch';
  if (['ubuntu', 'debian', 'mint', 'pop'].some(id => distro.includes(id))) return 'debian';
  if (['fedora', 'redhat', 'red hat', 'centos'].some(id => distro.includes(id))) return 'fedora';
  return 'unknown';
}

export function packageListCommand(name: string): [string, string[]] | undefined {
  switch (distroFamily(name)) {
    case 'arch': return ['pacman', ['-Q']];
    case 'debian': return ['dpkg', ['-l']];
    case 'fedora': return ['rpm', ['-qa']];
    default: return name.toLowerCase().includes('suse') ? ['zypper', ['se', '--installed-only']] : undefined;
  }
}
