// Translate UI requests into a closed vocabulary. The Rust backend independently
// validates every operation and determines whether authentication is required.
export function nativeOperation(command: string, args: string[]) {
  const exact: [string, string[], string][] = [
    ['uname', ['-a'], 'system.uname'], ['hostnamectl', [], 'system.host'],
    ['cat', ['/etc/os-release'], 'system.os'], ['lscpu', [], 'system.cpu'],
    ['lsusb', [], 'system.usb'], ['lspci', [], 'system.pci'], ['ps', ['aux'], 'system.processes'],
    ['df', ['-h'], 'system.disk'], ['ip', ['addr'], 'network.addresses'], ['ip', ['route'], 'network.routes'],
    ['nmcli', ['-t', '-f', 'UUID,TYPE,STATE', 'con', 'show', '--active'], 'network.connections'],
    ['nmcli', ['-t', '-f', 'GENERAL.DEVICE,IP4.DNS,IP6.DNS', 'device', 'show'], 'network.dns'],
    ['systemctl', ['list-units', '--type=service', '--all', '--no-pager'], 'services.list'],
    ['systemctl', ['list-unit-files', '--type=service', '--state=enabled'], 'services.startup'],
    ['journalctl', ['-n', '20', '--no-pager'], 'logs.recent'], ['journalctl', ['-p', '3', '-n', '50'], 'logs.errors'],
    ['journalctl', ['--vacuum-time=7d'], 'logs.clean'], ['netstat', ['-tuln'], 'audit.ports'],
    ['find', ['/etc', '-maxdepth', '2', '-perm', '-0002', '-type', 'f'], 'audit.files'],
    ['grep', ['PermitRootLogin', '/etc/ssh/sshd_config'], 'audit.ssh'],
    ['dpkg', ['-l'], 'apt.list'], ['pacman', ['-Q'], 'arch.list'], ['rpm', ['-qa'], 'rpm.list'],
    ['zypper', ['se', '--installed-only'], 'suse.list'], ['flatpak', ['list', '--columns=application'], 'flatpak.list'],
    ['apt-get', ['update'], 'apt.refresh'], ['apt-get', ['upgrade', '-y'], 'apt.upgrade'],
    ['apt-get', ['autoclean'], 'apt.clean'], ['pacman', ['-Sc', '--noconfirm'], 'arch.clean'],
    ['dnf', ['clean', 'all'], 'dnf.clean'], ['flatpak', ['update', '-y'], 'flatpak.update'],
  ];
  const match = exact.find(([cmd, parameters]) => cmd === command && JSON.stringify(parameters) === JSON.stringify(args));
  if (match) return { operation: match[2], parameters: [] };
  if (command === 'systemctl' && ['start', 'stop', 'restart', 'enable', 'disable'].includes(args[0]) && args.length === 2)
    return { operation: `service.${args[0]}`, parameters: [args[1]] };
  if (command === 'kill' && args[0] === '-9' && args.length === 2)
    return { operation: 'process.kill', parameters: [args[1]] };
  for (const [cmd, prefix, operation] of [
    ['apt-cache', ['show'], 'apt.info'], ['pacman', ['-Si'], 'arch.info'], ['dnf', ['info'], 'dnf.info'],
    ['apt-get', ['install', '-y'], 'apt.install'], ['pacman', ['-S', '--noconfirm'], 'arch.install'],
    ['dnf', ['install', '-y'], 'dnf.install'], ['apt-get', ['remove', '-y'], 'apt.remove'],
    ['pacman', ['-R', '--noconfirm'], 'arch.remove'], ['dnf', ['remove', '-y'], 'dnf.remove'],
    ['flatpak', ['install', '-y', 'flathub'], 'flatpak.install'], ['flatpak', ['uninstall', '-y'], 'flatpak.remove'],
  ] as [string, string[], string][]) {
    if (cmd === command && prefix.every((part, i) => args[i] === part) && args.length > prefix.length)
      return { operation, parameters: args.slice(prefix.length) };
  }
  throw new Error('This operation is unavailable. Use your distribution tools to review it safely.');
}
