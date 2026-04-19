import React, { useState, useEffect, ChangeEvent } from 'react';
import { APPS_CATALOG } from './constants/apps';
// @ts-ignore
import { invoke } from '@tauri-apps/api/core';
import { 
  Activity, 
  Shield, 
  Bell, 
  Settings, 
  Cpu, 
  Database, 
  HardDrive, 
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Menu,
  LayoutDashboard,
  Trash2,
  RefreshCw,
  Network,
  List,
  Server,
  Search,
  Zap,
  Thermometer,
  Battery,
  ChevronRight,
  Play,
  Square,
  RotateCcw,
  Eye,
  Wrench,
  Package,
  Download,
  Layers,
  User,
  Clock,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { cn } from './lib/utils';

// Mock Data Generator
const generateData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    cpu: Math.floor(Math.random() * 40) + 10,
    ram: Math.floor(Math.random() * 30) + 40,
    disk: 65,
    netIn: Math.floor(Math.random() * 500),
    netOut: Math.floor(Math.random() * 200),
  }));
};

const MOCK_PROCESSES = [
  { pid: 1234, name: 'gnome-shell', cpu: 4.5, mem: 12.1, user: 'user' },
  { pid: 5678, name: 'firefox', cpu: 12.2, mem: 25.4, user: 'user' },
  { pid: 9012, name: 'code', cpu: 8.1, mem: 15.2, user: 'user' },
  { pid: 3456, name: 'docker', cpu: 1.2, mem: 5.4, user: 'root' },
  { pid: 7890, name: 'python3', cpu: 25.4, mem: 8.1, user: 'user' },
  { pid: 1122, name: 'systemd', cpu: 0.1, mem: 0.5, user: 'root' },
  { pid: 3344, name: 'nginx', cpu: 0.5, mem: 1.2, user: 'www-data' },
];

const MOCK_SERVICES = [
  { name: 'tuxpulse-helper', status: 'running', desc: 'Secure Helper Daemon' },
  { name: 'docker', status: 'running', desc: 'Docker Container Engine' },
  { name: 'nginx', status: 'running', desc: 'High performance web server' },
  { name: 'ssh', status: 'running', desc: 'OpenBSD Secure Shell server' },
  { name: 'postgresql', status: 'stopped', desc: 'Object-relational SQL database' },
  { name: 'redis', status: 'running', desc: 'Advanced key-value store' },
  { name: 'cron', status: 'running', desc: 'Regular background program processing daemon' },
];

const MOCK_DISKS = [
  { device: '/dev/sda1', mount: '/', size: '500G', used: '120G', free: '380G', type: 'ext4', usage: 24 },
  { device: '/dev/sdb1', mount: '/home', size: '1TB', used: '450G', free: '550G', type: 'xfs', usage: 45 },
  { device: '/dev/nvme0n1p1', mount: '/boot/efi', size: '512M', used: '32M', free: '480M', type: 'vfat', usage: 6 },
];

const MOCK_PACKAGES = [
  { name: 'python3', version: '3.12.3', status: 'installed', size: '12MB' },
  { name: 'gcc', version: '13.2.0', status: 'installed', size: '45MB' },
  { name: 'git', version: '2.43.0', status: 'installed', size: '18MB' },
  { name: 'curl', version: '8.5.0', status: 'installed', size: '2MB' },
  { name: 'vim', version: '9.1.0', status: 'installed', size: '32MB' },
];

const MOCK_STARTUP = [
  { name: 'bluetooth.service', status: 'enabled', type: 'system' },
  { name: 'network-manager.service', status: 'enabled', type: 'system' },
  { name: 'tuxpulse-helper.service', status: 'enabled', type: 'system' },
  { name: 'docker.service', status: 'enabled', type: 'system' },
  { name: 'cups.service', status: 'enabled', type: 'system' },
];

// Real Data Fetching Helpers
const parseProcesses = (output: string) => {
  const lines = output.split('\n').slice(1);
  return lines.map(line => {
    const parts = line.split(/\s+/);
    if (parts.length < 11) return null;
    return {
      pid: parseInt(parts[1]),
      user: parts[0],
      cpu: parseFloat(parts[2]),
      mem: parseFloat(parts[3]),
      name: parts.slice(10).join(' '),
    };
  }).filter(Boolean);
};

const parseServices = (output: string) => {
  const lines = output.split('\n').slice(1);
  return lines.map(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) return null;
    return {
      name: parts[0],
      status: parts[3] === 'running' ? 'running' : 'stopped',
      desc: parts.slice(4).join(' ') || 'System Service',
    };
  }).filter(Boolean);
};

const parseDisks = (output: string) => {
  const lines = output.split('\n').slice(1);
  return lines.map(line => {
    const parts = line.split(/\s+/);
    if (parts.length < 6) return null;
    return {
      device: parts[0],
      size: parts[1],
      used: parts[2],
      free: parts[3],
      usage: parseInt(parts[4].replace('%', '')),
      mount: parts[5],
      type: 'ext4', // Default for display
    };
  }).filter(Boolean);
};

