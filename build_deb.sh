#!/bin/bash

# TuxPulse Native .deb Package Builder (Tauri Edition)
# This script uses Tauri's built-in packaging system for maximum security and performance.

set -e

echo "--- Starting Native .deb Build Process (Tauri + Rust) ---"

# 1. Check for Rust
if ! command -v cargo &> /dev/null; then
    echo "Error: Rust toolchain not found. Please install it from https://rustup.rs"
    exit 1
fi

# 2. Build the Native Application
echo "[1/2] Building native application with Tauri..."

# Fix for the "Cannot find native binding" npm bug
if [ ! -d "node_modules/@tauri-apps/cli-linux-x64-gnu" ]; then
    echo "Detected missing Tauri native bindings. Re-installing dependencies..."
    rm -rf node_modules package-lock.json
    npm install
fi

npm run tauri build

# 3. Locate the generated package
VERSION=$(grep '^version =' src-tauri/Cargo.toml | head -n 1 | cut -d '"' -f 2)
DEB_PATH=$(find src-tauri/target/release/bundle/deb/ -name "*.deb" | head -n 1)

if [ -f "$DEB_PATH" ]; then
    OUTPUT_NAME="tuxpulse_native_${VERSION}_amd64.deb"
    cp "$DEB_PATH" ./"$OUTPUT_NAME"
    echo "--- Build Complete ---"
    echo "Created: $OUTPUT_NAME"
    echo "To install and test, run: sudo apt install ./"$OUTPUT_NAME"
else
    echo "Error: .deb package not found in expected location."
    exit 1
fi
