# TuxPulse2 6.0.10

## Expanded Software Center

- The catalog now contains 276 apps. It covers all 200 distinct apps from Eoliann Windows Tools 2, with 154 new entries and 46 already represented in TuxPulse2.
- 51 new entries have a mapped Linux package or Flathub source. Examples include Chrome, Firefox ESR, KDE Connect, GitHub CLI, Neovim, and Nmap.
- Entries without an install source on the current distribution stay searchable and cannot be selected for installation.

## Installation fixes

- Install Selected uses the detected package manager on Debian-based, Arch-based, and Fedora-based distributions. It uses Flatpak when the selected app has no available native package and has a Flatpak source.
- Batch installation reports how many selected apps were installed successfully. Native package availability uses exact package names.

Availability depends on the distribution and configured repositories. Flatpak installs require Flathub.
