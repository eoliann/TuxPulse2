![Followers](https://img.shields.io/github/followers/eoliann?style=plastic&color=green)
![Watchers](https://img.shields.io/github/watchers/eoliann/TuxPulse2?style=plastic)
![Stars](https://img.shields.io/github/stars/eoliann/TuxPulse2?style=plastic)

[![Group](https://img.shields.io/badge/Group-Telegram-blue?style=plastic)](https://t.me/tuxpulse)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue?style=plastic)](https://www.paypal.com/donate/?hosted_button_id=PTH2EXUDS423S)
[![Donate](https://img.shields.io/badge/Donate-Revolut-8A2BE2?style=plastic)](http://revolut.me/adriannm9?style=plastic)

![Release Date](https://img.shields.io/github/release-date/eoliann/TuxPulse2?style=plastic)
![Last Commit](https://img.shields.io/github/last-commit/eoliann/TuxPulse2?style=plastic)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/eoliann/TuxPulse2/total?style=plastic)

![OS](https://img.shields.io/badge/OS-Linux-blue?style=plastic)
![Lang](https://img.shields.io/badge/Lang-Python-magenta?style=plastic)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=plastic)](LICENSE.md)

# TuxPulse

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
