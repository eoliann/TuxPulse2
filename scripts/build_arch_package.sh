#!/bin/bash
set -euo pipefail

if ! command -v makepkg >/dev/null 2>&1; then
  echo "Error: makepkg is required to build a native Arch package."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="$(grep '^version =' src-tauri/Cargo.toml | head -n 1 | cut -d '"' -f 2)"
OUT_DIR="$ROOT_DIR/release/packages/arch"
WORK_DIR="$OUT_DIR/tuxpulse-${VERSION}"
BINARY_PATH="$ROOT_DIR/src-tauri/target/release/tuxpulse"

if [ ! -f "$BINARY_PATH" ]; then
  echo "Error: missing release binary at $BINARY_PATH"
  echo "Run: cargo build --manifest-path src-tauri/Cargo.toml --release"
  exit 1
fi

rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR/package/usr/bin"
mkdir -p "$WORK_DIR/package/usr/share/applications"
mkdir -p "$WORK_DIR/package/usr/share/polkit-1/actions"
mkdir -p "$WORK_DIR/package/usr/share/icons/hicolor/128x128/apps"

install -Dm755 "$BINARY_PATH" "$WORK_DIR/package/usr/bin/tuxpulse"

if [ -f "system_files/tuxpulse.desktop" ]; then
  install -Dm644 "system_files/tuxpulse.desktop" "$WORK_DIR/package/usr/share/applications/tuxpulse.desktop"
fi

if [ -f "system_files/com.eoliann.tuxpulse.policy" ]; then
  install -Dm644 "system_files/com.eoliann.tuxpulse.policy" "$WORK_DIR/package/usr/share/polkit-1/actions/com.eoliann.tuxpulse.policy"
fi

if [ -f "src-tauri/icons/128x128.png" ]; then
  install -Dm644 "src-tauri/icons/128x128.png" "$WORK_DIR/package/usr/share/icons/hicolor/128x128/apps/tuxpulse.png"
fi

cat > "$WORK_DIR/PKGBUILD" <<EOF
pkgname=tuxpulse
pkgver=${VERSION}
pkgrel=1
pkgdesc="Secure System Monitoring and Management Toolkit"
arch=('x86_64')
url="https://github.com/eoliann/TuxPulse2"
license=('GPL3')
depends=('gtk3' 'libayatana-appindicator' 'openssl' 'webkit2gtk-4.1')
options=('!strip')

package() {
  install -d "\$pkgdir"
  cp -a "\$startdir/package/." "\$pkgdir/"
}
EOF

cd "$WORK_DIR"
makepkg -f --nodeps

pkg_file="$(find "$WORK_DIR" -maxdepth 1 -type f -name "tuxpulse-${VERSION}-*.pkg.tar.zst" | head -n 1)"

if [ -z "$pkg_file" ]; then
  echo "Error: Arch package was not generated."
  exit 1
fi

cp -f "$pkg_file" "$OUT_DIR/"

echo "Created Arch package:"
echo "$OUT_DIR/$(basename "$pkg_file")"
