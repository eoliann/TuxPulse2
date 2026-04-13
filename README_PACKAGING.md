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
1. Create a manifest file `com.eoliann.TuxPulse.json`.
2. Note: Flatpak apps are sandboxed. The helper must run outside the sandbox or use a portal.
3. Use `flatpak-builder --user --install --force-clean build-dir com.eoliann.TuxPulse.json`

## 4. Integration with VS Code
To test locally in VS Code:
1. **Frontend**: Use the built-in terminal to run `npm run dev`.
2. **Helper**: Run `sudo python3 system_files/tuxpulse_helper_secure.py` in a separate terminal.
3. **Debugging**: Use the "Debugger for Chrome" extension to debug the React code.

## 5. Deployment Script
We've included a `deploy_local.sh` script to quickly install the helper and policy on your Mint machine for testing.
