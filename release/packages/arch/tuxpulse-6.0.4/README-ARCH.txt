This directory contains a standard Arch Linux packaging layout for TuxPulse 6.0.4.

To build a real Arch package on Arch Linux or Manjaro:
  tar -xzf tuxpulse-6.0.4-arch-build.tar.gz
  cd tuxpulse-6.0.4
  makepkg -f

The generated package will be:
  tuxpulse-6.0.4-1-x86_64.pkg.tar.zst

Note:
  Binary Arch packages should be built with makepkg on an Arch-based system.
  Creating a .pkg.tar.zst manually on Linux Mint can produce packages that pacman
  reports as invalid or corrupted.
