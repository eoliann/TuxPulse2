# TuxPulse v6.0.3

**TuxPulse** is a professional, lightweight system monitoring and management toolkit for Linux distributions. Built with React and Tauri, it provides real-time insights into your system's health and powerful tools for maintenance.

## ✨ Key Features

- **Real-time Dashboard**: Monitor CPU, RAM, Disk, and Network usage with high-precision charts.
- **Smart Battery Detection**: Automatically detects if you are on a laptop or desktop and adjusts the UI accordingly.
- **Kernel Management**: Update your kernel and safely remove old, unused kernel versions to free up space.
- **One-Click Maintenance**: Run system updates, clean package caches, and optimize your OS with a single sudo prompt.
- **Software Center**: Browse and install popular Linux applications across different distributions (Debian, Arch, Fedora).
- **Security Audit**: Scan for common security vulnerabilities like open ports or world-writable configurations.
- **System Logs**: Real-time access to `journalctl` logs for debugging.

## 🚀 Installation

### Prerequisites
- Rust & Cargo
- Node.js & npm
- Tauri dependencies (see [Tauri Docs](https://tauri.app/v1/guides/getting-started/prerequisites))

### Build from source
```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## ⚖️ License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK.** 

TuxPulse is a powerful system tool that performs operations requiring root privileges (via `sudo`/`pkexec`). While every effort has been made to ensure safety and stability, the author(s) of this software:
1. **Are NOT responsible** for any damage, data loss, or system instability caused by the use or misuse of this application.
2. Provide this software "as is", without warranty of any kind.
3. Strongly recommend backing up important data before performing system-level maintenance or kernel updates.

By using this software, you acknowledge that you understand these risks and take full responsibility for any consequences.