export default function App() {
  const APP_VERSION = 'v6.0.5';
  const [data, setData] = useState(generateData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [latestVersion, setLatestVersion] = useState('v6.0');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [distroType, setDistroType] = useState<'debian' | 'arch' | 'fedora' | 'unknown'>('unknown');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedDNS, setSelectedDNS] = useState<string>('default');
  const [isDNSSetting, setIsDNSSetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isNative, setIsNative] = useState(false);
  
  // Real System State
  const [processes, setProcesses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [disks, setDisks] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [flatpaks, setFlatpaks] = useState<string[]>([]);
  const [availablePackages, setAvailablePackages] = useState<Set<string>>(new Set());
  const [startup, setStartup] = useState<any[]>([]);
  const [hardwareInfo, setHardwareInfo] = useState<any>({ cpu: '', usb: '', pci: '' });
  const [networkInfo, setNetworkInfo] = useState<any>({ interfaces: '', routes: '' });
  const [kernelInfo, setKernelInfo] = useState<any>({
    release: 'Detecting...',
    version: 'Detecting...',
    arch: 'Detecting...',
    hostname: 'Detecting...',
    uptime: 'Detecting...',
    load: [0.0, 0.0, 0.0],
    distro: 'Detecting...'
  });
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [maintenanceOutput, setMaintenanceOutput] = useState('');
  const [maintenanceProgress, setMaintenanceProgress] = useState(0);
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);
  const [cleanerOutput, setCleanerOutput] = useState('');
  const [isCleanerRunning, setIsCleanerRunning] = useState(false);
  const [diskInfo, setDiskInfo] = useState({ total: '0 GB', used: '0 GB' });
  const [securityScanResults, setSecurityScanResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [oldKernels, setOldKernels] = useState<any[]>([]);
  const [isKernelUpdating, setIsKernelUpdating] = useState(false);
  const [cleanerOptions, setCleanerOptions] = useState({
    tempFiles: true,
    trash: true,
    userCache: true,
    journal: true,
    orphans: true,
    thumbnails: true
  });
  const [alertThresholds, setAlertThresholds] = useState({
    cpu: 80,
    ram: 90,
    disk: 95,
    logins: 5,
    network: 10
  });

  const DNS_PROVIDERS = [
    { name: 'System Default', id: 'default', primary: '', secondary: '' },
    { name: 'Cloudflare', id: 'cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
    { name: 'Google', id: 'google', primary: '8.8.8.8', secondary: '8.8.4.4' },
    { name: 'OpenDNS', id: 'opendns', primary: '208.67.222.222', secondary: '208.67.220.220' },
    { name: 'Quad9', id: 'quad9', primary: '9.9.9.9', secondary: '149.112.112.112' },
    { name: 'AdGuard', id: 'adguard', primary: '94.140.14.14', secondary: '94.140.15.15' },
  ];

  const setSystemDNS = async (providerId: string) => {
    const provider = DNS_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    setIsDNSSetting(true);
    setSelectedDNS(providerId);
    setMaintenanceOutput(prev => prev + `\nChanging DNS to ${provider.name}...\n`);
    addAlert('info', `Configuring DNS: ${provider.name}`);

    if (isNative) {
      try {
        const connRes = await runCommand('nmcli', ['-t', '-f', 'NAME,TYPE,STATE', 'con', 'show', '--active']);
        const activeConnections = connRes.output.split('\n')
          .filter((line: string) => line.trim() !== '' && (line.includes('ethernet') || line.includes('wireless')))
          .map((line: string) => line.split(':')[0]);

        if (activeConnections.length === 0) {
          setMaintenanceOutput(prev => prev + "Error: No active network connections found to configure.\n");
        } else {
          for (const conn of activeConnections) {
            setMaintenanceOutput(prev => prev + `Configuring connection: ${conn}...\n`);
            if (providerId === 'default') {
              await runCommand('nmcli', ['con', 'mod', conn, 'ipv4.dns', '', 'ipv4.ignore-auto-dns', 'no'], true);
            } else {
              const dnsStr = `${provider.primary} ${provider.secondary}`;
              await runCommand('nmcli', ['con', 'mod', conn, 'ipv4.dns', dnsStr, 'ipv4.ignore-auto-dns', 'yes'], true);
            }
            await runCommand('nmcli', ['con', 'up', conn], true);
          }
          const successMsg = providerId === 'default' 
            ? "DNS reset to system defaults across active connections.\n"
            : `DNS successfully updated to ${provider.name} (${provider.primary} ${provider.secondary})\n`;
          setMaintenanceOutput(prev => prev + successMsg);
        }
      } catch (err) {
        setMaintenanceOutput(prev => prev + `Error setting DNS: ${err}\n`);
        addAlert('error', 'DNS configuration failed');
      }
    } else {
      addAlert('warning', `Simulated DNS change to ${provider.name}`);
      setMaintenanceOutput(prev => prev + `Simulation: DNS changed to ${provider.name}\n`);
    }

    setIsDNSSetting(false);
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    addAlert('info', 'Starting security audit...');
    
    const results = [];
    
    // Check for open ports (simulated/basic)
    const netstat = await runCommand('netstat', ['-tuln']);
    if (netstat.success) {
      const openPorts = netstat.output.split('\n').filter((l: string) => l.includes('LISTEN')).length;
      results.push({
        title: 'Open Network Ports',
        status: openPorts > 10 ? 'warning' : 'optimal',
        desc: `Found ${openPorts} listening ports on the system.`
      });
    }

    // Check for world-writable files in /etc (simulated/basic)
    const findW = await runCommand('find', ['/etc', '-maxdepth', '2', '-perm', '-0002', '-type', 'f']);
    if (findW.success) {
      const count = findW.output.split('\n').filter(Boolean).length;
      results.push({
        title: 'World-Writable Configs',
        status: count > 0 ? 'critical' : 'optimal',
        desc: count > 0 ? `Found ${count} world-writable files in /etc!` : 'No world-writable files found in /etc.'
      });
    }

    // Check for root login in sshd_config
    const sshCheck = await runCommand('grep', ['PermitRootLogin', '/etc/ssh/sshd_config']);
    if (sshCheck.success) {
      const isRootAllowed = sshCheck.output.toLowerCase().includes('yes');
      results.push({
        title: 'SSH Root Login',
        status: isRootAllowed ? 'warning' : 'optimal',
        desc: isRootAllowed ? 'Root login is enabled in SSH configuration.' : 'Root login is disabled or restricted.'
      });
    }

    setSecurityScanResults(results);
    setIsScanning(false);
    addAlert('success', 'Security audit complete');
  };

  useEffect(() => {
    // @ts-ignore
    if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
      setIsNative(true);
    }
  }, []);

  // Auto-close alerts
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        setAlerts((prev: any[]) => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  const isNewerVersion = (latest: string, current: string) => {
    const l = latest.replace(/^v/, '').split('.').map(Number);
    const c = current.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(l.length, c.length); i++) {
      const v1 = l[i] || 0;
      const v2 = c[i] || 0;
      if (v1 > v2) return true;
      if (v1 < v2) return false;
    }
    return false;
  };

  // Version check
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/eoliann/TuxPulse2/releases/latest');
        const data = await response.json();
        if (data.tag_name) {
          setLatestVersion(data.tag_name);
          if (isNewerVersion(data.tag_name, APP_VERSION)) {
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        console.error('Failed to check version:', err);
      }
    };
    checkVersion();
  }, []);

  // Calculate catalog stats
  const catalogStats = React.useMemo(() => {
    let total = 0;
    let installed = 0;
    Object.values(APPS_CATALOG).forEach((categoryApps: any[]) => {
      categoryApps.forEach((app: any) => {
        total++;
        let nativePkg = app.packages.apt;
        if (distroType === 'arch') nativePkg = app.packages.pacman;
        else if (distroType === 'fedora') nativePkg = app.packages.dnf;
        
        const isNativeInstalled = nativePkg && packages.some((p: any) => p.name === nativePkg);
        const isFlatpakInstalled = app.flatpak && flatpaks.includes(app.flatpak);
        if (isNativeInstalled || isFlatpakInstalled) installed++;
      });
    });
    return { total, installed };
  }, [packages, flatpaks, distroType]);

  // Check package availability when entering installer tab
  useEffect(() => {
    if (activeTab === 'installer' && isNative) {
      const distro = kernelInfo.distro.toLowerCase();
      const pkgsToCheck = Object.values(APPS_CATALOG).flat().map((app: any) => {
        if (distro.includes('arch') || distro.includes('manjaro')) return app.packages.pacman;
        if (distro.includes('fedora') || distro.includes('redhat')) return app.packages.dnf;
        return app.packages.apt;
      }).filter((p: string) => p && !availablePackages.has(p));

      if (pkgsToCheck.length > 0) {
        // Check in batches of 50 to avoid command line length limits
        for (let i = 0; i < pkgsToCheck.length; i += 50) {
          const batch = pkgsToCheck.slice(i, i + 50);
          let cmd = '';
          let args: string[] = [];
          if (distro.includes('ubuntu') || distro.includes('debian') || distro.includes('mint')) {
            cmd = 'apt-cache';
            args = ['show', ...batch]; 
          } else if (distro.includes('arch') || distro.includes('manjaro')) {
            cmd = 'pacman';
            args = ['-Si', ...batch]; 
          } else if (distro.includes('fedora') || distro.includes('redhat')) {
            cmd = 'dnf';
            args = ['info', ...batch];
          }

          if (cmd) {
            runCommand(cmd, args).then(res => {
              // Process output even if success is false (some packages might be missing)
              // We check both stdout and stderr because some PMs report info to stderr for missing pkgs
              const combinedOutput = (res.output || "") + (res.error || "");
              if (combinedOutput) {
                const found = new Set<string>();
                batch.forEach((p: string) => {
                  const outputLower = combinedOutput.toLowerCase();
                  const pLower = p.toLowerCase();
                  // More robust check for package presence in info/show output
                  if (outputLower.includes(`package: ${pLower}`) || 
                      outputLower.includes(`name : ${pLower}`) ||
                      outputLower.includes(`name: ${pLower}`) ||
                      (distro.includes('arch') && outputLower.includes(`repository     : `) && outputLower.includes(pLower))) {
                    found.add(p);
                  }
                });
                setAvailablePackages((prev: Set<string>) => new Set([...prev, ...found]));
              }
            });
          }
        }
      }
    }
  }, [activeTab, isNative, kernelInfo.distro]);

  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  const runMaintenance = async (cmd: string) => {
    setIsMaintenanceRunning(true);
    setMaintenanceOutput(`Starting: ${cmd}\n`);
    const distro = kernelInfo.distro.toLowerCase();
    
    if (cmd === 'full') {
      let cmds: string[] = [];
      if (distro.includes('ubuntu') || distro.includes('debian') || distro.includes('mint')) {
        cmds = [
          'apt-get update',
          'apt-get full-upgrade -y',
          'apt-get autoremove -y',
          'apt-get autoclean',
          'flatpak update -y'
        ];
      } else if (distro.includes('arch') || distro.includes('manjaro')) {
        cmds = [
          'pacman -Sy',
          'pacman -Syu --noconfirm',
          'pacman -Sc --noconfirm',
          'flatpak update -y'
        ];
      } else if (distro.includes('fedora') || distro.includes('redhat')) {
        cmds = [
          'dnf upgrade -y',
          'dnf autoremove -y',
          'dnf clean all',
          'flatpak update -y'
        ];
      } else {
        cmds = [cmd]; // Fallback
      }

      setMaintenanceOutput((prev: string) => prev + `\n> Running maintenance sequence...\n`);
      const needsSudo = cmds.some(c => !c.startsWith('flatpak'));
      
      if (isNative) {
        try {
          const results: any[] = await invoke('execute_multiple_commands', { commands: cmds, sudo: needsSudo });
          for (const res of results) {
            setMaintenanceOutput((prev: string) => prev + res.output + (res.error || ''));
          }
        } catch (err) {
          addAlert('error', `Maintenance failed: ${err}`);
        }
      } else {
        addAlert('warning', "Simulation mode: Maintenance sequence simulated.");
      }
    } else {
      const parts = cmd.split(' ');
      const needsSudo = !cmd.startsWith('flatpak');
      const res = await runCommand(parts[0], parts.slice(1), needsSudo);
      setMaintenanceOutput((prev: string) => prev + res.output + (res.error || ''));
    }
    
    setIsMaintenanceRunning(false);
    addAlert('info', 'Maintenance task completed');
  };

  const fixSpotifyGPG = async () => {
    setIsMaintenanceRunning(true);
    setMaintenanceOutput("Fixing Spotify GPG Key...\n");
    const res = await runCommand('sh', ['-c', 'curl -sS https://download.spotify.com/debian/pubkey_5384CE82BA52C83A.gpg | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/spotify.gpg'], true);
    setMaintenanceOutput((prev: string) => prev + res.output + (res.error || ''));
    setIsMaintenanceRunning(false);
    addAlert('success', 'Spotify GPG fix attempted');
  };

  const runCleaner = async () => {
    setIsCleanerRunning(true);
    setCleanerOutput("Starting system cleanup...\n");
    addAlert('info', 'Starting system cleanup...');
    
    const distro = kernelInfo.distro.toLowerCase();
    const tasks = [
      { name: 'Trash', cmd: 'rm', args: ['-rf', '~/.local/share/Trash/*'], sudo: false },
      { name: 'Temp Files', cmd: 'rm', args: ['-rf', '/tmp/*'], sudo: true },
      { name: 'Journal Logs', cmd: 'journalctl', args: ['--vacuum-time=7d'], sudo: true },
    ];

    if (distro.includes('ubuntu') || distro.includes('debian') || distro.includes('mint')) {
      tasks.push({ name: 'Apt Cache', cmd: 'apt-get', args: ['autoclean'], sudo: true });
      tasks.push({ name: 'Orphaned Packages', cmd: 'apt-get', args: ['autoremove', '-y'], sudo: true });
    } else if (distro.includes('arch') || distro.includes('manjaro')) {
      tasks.push({ name: 'Pacman Cache', cmd: 'pacman', args: ['-Sc', '--noconfirm'], sudo: true });
    } else if (distro.includes('fedora') || distro.includes('redhat')) {
      tasks.push({ name: 'DNF Cache', cmd: 'dnf', args: ['clean', 'all'], sudo: true });
    }

    for (const task of tasks) {
      setCleanerOutput((prev: string) => prev + `\n[${task.name}] Running: ${task.cmd} ${task.args.join(' ')}\n`);
      const res = await runCommand(task.cmd, task.args, task.sudo);
      setCleanerOutput((prev: string) => prev + (res.output || 'Success\n') + (res.error || ''));
    }

    setIsCleanerRunning(false);
    addAlert('success', 'Cleanup completed successfully');
  };

  const toggleStartup = async (name: string, enabled: boolean) => {
    const action = enabled ? 'disable' : 'enable';
    const res = await runCommand('systemctl', [action, name], true);
    if (res.success) {
      addAlert('success', `Service ${name} ${action}d`);
      // Refresh startup list
      const updated = await runCommand('systemctl', ['list-unit-files', '--type=service', '--state=enabled']);
      if (updated.success) {
        const lines = updated.output.split('\n').slice(1);
        const parsed = lines.map((line: string) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 2) return null;
          return { name: parts[0], status: parts[1], type: 'system' };
        }).filter(Boolean);
        setStartup(parsed as any);
      }
    }
  };

  const runCommand = async (command: string, args: string[] = [], sudo: boolean = false) => {
    if (!isNative) {
      addAlert('warning', `Simulating command: ${command} ${args.join(' ')}`);
      return { success: true, output: "Simulation mode: No native backend detected." };
    }
    try {
      const result: any = await invoke('execute_system_command', { command, args, sudo });
      if (!result.success) {
        addAlert('error', `Command failed: ${result.error}`);
      }
      return result;
    } catch (err) {
      addAlert('error', `System error: ${err}`);
      return { success: false, error: String(err) };
    }
  };

  // Data Fetching Logic
  useEffect(() => {
    if (!isNative) return;

    const fetchData = async () => {
      // Always fetch kernel/distro info if not available
      if (!kernelInfo.distro || kernelInfo.distro === 'Detecting...') {
        const uname = await runCommand('uname', ['-a']);
        const host = await runCommand('hostnamectl');
        const osRelease = await runCommand('cat', ['/etc/os-release']);
        
        let distroName = 'Unknown Linux';
        
        if (host.success) {
          const distroMatch = host.output.match(/Operating System: (.*)/);
          if (distroMatch) distroName = distroMatch[1];
        } else if (osRelease.success) {
          const nameMatch = osRelease.output.match(/^PRETTY_NAME="(.*)"/m) || osRelease.output.match(/^NAME="(.*)"/m);
          if (nameMatch) distroName = nameMatch[1];
        }

        if (uname.success) {
          const parts = uname.output.split(' ');
          setKernelInfo((prev: any) => ({
            ...prev,
            distro: distroName,
            release: parts[2],
            version: parts.slice(3, 6).join(' '),
            arch: parts[parts.length - 2],
            hostname: parts[1]
          }));
        } else {
          setKernelInfo((prev: any) => ({ ...prev, distro: distroName }));
        }

        const dl = distroName.toLowerCase();
        if (dl.includes('ubuntu') || dl.includes('debian') || dl.includes('mint') || dl.includes('pop')) setDistroType('debian');
        else if (dl.includes('arch') || dl.includes('manjaro') || dl.includes('endeavour')) setDistroType('arch');
        else if (dl.includes('fedora') || dl.includes('redhat') || dl.includes('centos')) setDistroType('fedora');
      }

      if (activeTab === 'processes') {
        const res = await runCommand('ps', ['aux']);
        if (res.success) setProcesses(parseProcesses(res.output));
      } else if (activeTab === 'services') {
        const res = await runCommand('systemctl', ['list-units', '--type=service', '--all', '--no-pager']);
        if (res.success) setServices(parseServices(res.output));
      } else if (activeTab === 'disk') {
        const res = await runCommand('df', ['-h']);
        if (res.success) setDisks(parseDisks(res.output));
      } else if (activeTab === 'kernel') {
        const uname = await runCommand('uname', ['-a']);
        const host = await runCommand('hostnamectl');
        if (uname.success) {
          const parts = uname.output.split(' ');
          setKernelInfo((prev: any) => ({
            ...prev,
            release: parts[2],
            version: parts.slice(3, 6).join(' '),
            arch: parts[parts.length - 2],
            hostname: parts[1]
          }));
        }
        if (host.success) {
          const distroMatch = host.output.match(/Operating System: (.*)/);
          if (distroMatch) {
            setKernelInfo((prev: any) => ({ ...prev, distro: distroMatch[1] }));
          }
        }

        // Fetch old kernels
        const distro = kernelInfo.distro.toLowerCase();
        if (distro.includes('ubuntu') || distro.includes('debian') || distro.includes('mint')) {
          const res = await runCommand('dpkg', ['--list', 'linux-image-*']);
          if (res.success) {
            const current = kernelInfo.release;
            const lines = res.output.split('\n').slice(5);
            const kernels = lines.map((line: string) => {
              const parts = line.trim().split(/\s+/);
              if (parts.length < 3) return null;
              const name = parts[1];
              const version = parts[2];
              // Extract version from name if possible, or use version field
              const kernelVersion = name.replace('linux-image-', '');
              if (kernelVersion === current || !name.startsWith('linux-image-')) return null;
              return { name, version, release: kernelVersion, status: parts[0] };
            }).filter(Boolean);
            setOldKernels(kernels as any[]);
          }
        } else if (distro.includes('arch')) {
          const res = await runCommand('pacman', ['-Q', 'linux']);
          // Arch usually only keeps current kernel unless multiple are installed (linux-lts, etc)
          if (res.success) {
            setOldKernels([]); // Arch handles this differently
          }
        }
      } else if (activeTab === 'hardware') {
        const cpu = await runCommand('lscpu');
        const usb = await runCommand('lsusb');
        const pci = await runCommand('lspci');
        setHardwareInfo({
          cpu: cpu.success ? cpu.output : 'N/A',
          usb: usb.success ? usb.output : 'N/A',
          pci: pci.success ? pci.output : 'N/A'
        });
      } else if (activeTab === 'network') {
        const addr = await runCommand('ip', ['addr']);
        const route = await runCommand('ip', ['route']);
        setNetworkInfo({
          interfaces: addr.success ? addr.output : 'N/A',
          routes: route.success ? route.output : 'N/A'
        });
      } else if (activeTab === 'packages' || activeTab === 'installer') {
        let cmd = 'dpkg';
        let args = ['-l'];
        const distro = kernelInfo.distro.toLowerCase();
        
        if (distro.includes('arch') || distro.includes('manjaro')) {
          cmd = 'pacman';
          args = ['-Q'];
        } else if (distro.includes('fedora') || distro.includes('redhat')) {
          cmd = 'rpm';
          args = ['-qa'];
        } else if (distro.includes('suse')) {
          cmd = 'zypper';
          args = ['se', '--installed-only'];
        }

        const res = await runCommand(cmd, args);
        if (res.success) {
          let parsed: any[] = [];
          if (cmd === 'dpkg') {
            const lines = res.output.split('\n').slice(5);
            parsed = lines.map((line: string) => {
              const parts = line.trim().split(/\s+/);
              if (parts.length < 3) return null;
              return { name: parts[1], version: parts[2], status: parts[0] === 'ii' ? 'installed' : 'other' };
            }).filter(Boolean);
          } else if (cmd === 'pacman') {
            parsed = res.output.split('\n').filter(Boolean).map((line: string) => {
              const parts = line.split(' ');
              return { name: parts[0], version: parts[1], status: 'installed' };
            });
          } else if (cmd === 'rpm') {
            parsed = res.output.split('\n').filter(Boolean).map((line: string) => {
              return { name: line, version: 'N/A', status: 'installed' };
            });
          }
          setPackages(parsed.slice(0, 1000)); // Increased limit
        }

        // Fetch Flatpaks
        const flatpakRes = await runCommand('flatpak', ['list', '--columns=application']);
        if (flatpakRes.success) {
          setFlatpaks(flatpakRes.output.split('\n').filter(Boolean).map((line: string) => line.trim()));
        }
      } else if (activeTab === 'startup') {
        const systemServices = await runCommand('systemctl', ['list-unit-files', '--type=service', '--state=enabled']);
        // Use sh -c to expand ~ and handle potential missing directories gracefully
        const userAutostart = await runCommand('sh', ['-c', 'ls ~/.config/autostart /etc/xdg/autostart 2>/dev/null']);
        
        let allStartup: any[] = [];
        
        if (systemServices.success) {
          const lines = systemServices.output.split('\n').slice(1);
          allStartup = lines.map((line: string) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 2) return null;
            return { name: parts[0], status: parts[1], type: 'system' };
          }).filter(Boolean);
        }
        
        if (userAutostart.success) {
          const files = userAutostart.output.split('\n').filter((f: string) => f.endsWith('.desktop'));
          const userApps = files.map((f: string) => ({ name: f, status: 'enabled', type: 'user' }));
          allStartup = [...allStartup, ...userApps];
        }
        
        setStartup(allStartup);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [isNative, activeTab, refreshCounter]);

  // Dashboard Real-time Stats
  useEffect(() => {
    if (!isNative) return;

    const interval = setInterval(async () => {
      try {
        const stats: any = await invoke('get_detailed_stats');
        setData((prev: any[]) => {
          const lastTime = prev.length > 0 ? prev[prev.length - 1].time : 0;
          const newData = [...prev.slice(1), {
            time: lastTime + 1,
            cpu: stats.cpu,
            ram: stats.ram,
            disk: stats.disk || 0,
            netIn: Math.floor(Math.random() * 100), // Mock net for now as it's complex to parse in Rust quickly
            netOut: Math.floor(Math.random() * 50),
          }];
          return newData;
        });
        setDiskInfo({
          total: stats.disk_total || '0 GB',
          used: stats.disk_used || '0 GB'
        });
        setBatteryLevel(stats.battery);
        setKernelInfo((prev: any) => ({
          ...prev,
          uptime: stats.uptime,
          load: stats.load
        }));
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isNative]);

  // Fetch logs periodically
  useEffect(() => {
    const fetchLogs = async () => {
      if (isNative) {
        const res = await runCommand('journalctl', ['-n', '20', '--no-pager']);
        if (res.success) setSystemLogs(res.output.split('\n').filter(Boolean));
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [isNative]);

  const addAlert = (type: 'info' | 'warning' | 'error' | 'success', message: string) => {
    const id = Date.now();
    setAlerts((prev: any[]) => [{ id, type, message, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const updateKernel = async () => {
    setIsKernelUpdating(true);
    addAlert('info', 'Checking for kernel updates...');
    const distro = kernelInfo.distro.toLowerCase();
    let cmd = '';
    let args: string[] = [];

    if (distro.includes('ubuntu') || distro.includes('debian') || distro.includes('mint')) {
      cmd = 'apt-get';
      args = ['install', '--only-upgrade', 'linux-image-generic', '-y'];
    } else if (distro.includes('arch')) {
      cmd = 'pacman';
      args = ['-S', 'linux', '--noconfirm'];
    } else if (distro.includes('fedora')) {
      cmd = 'dnf';
      args = ['upgrade', 'kernel', '-y'];
    }

    if (cmd) {
      const res = await runCommand(cmd, args, true);
      if (res.success) {
        addAlert('success', 'Kernel update completed. Please reboot.');
      }
    }
    setIsKernelUpdating(false);
  };

  const removeKernel = async (name: string) => {
    addAlert('info', `Removing kernel ${name}...`);
    const distro = kernelInfo.distro.toLowerCase();
    let res;
    if (distro.includes('ubuntu') || distro.includes('debian') || distro.includes('mint')) {
      res = await runCommand('apt-get', ['purge', '-y', name], true);
    } else if (distro.includes('arch')) {
      res = await runCommand('pacman', ['-Rs', '--noconfirm', name], true);
    }

    if (res?.success) {
      addAlert('success', `Kernel ${name} removed`);
      setOldKernels(prev => prev.filter(k => k.name !== name));
    }
  };

  const toggleTheme = () => setTheme((prev: string) => prev === 'light' ? 'dark' : 'light');

  const openExternal = async (url: string) => {
    if (isNative) {
      try {
        await invoke('open_url', { url });
      } catch (err) {
        addAlert('error', `Failed to open link: ${err}`);
        // Fallback to window.open if invoke fails
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans selection:bg-blue-500 selection:text-white",
      theme === 'light' ? "bg-[#E4E3E0] text-[#141414]" : "bg-[#0A0A0A] text-[#E4E3E0]"
    )}>
      {/* Update Banner */}
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white py-2 px-4 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Zap size={14} className="animate-pulse" />
            Update Available: {latestVersion} is now out!
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => openExternal('https://github.com/eoliann/TuxPulse2/releases')}
              className="text-[10px] font-bold uppercase border border-white/30 px-3 py-1 hover:bg-white hover:text-blue-600 transition-all"
            >
              View Release
            </button>
            <button onClick={() => setUpdateAvailable(false)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full transition-all duration-300 z-50 border-r flex flex-col",
        theme === 'light' ? "bg-[#141414] text-[#E4E3E0] border-transparent" : "bg-[#141414] text-[#E4E3E0] border-[#E4E3E0]/10",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex-shrink-0 flex items-center gap-3 border-b border-[#E4E3E0]/10">
          <div className="w-8 h-8 bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xl">T</div>
          {isSidebarOpen && (
            <div className="truncate">
              <h1 className="text-lg font-bold tracking-tighter uppercase truncate">TuxPulse</h1>
              <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest leading-tight truncate">Linux maintenance toolkit</p>
              <p className="text-[10px] opacity-60 font-bold tracking-widest mt-1">{APP_VERSION}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-4 flex-shrink-0 border-b border-[#E4E3E0]/10">
          <p className="text-[10px] uppercase opacity-40 font-bold tracking-widest px-2">Distribution</p>
          <div className="flex items-center gap-2 px-2 mt-1">
            <p className="text-xs font-bold truncate">{kernelInfo.distro}</p>
            {distroType !== 'unknown' && isSidebarOpen && (
              <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded uppercase font-bold flex-shrink-0">
                {distroType}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-grow overflow-y-auto px-2 py-4 space-y-1 custom-scrollbar">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Wrench />} label="Maintenance" active={activeTab === 'maintenance'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('maintenance')} />
          <NavItem icon={<HardDrive />} label="Disk" active={activeTab === 'disk'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('disk')} />
          <NavItem icon={<Activity />} label="Kernel" active={activeTab === 'kernel'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('kernel')} />
          <NavItem icon={<Trash2 />} label="Cleaner" active={activeTab === 'cleaner'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('cleaner')} />
          <NavItem icon={<Clock />} label="Startup" active={activeTab === 'startup'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('startup')} />
          <NavItem icon={<Server />} label="Services" active={activeTab === 'services'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('services')} />
          <NavItem icon={<Package />} label="Packages" active={activeTab === 'packages'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('packages')} />
          <NavItem icon={<Download />} label="Installer" active={activeTab === 'installer'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('installer')} />
          <NavItem icon={<Info />} label="About" active={activeTab === 'about'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('about')} />
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-[#E4E3E0]/10 bg-[#141414]">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={cn(
              "w-full py-3 font-bold uppercase tracking-widest text-[10px] transition-all mb-4",
              theme === 'light' ? "bg-[#E4E3E0] text-[#141414]" : "bg-[#E4E3E0] text-[#141414]"
            )}
          >
            {isSidebarOpen ? (theme === 'light' ? 'Dark mode' : 'Light mode') : (theme === 'light' ? 'D' : 'L')}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-[#E4E3E0]/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          {isSidebarOpen && (
            <p className="text-[8px] text-center opacity-20 font-mono mt-2 uppercase tracking-tighter">TuxPulse {APP_VERSION}</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Header */}
        <header className={cn(
          "sticky top-0 backdrop-blur-md border-b z-40 px-8 py-4 flex justify-between items-center",
          theme === 'light' ? "bg-[#E4E3E0]/80 border-[#141414]" : "bg-[#0A0A0A]/80 border-[#E4E3E0]/10"
        )}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">{activeTab}</h1>
            <div className={cn(
              "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 mt-1",
              isNative ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
            )}>
              <div className={cn("w-1 h-1 rounded-full", isNative ? "bg-green-500" : "bg-orange-500")} />
              {isNative ? "Native Mode (Rust)" : "Simulated Mode"}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isNative && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-bold uppercase rounded-full">
                <Shield size={10} /> Native Mode (Rust)
              </div>
            )}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input 
                type="text" 
                placeholder="Search system..." 
                className={cn(
                  "pl-10 pr-4 py-2 border bg-transparent text-sm focus:outline-none focus:ring-1",
                  theme === 'light' ? "border-[#141414] focus:ring-[#141414]" : "border-[#E4E3E0]/20 focus:ring-[#E4E3E0]"
                )}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2 border transition-all",
                theme === 'light' ? "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" : "border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414]"
              )}
            >
              {theme === 'light' ? <Eye className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => addAlert('info', 'Manual system scan initiated')}
              className={cn(
                "p-2 border transition-all",
                theme === 'light' ? "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" : "border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414]"
              )}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className={cn(
              "w-10 h-10 rounded-full border flex items-center justify-center font-bold",
              theme === 'light' ? "border-[#141414]" : "border-[#E4E3E0]/20"
            )}>
              TX
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* System Info Box */}
              <div className={cn(
                "border p-6",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <InfoItem label="Kernel" value={kernelInfo.release} />
                  <InfoItem label="Arch" value={kernelInfo.arch} />
                  <InfoItem label="Hostname" value={kernelInfo.hostname} />
                  <InfoItem label="Uptime" value={kernelInfo.uptime} />
                  <InfoItem label="Load" value={kernelInfo.load.join(', ')} />
                  <InfoItem label="Distro" value={kernelInfo.distro} />
                </div>
              </div>

                  {/* Stats Grid - 6 Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ChartContainer title={`CPU Usage (${data[data.length-1]?.cpu || 0}%)`} theme={theme}>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#14141420" : "#E4E3E010"} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #E4E3E020' }}
                            itemStyle={{ color: '#2563eb' }}
                          />
                          <Area type="monotone" dataKey="cpu" stroke="#2563eb" fillOpacity={0.1} fill="#2563eb" strokeWidth={2} name="CPU %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <ChartContainer title={`RAM Usage (${data[data.length-1]?.ram || 0}%)`} theme={theme}>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#14141420" : "#E4E3E010"} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #E4E3E020' }}
                            itemStyle={{ color: '#16a34a' }}
                          />
                          <Area type="monotone" dataKey="ram" stroke="#16a34a" fillOpacity={0.1} fill="#16a34a" strokeWidth={2} name="RAM %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <ChartContainer title={`GPU Usage (${data[data.length-1]?.cpu || 0}%)`} theme={theme}>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#14141420" : "#E4E3E010"} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #E4E3E020' }}
                            itemStyle={{ color: '#ea580c' }}
                          />
                          <Area type="monotone" dataKey="cpu" stroke="#ea580c" fillOpacity={0.1} fill="#ea580c" strokeWidth={2} name="GPU %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <ChartContainer title={`Disk Usage (${data[data.length-1]?.disk || 0}%) | ${diskInfo.used} / ${diskInfo.total}`} theme={theme}>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#14141420" : "#E4E3E010"} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #E4E3E020' }}
                            itemStyle={{ color: '#8b5cf6' }}
                          />
                          <Area type="monotone" dataKey="disk" stroke="#8b5cf6" fillOpacity={0.1} fill="#8b5cf6" strokeWidth={2} name="Disk %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <ChartContainer title={`Network (${data[data.length-1]?.netIn || 0} KB/s)`} theme={theme}>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#14141420" : "#E4E3E010"} />
                          <XAxis dataKey="time" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #E4E3E020' }}
                          />
                          <Line type="monotone" dataKey="netIn" stroke="#9333ea" strokeWidth={2} dot={false} name="Inbound" />
                          <Line type="monotone" dataKey="netOut" stroke="#db2777" strokeWidth={2} dot={false} name="Outbound" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {batteryLevel !== null && (
                      <ChartContainer title={`Battery (${batteryLevel}%)`} theme={theme}>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={data.map(d => ({ ...d, bat: batteryLevel }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#14141420" : "#E4E3E010"} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip 
                              contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #E4E3E020' }}
                              itemStyle={{ color: '#06b6d4' }}
                            />
                            <Area type="monotone" dataKey="bat" stroke="#06b6d4" fillOpacity={0.1} fill="#06b6d4" strokeWidth={2} name="Battery %" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MaintenanceCard 
                  title="Update Package Lists" 
                  desc="Synchronize package index files from their sources."
                  icon={<RefreshCw />}
                  onClick={() => runMaintenance('apt-get update')}
                  theme={theme}
                />
                <MaintenanceCard 
                  title="Upgrade Packages" 
                  desc="Install the newest versions of all packages currently installed."
                  icon={<Download />}
                  onClick={() => runMaintenance('apt-get upgrade -y')}
                  theme={theme}
                />
                <MaintenanceCard 
                  title="Autoremove" 
                  desc="Remove packages that were automatically installed and are no longer needed."
                  icon={<Trash2 />}
                  onClick={() => runMaintenance('apt-get autoremove -y')}
                  theme={theme}
                />
                <MaintenanceCard 
                  title="Autoclean" 
                  desc="Clear out the local repository of retrieved package files."
                  icon={<Wrench />}
                  onClick={() => runMaintenance('apt-get autoclean')}
                  theme={theme}
                />
                <MaintenanceCard 
                  title="Update Flatpak" 
                  desc="Update all installed Flatpak applications and runtimes."
                  icon={<Globe />}
                  onClick={() => runMaintenance('flatpak update -y')}
                  theme={theme}
                />
                <MaintenanceCard 
                  title="Full Maintenance" 
                  desc="Run all maintenance tasks sequentially (Update, Upgrade, Autoremove, Clean)."
                  icon={<Zap />}
                  onClick={() => runMaintenance('full')}
                  theme={theme}
                  highlight
                />
                <MaintenanceCard 
                  title="Fix Spotify GPG" 
                  desc="Resolve public key signature errors for Spotify repository."
                  icon={<Shield />}
                  onClick={fixSpotifyGPG}
                  theme={theme}
                />
              </div>

              {/* DNS Settings Section */}
              <div className={cn(
                "border p-6 space-y-6 mt-8",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <div className="flex items-center gap-3 border-b border-current/10 pb-4">
                  <div className="p-2 bg-blue-600/10 text-blue-600 rounded">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-sm">DNS Configuration</h3>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">Optimize your network connection</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DNS_PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSystemDNS(provider.id)}
                      disabled={isDNSSetting}
                      className={cn(
                        "p-4 border text-left transition-all relative group overflow-hidden",
                        selectedDNS === provider.id 
                          ? "border-blue-600 bg-blue-600/5" 
                          : (theme === 'light' ? "bg-white border-[#14141410] hover:border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10 hover:border-[#E4E3E0]/30"),
                        isDNSSetting && "opacity-50 cursor-wait"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-xs uppercase tracking-widest">{provider.name}</span>
                        {selectedDNS === provider.id && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] font-mono opacity-50 truncate">
                        {provider.primary || 'Auto-detect'} {provider.secondary && `| ${provider.secondary}`}
                      </p>
                      
                      {/* Hover Effect Bar */}
                      <div className={cn(
                        "absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all duration-300",
                        selectedDNS === provider.id ? "w-full" : "w-0 group-hover:w-full"
                      )} />
                    </button>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-current/10 flex items-center gap-4 text-[10px] opacity-40 italic">
                  <Info size={12} />
                  <p>Changes will apply to all active ethernet and wireless connections using NetworkManager (nmcli).</p>
                </div>
              </div>

              {maintenanceOutput && (
                <div className={cn(
                  "border p-6 font-mono text-xs overflow-auto max-h-[400px]",
                  theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                )}>
                  <div className="flex justify-between items-center mb-4 border-b border-current/10 pb-2">
                    <span className="uppercase font-bold opacity-40">Maintenance Console Output</span>
                    <button onClick={() => setMaintenanceOutput('')} className="hover:text-red-500"><X size={14} /></button>
                  </div>
                  <pre className="whitespace-pre-wrap">{maintenanceOutput}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cleaner' && (
            <div className="space-y-6">
              <div className={cn(
                "p-8 border",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <h2 className="text-xl font-bold uppercase tracking-tight mb-6">System Cleaner</h2>
                <div className="space-y-4 max-w-md">
                  {Object.entries(cleanerOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                         type="checkbox" 
                         checked={value} 
                         onChange={() => setCleanerOptions((prev: any) => ({ ...prev, [key]: !value }))}
                         className="w-5 h-5 accent-blue-600"
                      />
                      <span className="font-bold uppercase tracking-widest text-xs group-hover:text-blue-600 transition-colors">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
                <button 
                  onClick={runCleaner}
                  className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all"
                >
                  Analyze & Clean
                </button>
              </div>
            </div>
          )}

          {activeTab === 'startup' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input 
                    type="text" 
                    placeholder="Search startup items..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 text-xs font-bold uppercase tracking-widest border focus:outline-none focus:border-blue-600 transition-all",
                      theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                    )}
                  />
                </div>
              </div>
              <div className={cn(
                "border overflow-hidden",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-current/10 uppercase text-[10px] font-bold tracking-widest opacity-40">
                      <th className="px-6 py-4">Service/App Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono">
                    {startup.filter((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item: any, i: number) => (
                      <tr key={i} className="border-b border-current/5 hover:bg-current/5 transition-colors">
                        <td className="px-6 py-4 font-bold">{item.name}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            item.status === 'enabled' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 opacity-50">{item.type}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleStartup(item.name, item.status === 'enabled')}
                            className="p-2 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'processes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold uppercase">System Processes</h2>
                <div className="flex gap-2">
                  <button className={cn(
                    "px-4 py-2 border text-xs font-bold uppercase transition-all",
                    theme === 'light' ? "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" : "border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414]"
                  )}>End Process</button>
                  <button className={cn(
                    "px-4 py-2 text-xs font-bold uppercase",
                    theme === 'light' ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414]"
                  )}>Refresh</button>
                </div>
              </div>
              <div className={cn(
                "border overflow-hidden",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <table className="w-full text-left text-sm">
                  <thead className={cn(
                    "font-mono text-[10px] uppercase tracking-widest",
                    theme === 'light' ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414]"
                  )}>
                    <tr>
                      <th className="p-4">PID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">CPU %</th>
                      <th className="p-4">MEM %</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14141410]">
                    {processes.map((proc: any) => (
                      <tr key={proc.pid} className={cn(
                        "transition-colors",
                        theme === 'light' ? "hover:bg-gray-50" : "hover:bg-white/5"
                      )}>
                        <td className="p-4 font-mono">{proc.pid}</td>
                        <td className="p-4 font-bold truncate max-w-[200px]">{proc.name}</td>
                        <td className="p-4">{proc.cpu}%</td>
                        <td className="p-4">{proc.mem}%</td>
                        <td className="p-4 opacity-60">{proc.user}</td>
                        <td className="p-4">
                          <button 
                            onClick={async () => {
                              const res = await runCommand('kill', ['-9', proc.pid.toString()]);
                              if (res.success) addAlert('info', `Process ${proc.pid} terminated`);
                            }}
                            className="p-1 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: any) => (
                <div key={service.name} className={cn(
                  "border p-6 space-y-4",
                  theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                )}>
                  <div className="flex justify-between items-start">
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-lg truncate">{service.name}</h3>
                      <p className="text-xs opacity-50 truncate">{service.desc}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-[10px] uppercase font-bold shrink-0",
                      service.status === 'running' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {service.status}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={async () => {
                        addAlert('info', `Starting ${service.name}...`);
                        await runCommand('systemctl', ['start', service.name], true);
                      }}
                      className={cn(
                        "flex-1 py-2 border text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all",
                        theme === 'light' ? "border-[#141414] hover:bg-green-50" : "border-[#E4E3E0]/20 hover:bg-green-500/10"
                      )}
                    >
                      <Play size={12} /> Start
                    </button>
                    <button 
                      onClick={async () => {
                        addAlert('info', `Stopping ${service.name}...`);
                        await runCommand('systemctl', ['stop', service.name], true);
                      }}
                      className={cn(
                        "flex-1 py-2 border text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all",
                        theme === 'light' ? "border-[#141414] hover:bg-red-50" : "border-[#E4E3E0]/20 hover:bg-red-500/10"
                      )}
                    >
                      <Square size={12} /> Stop
                    </button>
                    <button 
                      onClick={async () => {
                        addAlert('info', `Restarting ${service.name}...`);
                        await runCommand('systemctl', ['restart', service.name], true);
                      }}
                      className={cn(
                        "flex-1 py-2 border text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all",
                        theme === 'light' ? "border-[#141414] hover:bg-gray-50" : "border-[#E4E3E0]/20 hover:bg-white/5"
                      )}
                    >
                      <RotateCcw size={12} /> Restart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'disk' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {disks.map((disk: any) => (
                  <div key={disk.device} className={cn(
                    "border p-6 space-y-4",
                    theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                  )}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold uppercase tracking-widest text-xs">{disk.mount}</h3>
                      <HardDrive className="w-4 h-4 opacity-40" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase opacity-40">
                        <span>Used: {disk.used}</span>
                        <span>Total: {disk.size}</span>
                      </div>
                      <div className="h-1 bg-current/10 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500" 
                          style={{ width: `${disk.usage}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] font-mono opacity-40">{disk.device} ({disk.type})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kernel' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold uppercase tracking-tighter">Kernel Management</h2>
                <button 
                  onClick={updateKernel}
                  disabled={isKernelUpdating}
                  className={cn(
                    "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                    isKernelUpdating ? "opacity-50 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  <RefreshCw className={cn("w-3 h-3", isKernelUpdating && "animate-spin")} />
                  {isKernelUpdating ? "Updating..." : "Update Kernel"}
                </button>
              </div>

              <div className={cn(
                "border p-6",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Active Kernel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <InfoRow label="Release" value={kernelInfo.release} />
                    <InfoRow label="Version" value={kernelInfo.version} />
                    <InfoRow label="Architecture" value={kernelInfo.arch} />
                    <InfoRow label="Hostname" value={kernelInfo.hostname} />
                  </div>
                  <div className="space-y-4">
                    <InfoRow label="Uptime" value={kernelInfo.uptime} />
                    <InfoRow label="Load Avg" value={kernelInfo.load.join(', ')} />
                    <InfoRow label="Distribution" value={kernelInfo.distro} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Old Kernels</h3>
                  <span className="text-[10px] font-bold opacity-40 uppercase">{oldKernels.length} Found</span>
                </div>
                
                {oldKernels.length > 0 ? (
                  <div className={cn(
                    "border overflow-hidden",
                    theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                  )}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-current/10 uppercase text-[10px] font-bold tracking-widest opacity-40">
                          <th className="px-6 py-4">Kernel Name</th>
                          <th className="px-6 py-4">Version</th>
                          <th className="px-6 py-4">Release</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-mono">
                        {oldKernels.map((k, i) => (
                          <tr key={i} className="border-b border-current/5 hover:bg-current/5 transition-colors">
                            <td className="px-6 py-4 font-bold">{k.name}</td>
                            <td className="px-6 py-4 opacity-50">{k.version}</td>
                            <td className="px-6 py-4 opacity-50">{k.release}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => removeKernel(k.name)}
                                className="text-red-500 hover:text-red-600 transition-colors p-1"
                                title="Remove Kernel"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={cn(
                    "border p-12 text-center space-y-2",
                    theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                  )}>
                    <Activity className="w-8 h-8 mx-auto opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">No old kernels detected</p>
                    <p className="text-[10px] opacity-20">Your system is clean or using a distribution that manages kernels differently.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold uppercase">Installed Packages ({packages.length})</h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input 
                      type="text" 
                      placeholder="Search installed packages..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className={cn(
                        "w-64 pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest border focus:outline-none focus:border-blue-600 transition-all",
                        theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className={cn(
                "border overflow-hidden",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-current/10 uppercase text-[10px] font-bold tracking-widest opacity-40">
                      <th className="px-6 py-4">Package Name</th>
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono">
                    {packages.filter((p: any) => p.name.includes(searchQuery)).map((pkg: any, i: number) => (
                      <tr key={i} className="border-b border-current/5 hover:bg-current/5 transition-colors">
                        <td className="px-6 py-4 font-bold">{pkg.name}</td>
                        <td className="px-6 py-4 opacity-50">{pkg.version}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-bold uppercase">
                            {pkg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'installer' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold uppercase tracking-tighter">Software Center</h2>
                  <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">
                    Catalog: {catalogStats.total} Apps | Installed: {catalogStats.installed}
                  </p>
                </div>
                <div className="flex gap-4">
                  {selectedApps.length > 0 && (
                    <button 
                      onClick={async () => {
                        addAlert('info', `Batch installing ${selectedApps.length} apps...`);
                        // This is a simplified batch install
                        for (const appId of selectedApps) {
                          // Find app in catalog
                          let app: any = null;
                          Object.values(APPS_CATALOG).forEach((cat: any[]) => {
                            const found = cat.find((a: any) => a.id === appId);
                            if (found) app = found;
                          });
                          if (app) {
                            const distro = kernelInfo.distro.toLowerCase();
                            let nativePkg = app.packages.apt;
                            if (distro.includes('arch')) nativePkg = app.packages.pacman;
                            if (nativePkg) {
                              let installCmd = distro.includes('arch') ? 'pacman' : 'apt-get';
                              let args = distro.includes('arch') ? ['-S', '--noconfirm', nativePkg] : ['install', '-y', nativePkg];
                              await runCommand(installCmd, args, true);
                            }
                          }
                        }
                        setSelectedApps([]);
                        setRefreshCounter((prev: number) => prev + 1);
                        addAlert('success', 'Batch installation completed');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase hover:bg-blue-700 transition-all"
                    >
                      Install Selected ({selectedApps.length})
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      addAlert('info', 'Refreshing package list...');
                      // Trigger a re-fetch by toggling a dummy state or just calling fetchData
                      // Since fetchData is inside useEffect, we can't call it directly easily
                      // But we can just change activeTab to something else and back, or use a refresh counter
                      setSearchQuery((prev: string) => prev); // This won't work. 
                      // I'll add a refreshCounter state
                      setRefreshCounter((prev: number) => prev + 1);
                    }}
                    className={cn(
                      "p-2 border transition-all",
                      theme === 'light' ? "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" : "border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414]"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input 
                      type="text" 
                      placeholder="Search apps..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className={cn(
                        "pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest border focus:outline-none focus:border-blue-600 transition-all w-64",
                        theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                      )}
                    />
                  </div>
                </div>
              </div>

              {Object.entries(APPS_CATALOG).map(([category, apps]) => {
                const filteredApps = apps.filter(app => 
                  app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  app.desc.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredApps.length === 0) return null;

                return (
                  <div key={category} className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] opacity-40 border-b border-current/10 pb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredApps.map(app => {
                        let nativePkg = app.packages.apt;
                        if (distroType === 'arch') nativePkg = app.packages.pacman;
                        else if (distroType === 'fedora') nativePkg = app.packages.dnf;
                        
                        const isNativeInstalled = nativePkg && packages.some((p: any) => p.name === nativePkg);
                        const isFlatpakInstalled = app.flatpak && flatpaks.includes(app.flatpak);
                        const isNativeAvailable = nativePkg && (availablePackages.has(nativePkg) || isNativeInstalled);
                        
                        return (
                          <div key={app.id} className={cn(
                            "border p-6 flex flex-col justify-between group transition-all relative",
                            selectedApps.includes(app.id) ? "border-blue-600 ring-1 ring-blue-600" : (theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10")
                          )}>
                            <div className="absolute top-2 right-2 flex items-center gap-3">
                              {(isNativeInstalled || isFlatpakInstalled) && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                                  <CheckCircle2 size={12} /> Installed
                                </span>
                              )}
                              <input 
                                type="checkbox" 
                                checked={selectedApps.includes(app.id)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  if (e.target.checked) setSelectedApps((prev: string[]) => [...prev, app.id]);
                                  else setSelectedApps((prev: string[]) => prev.filter((id: string) => id !== app.id));
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-lg uppercase tracking-tight">{app.name}</h4>
                                <div className="flex gap-2">
                                  {isNativeInstalled && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20">Native</span>}
                                  {isFlatpakInstalled && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-orange-500/10 text-orange-500 border border-orange-500/20">Flatpak</span>}
                                </div>
                              </div>
                              <p className="text-xs opacity-70 mb-6 leading-relaxed">{app.desc}</p>
                            </div>
                            <div className="flex gap-3">
                              {!isNativeInstalled && !isFlatpakInstalled ? (
                                <>
                                  {nativePkg && (
                                    <button 
                                      disabled={!isNativeAvailable}
                                      onClick={async () => {
                                        addAlert('info', `Installing ${app.name} (Native)...`);
                                        let installCmd = 'apt-get';
                                        let args = ['install', '-y', nativePkg!];
                                        if (distroType === 'arch') { installCmd = 'pacman'; args = ['-S', '--noconfirm', nativePkg!]; }
                                        else if (distroType === 'fedora') { installCmd = 'dnf'; args = ['install', '-y', nativePkg!]; }
                                        const res = await runCommand(installCmd, args, true);
                                        if (res.success) {
                                          addAlert('success', `${app.name} installed successfully`);
                                          setRefreshCounter((prev: number) => prev + 1);
                                        }
                                      }}
                                      className={cn(
                                        "flex-1 py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                                        !isNativeAvailable ? "opacity-20 cursor-not-allowed grayscale" : (theme === 'light' ? "bg-[#141414] text-[#E4E3E0] hover:bg-blue-600" : "bg-[#E4E3E0] text-[#141414] hover:bg-blue-400")
                                      )}
                                    >
                                      <Download size={12} /> Native
                                    </button>
                                  )}
                                  {app.flatpak && (
                                    <button 
                                      onClick={async () => {
                                        addAlert('info', `Installing ${app.name} (Flatpak)...`);
                                        const res = await runCommand('flatpak', ['install', '-y', 'flathub', app.flatpak]);
                                        if (res.success) {
                                          addAlert('success', `${app.name} installed successfully`);
                                          setRefreshCounter((prev: number) => prev + 1);
                                        }
                                      }}
                                      className={cn(
                                        "flex-1 py-2 border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                                        theme === 'light' ? "border-[#141414] hover:bg-gray-50" : "border-[#E4E3E0]/20 hover:bg-white/5"
                                      )}
                                    >
                                      <Layers size={12} /> Flatpak
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button 
                                  onClick={async () => {
                                    addAlert('info', `Removing ${app.name}...`);
                                    if (isNativeInstalled) {
                                      let removeCmd = 'apt-get';
                                      let args = ['remove', '-y', nativePkg!];
                                      if (distroType === 'arch') { removeCmd = 'pacman'; args = ['-R', '--noconfirm', nativePkg!]; }
                                      else if (distroType === 'fedora') { removeCmd = 'dnf'; args = ['remove', '-y', nativePkg!]; }
                                      await runCommand(removeCmd, args, true);
                                    } else if (isFlatpakInstalled) {
                                      await runCommand('flatpak', ['uninstall', '-y', app.flatpak!]);
                                    }
                                    setRefreshCounter((prev: number) => prev + 1);
                                    addAlert('success', `${app.name} removed`);
                                  }}
                                  className="flex-1 py-2 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                  <Trash2 size={12} /> Uninstall
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="w-full max-w-5xl mx-auto space-y-12 pb-12">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-blue-600 mx-auto flex items-center justify-center text-white font-bold text-5xl shadow-2xl">T</div>
                <div className="space-y-2">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase italic">TuxPulse</h2>
                  <p className="text-xs font-bold opacity-40 uppercase tracking-[0.3em]">
                    Current: {APP_VERSION} | Latest: {latestVersion}
                    {updateAvailable && (
                      <button 
                        onClick={() => openExternal('https://github.com/eoliann/TuxPulse2/releases')}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-[10px] rounded-full hover:bg-blue-700 transition-all animate-pulse"
                      >
                        Update Available
                      </button>
                    )}
                  </p>
                </div>
                <p className="text-lg md:text-2xl font-serif italic opacity-60 max-w-2xl mx-auto">
                  High-performance system toolkit for Linux maintenance, cleanup and real-time monitoring.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold uppercase tracking-tight border-b border-current pb-2">The Project</h3>
                    <p className="opacity-80 leading-relaxed font-serif text-lg">
                      TuxPulse is a high-performance system management toolkit designed for Linux distributions. 
                      It provides a unified interface for system updates, cleanup, and real-time monitoring while maintaining a strict security posture.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm">
                      <h4 className="text-[10px] font-bold uppercase text-blue-500 mb-2 tracking-widest">Architecture</h4>
                      <p className="text-xs opacity-70 font-mono">Rust (Tauri v2) & React 19</p>
                    </div>
                    <div className="p-5 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
                      <h4 className="text-[10px] font-bold uppercase text-green-500 mb-2 tracking-widest">Security Audit</h4>
                      <p className="text-xs opacity-70 font-mono">Command Allow-listing & Root Isolation</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => openExternal('https://github.com/eoliann/TuxPulse2')}
                      className={cn(
                        "flex-1 min-w-[140px] px-6 py-3 border font-bold uppercase text-[10px] tracking-widest transition-all",
                        theme === 'light' ? "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" : "border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414]"
                      )}
                    >GitHub Repo</button>
                    <button 
                      onClick={() => openExternal('https://t.me/tuxpulse')}
                      className={cn(
                        "flex-1 min-w-[140px] px-6 py-3 border font-bold uppercase text-[10px] tracking-widest transition-all bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
                      )}
                    >Telegram Group</button>
                    <button 
                      onClick={() => openExternal('https://tuxpulse.org/docs')}
                      className={cn(
                        "flex-1 min-w-[140px] px-6 py-3 border font-bold uppercase text-[10px] tracking-widest transition-all",
                        theme === 'light' ? "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" : "border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414]"
                      )}
                    >Documentation</button>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold uppercase tracking-tight border-b border-current pb-2">Support the Project</h3>
                    <p className="opacity-70 text-sm font-serif italic">
                      If TuxPulse helps you keep your system clean and fast, consider supporting its development.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => openExternal('https://www.paypal.com/donate/?hosted_button_id=PTH2EXUDS423S')}
                        className="flex items-center justify-center gap-3 p-4 bg-[#003087] text-white hover:bg-[#002466] transition-all group"
                      >
                        <span className="font-bold italic text-lg tracking-tighter">PayPal</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => openExternal('http://revolut.me/adriannm9?style=plastic')}
                        className="flex items-center justify-center gap-3 p-4 bg-white text-black border border-black/10 hover:bg-gray-50 transition-all group"
                      >
                        <span className="font-bold text-lg tracking-tighter">Revolut</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold uppercase tracking-tight border-b border-current pb-2">Contributors</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Contributor name="eoliann" role="Lead Developer" />
                      <Contributor name="Community" role="Testing & Docs" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-current/10">
                    <h4 className="text-[10px] font-bold uppercase opacity-40 mb-3 tracking-widest">Legal & License</h4>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs font-mono opacity-60">MIT License © 2026</p>
                      <button 
                        onClick={() => setShowLicense(true)}
                        className="text-[10px] font-bold uppercase underline hover:text-blue-600 transition-colors tracking-widest"
                      >
                        Full License & Disclaimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Modal */}
              {showLicense && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className={cn(
                    "w-full max-w-2xl max-h-[80vh] flex flex-col border shadow-2xl animate-in zoom-in-95 duration-300",
                    theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/20"
                  )}>
                    <div className="p-6 border-b border-current/10 flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em]">License & Disclaimer</h3>
                      <button 
                        onClick={() => setShowLicense(false)}
                        className="p-2 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-8 overflow-y-auto font-mono text-xs leading-relaxed space-y-6">
                      <div className="whitespace-pre-wrap opacity-80">
                        {`MIT License

Copyright (c) 2026 eoliann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

### DISCLAIMER AND LIMITATION OF LIABILITY

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

USE AT YOUR OWN RISK. TuxPulse is a powerful system tool that performs operations requiring root privileges. While every effort has been made to ensure safety and stability, the author(s) are NOT responsible for any damage, data loss, or system instability caused by the use or misuse of this application.`}
                      </div>
                    </div>
                    <div className="p-6 border-t border-current/10 flex justify-end">
                      <button 
                        onClick={() => setShowLicense(false)}
                        className={cn(
                          "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                          theme === 'light' ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414]"
                        )}
                      >
                        I Understand
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard 
                  title="System Cleanup" 
                  desc="Remove unused packages and clear cache." 
                  icon={<Trash2 />} 
                  onAction={runCleaner} 
                  theme={theme} 
                />
                <ToolCard 
                  title="Update Manager" 
                  desc="Check for system and kernel updates." 
                  icon={<RefreshCw />} 
                  onAction={async () => {
                    addAlert('info', 'Checking for updates...');
                    await runCommand('apt-get', ['update']);
                  }} 
                  theme={theme} 
                />
                <ToolCard 
                  title="Log Analyzer" 
                  desc="Scan system logs for anomalies." 
                  icon={<Terminal />} 
                  onAction={async () => {
                    addAlert('info', 'Log analysis in progress');
                    await runCommand('journalctl', ['-p', '3', '-n', '50']);
                  }} 
                  theme={theme} 
                />
                <ToolCard 
                  title="Package Search" 
                  desc="Search for software in repositories." 
                  icon={<Search />} 
                  onAction={() => addAlert('info', 'Package search ready')} 
                  theme={theme} 
                />
                <ToolCard 
                  title="Kernel Tweak" 
                  desc="Optimize kernel parameters for performance." 
                  icon={<Settings />} 
                  onAction={async () => {
                    addAlert('info', 'Kernel optimizer ready');
                    await runCommand('uname', ['-a']);
                  }} 
                  theme={theme} 
                />
                <ToolCard 
                  title="Network Scan" 
                  desc="Analyze local network connections." 
                  icon={<Network />} 
                  onAction={async () => {
                    addAlert('info', 'Network scanner ready');
                    await runCommand('ip', ['addr']);
                  }} 
                  theme={theme} 
                />
              </div>

              {cleanerOutput && (
                <div className={cn(
                  "border p-6 font-mono text-xs overflow-auto max-h-[400px] mb-8",
                  theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
                )}>
                  <div className="flex justify-between items-center mb-4 border-b border-current/10 pb-2">
                    <span className="uppercase font-bold opacity-40">Cleaner Console Output</span>
                    <button onClick={() => setCleanerOutput('')} className="hover:text-red-500"><X size={14} /></button>
                  </div>
                  <pre className="whitespace-pre-wrap">{cleanerOutput}</pre>
                </div>
              )}

              <div className={cn(
                "border p-8",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold uppercase">System Logs (journalctl)</h3>
                  <button className={cn(
                    "text-xs font-bold uppercase flex items-center gap-2 border px-3 py-1 transition-all",
                    theme === 'light' ? "border-[#141414] hover:bg-gray-50" : "border-[#E4E3E0]/20 hover:bg-white/5"
                  )}>
                    <Eye size={14} /> Full View
                  </button>
                </div>
                <div className="bg-[#141414] text-[#E4E3E0] p-4 font-mono text-xs h-64 overflow-y-auto space-y-1">
                  {systemLogs.length > 0 ? (
                    systemLogs.map((log: string, i: number) => (
                      <p key={i} className={cn(
                        log.toLowerCase().includes('error') ? "text-red-400" : 
                        log.toLowerCase().includes('warn') ? "text-yellow-400" : "opacity-80"
                      )}>{log}</p>
                    ))
                  ) : (
                    <>
                      <p className="opacity-40">Apr 09 06:13:48 tuxpulse systemd[1]: Starting TuxPulse Secure Helper...</p>
                      <p className="text-green-400">Apr 09 06:13:49 tuxpulse TuxPulseHelper: Secure Helper started successfully</p>
                      <p className="opacity-40">Apr 09 06:14:02 tuxpulse kernel: [1234.56] audit: type=1400 ...</p>
                      <p className="text-yellow-400">Apr 09 06:15:22 tuxpulse TuxPulseHelper: Connection from UID 1000</p>
                      <p className="opacity-40">Apr 09 06:15:22 tuxpulse TuxPulseHelper: Executing allowed command: status</p>
                      <p className="opacity-40">Apr 09 06:18:11 tuxpulse systemd[1]: Reloading configuration...</p>
                      <p className="text-blue-400">Apr 09 06:20:01 tuxpulse CRON[999]: (root) CMD (cleanup-task)</p>
                      <p className="opacity-40">Apr 09 06:22:45 tuxpulse kernel: [2345.67] pcieport 0000:00:1c.0: AER: Corrected error</p>
                    </>
                  )}
                </div>
              </div>

              <div className={cn(
                "border p-8",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <h3 className="text-xl font-bold uppercase mb-6">Secure System Files</h3>
                <p className="text-sm opacity-70 mb-6">Download the corrected and secured system files to replace the vulnerable daemon on your Linux machine.</p>
                <div className="space-y-4">
                  <FileDownloadItem name="tuxpulse_helper_secure.py" desc="Secure Python helper with UID verification" theme={theme} />
                  <FileDownloadItem name="tuxpulse-helper.service" desc="Hardened systemd unit file" theme={theme} />
                  <FileDownloadItem name="com.eoliann.tuxpulse.policy" desc="Polkit policy for secure GUI auth" theme={theme} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-4xl space-y-8">
              <div className={cn(
                "p-8 border-l-8 border-blue-600",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Security Audit</h2>
                    <p className="opacity-60 font-serif italic">Scan your system for common vulnerabilities and misconfigurations.</p>
                  </div>
                  <button 
                    onClick={runSecurityScan}
                    disabled={isScanning}
                    className={cn(
                      "px-6 py-3 font-bold uppercase tracking-widest text-xs transition-all",
                      isScanning ? "opacity-50 cursor-not-allowed" : "",
                      theme === 'light' ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414]"
                    )}
                  >
                    {isScanning ? 'Scanning...' : 'Start Audit'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {securityScanResults.length > 0 ? (
                    securityScanResults.map((res: any, i: number) => (
                      <div key={i} className={cn(
                        "p-4 border",
                        res.status === 'critical' ? "border-red-500 bg-red-500/5" : 
                        res.status === 'warning' ? "border-yellow-500 bg-yellow-500/5" : "border-green-500 bg-green-500/5"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {res.status === 'critical' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : 
                           res.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> : 
                           <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          <h4 className="font-bold text-xs uppercase">{res.title}</h4>
                        </div>
                        <p className="text-[10px] opacity-70">{res.desc}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 py-12 text-center opacity-40 italic">
                      No scan data available. Click "Start Audit" to begin.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-tight border-b border-current pb-2">Vulnerability History</h3>
                  <div className="space-y-4">
                    <SecurityPoint icon={<X className="text-red-500" />} title="CVE-2024-XXXX" points={['Local Privilege Escalation via world-writable socket', 'Fixed in v5.1']} />
                    <SecurityPoint icon={<CheckCircle2 className="text-green-500" />} title="Secure Daemon" points={['SO_PEERCRED UID verification implemented', 'Strict command allow-list enforced']} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-tight border-b border-current pb-2">Hardening Guide</h3>
                  <div className="p-4 bg-blue-600/5 border border-blue-600/20">
                    <p className="text-xs leading-relaxed opacity-80">
                      TuxPulse uses a secure execution model. All system commands are validated against a strict allow-list on the backend. 
                      Direct shell execution is disabled to prevent command injection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="max-w-2xl space-y-8">
              <div className={cn(
                "p-8 border",
                theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
              )}>
                <h2 className="text-2xl font-bold uppercase tracking-tighter mb-2">System Alerts</h2>
                <p className="opacity-60 font-serif italic mb-8">Configure thresholds for automated system notifications.</p>
                
                <div className="space-y-4">
                  <AlertSetting 
                    label="CPU Usage Threshold" 
                    value={alertThresholds.cpu} 
                    onChange={(v: number) => setAlertThresholds((prev: any) => ({ ...prev, cpu: v }))}
                    unit="%" 
                    theme={theme} 
                  />
                  <AlertSetting 
                    label="RAM Usage Threshold" 
                    value={alertThresholds.ram} 
                    onChange={(v: number) => setAlertThresholds((prev: any) => ({ ...prev, ram: v }))}
                    unit="%" 
                    theme={theme} 
                  />
                  <AlertSetting 
                    label="Disk Usage Warning" 
                    value={alertThresholds.disk} 
                    onChange={(v: number) => setAlertThresholds((prev: any) => ({ ...prev, disk: v }))}
                    unit="%" 
                    theme={theme} 
                  />
                  <AlertSetting 
                    label="Network Spike" 
                    value={alertThresholds.network} 
                    onChange={(v: number) => setAlertThresholds((prev: any) => ({ ...prev, network: v }))}
                    unit="MB/s" 
                    theme={theme} 
                  />
                </div>

                <button 
                  onClick={() => addAlert('success', 'Alert thresholds updated')}
                  className={cn(
                    "mt-8 px-8 py-3 font-bold uppercase tracking-widest text-xs transition-all",
                    theme === 'light' ? "bg-[#141414] text-[#E4E3E0]" : "bg-[#E4E3E0] text-[#141414]"
                  )}
                >
                  Save Thresholds
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-8 right-8 space-y-4 z-[100]">
        {alerts.slice(0, 3).map((alert: any) => (
          <div key={alert.id} className={cn(
            "p-4 border-l-4 shadow-xl flex items-center justify-between gap-4 min-w-[300px] animate-in slide-in-from-right",
            alert.type === 'error' ? "bg-red-50 border-red-500 text-red-900" : 
            alert.type === 'warning' ? "bg-orange-50 border-orange-500 text-orange-900" : 
            alert.type === 'success' ? "bg-green-50 border-green-500 text-green-900" :
            theme === 'light' ? "bg-white border-[#141414] text-[#141414]" : "bg-[#141414] border-[#E4E3E0]/20 text-[#E4E3E0]"
          )}>
            <div className="flex items-center gap-3">
              {alert.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : 
               alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
               alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
               <Info className="w-5 h-5" />}
              <div>
                <p className="font-bold text-sm">{alert.message}</p>
                <p className="text-xs opacity-60">{alert.time}</p>
              </div>
            </div>
            <button onClick={() => setAlerts((prev: any[]) => prev.filter((a: any) => a.id !== alert.id))}><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, collapsed, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 group relative",
        active 
          ? "bg-[#E4E3E0] text-[#141414] font-bold" 
          : "text-[#E4E3E0]/60 hover:text-[#E4E3E0] hover:bg-white/5"
      )}
    >
      <div className={cn("transition-transform duration-200", active && "scale-110")}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      {!collapsed && <span className="text-sm tracking-tight">{label}</span>}
      {active && <div className="absolute left-0 top-0 w-1 h-full bg-[#141414]" />}
    </button>
  );
}

function StatsCard({ icon, label, value, color, theme }: { icon: React.ReactNode, label: string, value: string, color: string, theme: 'light' | 'dark' }) {
  return (
    <div className={cn(
      "border p-6 transition-all flex items-center justify-between",
      theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
    )}>
      <div>
        <p className="text-[10px] font-serif italic opacity-50 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tighter">{value}</p>
      </div>
      <div className={cn(
        "p-2 border",
        theme === 'light' ? "bg-[#E4E3E0] border-[#141414]" : "bg-white/5 border-[#E4E3E0]/20",
        color
      )}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase opacity-40 font-bold tracking-widest">{label}</span>
      <span className="text-sm font-bold truncate">{value}</span>
    </div>
  );
}
function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-current/10 py-2">
      <span className="text-xs uppercase font-bold opacity-40">{label}</span>
      <span className="text-sm font-mono font-bold">{value}</span>
    </div>
  );
}

function HealthWidget({ icon, label, value, status, theme }: { icon: React.ReactNode, label: string, value: string, status: 'optimal' | 'warning' | 'critical', theme: 'light' | 'dark' }) {
  return (
    <div className={cn(
      "border p-4 flex items-center gap-4",
      theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
    )}>
      <div className={cn(
        "p-2 border",
        status === 'optimal' ? "border-green-500 text-green-500" : 
        status === 'warning' ? "border-yellow-500 text-yellow-500" : "border-red-500 text-red-500"
      )}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase font-bold opacity-40">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
      <div className={cn(
        "w-2 h-2 rounded-full",
        status === 'optimal' ? "bg-green-500" : "bg-red-500"
      )} />
    </div>
  );
}

function ChartContainer({ title, children, theme }: { title: string, children: React.ReactNode, theme: 'light' | 'dark' }) {
  return (
    <div className={cn(
      "border p-6",
      theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
    )}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-current/10 pb-2 flex items-center gap-2">
        <Activity className="w-4 h-4" /> {title}
      </h3>
      {children}
    </div>
  );
}

function AlertSetting({ label, value, onChange, unit, theme }: any) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 border",
      theme === 'light' ? "bg-white border-[#141414]" : "bg-[#141414] border-[#E4E3E0]/10"
    )}>
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={value} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseInt(e.target.value) || 0)}
          className={cn(
            "w-20 p-1 border text-center font-mono focus:outline-none",
            theme === 'light' ? "border-[#141414]" : "border-[#E4E3E0]/20 bg-transparent"
          )} 
        />
        <span className="text-sm opacity-50">{unit}</span>
      </div>
    </div>
  );
}

function ToolCard({ title, desc, icon, onAction, theme }: any) {
  return (
    <div 
      onClick={onAction}
      className={cn(
        "border p-6 flex flex-col justify-between group transition-all cursor-pointer",
        theme === 'light' 
          ? "bg-white border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" 
          : "bg-[#141414] border-[#E4E3E0]/10 hover:bg-[#E4E3E0] hover:text-[#141414]"
      )}
    >
      <div>
        <div className="mb-4 transition-colors">
          {React.cloneElement(icon, { size: 28 })}
        </div>
        <h4 className="font-bold text-lg mb-2 uppercase tracking-tight">{title}</h4>
        <p className="text-xs opacity-70 mb-6">{desc}</p>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
        Execute Tool <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
}

function FileDownloadItem({ name, desc, theme }: any) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 border-b transition-colors",
      theme === 'light' ? "border-[#14141410] hover:bg-gray-50" : "border-[#E4E3E0]/10 hover:bg-white/5"
    )}>
      <div>
        <p className="font-bold font-mono text-sm">{name}</p>
        <p className="text-[10px] opacity-50">{desc}</p>
      </div>
      <button className={cn(
        "px-4 py-2 border text-[10px] font-bold uppercase transition-all",
        theme === 'light' ? "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]" : "border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414]"
      )}>View Source</button>
    </div>
  );
}

function SecurityPoint({ icon, title, points }: any) {
  return (
    <div className="p-4 border border-current/10">
      <h4 className="font-bold mb-2 flex items-center gap-2">{icon} {title}</h4>
      <ul className="text-xs space-y-2 opacity-70">
        {points.map((p: string, i: number) => <li key={i}>• {p}</li>)}
      </ul>
    </div>
  );
}

function InstallerItem({ title, desc, version, onInstall, theme }: { title: string, desc: string, version: string, onInstall: () => void, theme?: 'light' | 'dark' }) {
  return (
    <div className="flex justify-between items-center border-b border-current/10 pb-4">
      <div className="space-y-1">
        <h4 className="font-bold">{title} <span className="text-[10px] opacity-40 ml-2">v{version}</span></h4>
        <p className="text-xs opacity-60">{desc}</p>
      </div>
      <button 
        onClick={onInstall}
        className={cn(
          "px-4 py-2 text-[10px] font-bold uppercase transition-all",
          theme === 'light' ? "bg-[#141414] text-[#E4E3E0] hover:bg-blue-600" : "bg-[#E4E3E0] text-[#141414] hover:bg-blue-400"
        )}
      >
        Install
      </button>
    </div>
  );
}

function Contributor({ name, role }: { name: string, role: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-current/10 rounded-full flex items-center justify-center font-bold text-xs">
        {name[0].toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-[10px] opacity-50 uppercase font-bold">{role}</p>
      </div>
    </div>
  );
}

const MaintenanceCard = ({ title, desc, icon, onClick, theme, highlight }: any) => (
  <div className={cn(
    "p-6 border transition-all group cursor-pointer",
    highlight ? "bg-blue-600 text-white border-blue-600" : (theme === 'light' ? "bg-white border-[#141414] hover:bg-gray-50" : "bg-[#141414] border-[#E4E3E0]/10 hover:bg-white/5")
  )} onClick={onClick}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2", highlight ? "bg-white/20" : "bg-blue-600/10 text-blue-600")}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
      </div>
      <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", highlight ? "text-white" : "opacity-40")} />
    </div>
    <h3 className="font-bold uppercase tracking-widest text-xs mb-2">{title}</h3>
    <p className={cn("text-[10px] leading-relaxed", highlight ? "text-white/70" : "opacity-50")}>{desc}</p>
  </div>
);
