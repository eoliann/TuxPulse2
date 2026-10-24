# TuxPulse Packaging Guide

TuxPulse has been upgraded to a **Native Desktop Application** using **Tauri (Rust + React)**. This provides a secure, high-performance native experience without the need for a web browser.

## 1. Prerequisites
- **Rust Toolchain**: Install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`.
- **System Dependencies (Linux)**:
  - Debian/Mint: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
- **Node.js & npm**: To build the React frontend.

## 2. Local Development
To run the native app in development mode:
```bash
npm run tauri dev
```

## 3. Building the Native Package (.deb, .rpm, etc.)
Tauri handles the packaging for you using Rust's safety features.

### A. Automated Build
```bash
npm run tauri build
```
This command will:
1. Compile the React frontend.
2. Compile the Rust backend.
3. Bundle everything into a native `.deb` (and other formats) located in `src-tauri/target/release/bundle/`.

## 4. Why Rust? (Security & Performance)
- **Memory Safety**: Rust prevents common bugs like buffer overflows that are often exploited in system tools.
- **No Browser Required**: The app runs in a native window, reducing RAM usage by up to 90% compared to Electron or browser-based apps.
- **Secure Bridge**: Communication between the UI and the system is handled via a secure IPC bridge, not an open network socket.

### B. RedHat/Fedora (.rpm)
1. Use a `.spec` file to define the build process.
2. Place files in standard locations: `/usr/bin`, `/usr/share/tuxpulse`.
3. Build: `rpmbuild -ba tuxpulse.spec`

### C. Arch Linux (pkg.tar.zst)
1. Create a `PKGBUILD` file.
2. Define `package()` function to install files into `$pkgdir`.
3. Build: `makepkg -si`

### D. Flatpak
The manifest is experimental. Host system maintenance is not supported inside the Flatpak sandbox.

## Development and system integration

Run `npm ci` and `npm run tauri dev`. The Rust backend authenticates individual validated operations through the distribution's existing pkexec integration. No background root daemon, custom polkit action or deployment script is required.

See [release notes](RELEASE_NOTES.md) for supported kernel operations and cleanup instructions for a previously deployed developer helper.

## Release verification

GitHub Actions runs frontend and Rust regression tests, builds Debian/RPM and native Arch packages, then publishes the version from package.json only after both Linux builds pass. SHA256SUMS accompanies the packages. Branch builds never publish a release.
