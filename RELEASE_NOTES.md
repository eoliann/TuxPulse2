# TuxPulse 6.0.9

Security and DNS configuration update addressing issues #1–#6.

- Replace webview-controlled executable names, options and root shell strings with named operations validated in Rust. Remove both legacy command-execution IPC handlers. Enable a Content Security Policy and restrict external links to HTTPS.
- Remove automatic Spotify signing-key installation. The app opens Spotify's official Linux instructions without downloading or installing trust keys.
- Remove the unused Python root daemon, systemd service, deployment script and unpaired polkit policy. Packages no longer ship the policy.
- Protect the running kernel, tracking metapackages and newest backup kernel. Debian/Ubuntu removal requires an APT simulation, explicit confirmation and a fresh matching plan. Transactions that would remove additional packages are blocked.
- Update installed Debian kernel tracking packages (including HWE and other installed flavors), use full Arch system upgrades to preserve the installed flavor, and detect installed Fedora kernel flavors. Immutable and unsupported systems receive an explicit message. Update completion no longer claims a kernel was necessarily installed.
- Detect known DNS configurations from effective NetworkManager resolvers. Unknown, partial or mixed configurations remain System Default. Configure active connections by UUID and report failures instead of showing false success. Custom DNS overrides automatic IPv4/IPv6 resolvers; System Default restores both.

## Deliberate limits

Automatic package removal, autoremove and broad temporary-file deletion are unavailable in this release. Use distribution tools to review those changes. Kernel removal is supported on mutable Debian/Ubuntu systems only; Arch/Fedora kernel removal remains with distribution tools. Systems without an installed Debian kernel tracking metapackage use their vendor's updater. Keep the newest fallback kernel for recovery.

## Existing developer installations

If you previously ran `deploy_local.sh`, removing its files from this repository does not uninstall the manually deployed service. Review and run these commands on that Linux machine:

```sh
sudo systemctl disable --now tuxpulse-helper.service
sudo rm -f /etc/systemd/system/tuxpulse-helper.service
sudo rm -f /usr/local/bin/tuxpulse_helper_secure.py
sudo rm -f /usr/share/polkit-1/actions/com.eoliann.tuxpulse.policy
sudo systemctl daemon-reload
```

The desktop app uses per-operation administrator authentication and does not require a background root daemon.
