#!/bin/bash

# TuxPulse Local Deployment Script for Testing
# Run this on your Linux Mint machine to set up the helper and policies.

echo "--- TuxPulse Local Setup ---"

# 1. Install Helper
echo "[1/3] Installing Secure Helper..."
sudo cp system_files/tuxpulse_helper_secure.py /usr/local/bin/
sudo chmod 755 /usr/local/bin/tuxpulse_helper_secure.py

# 2. Install Systemd Service
echo "[2/3] Setting up Systemd Service..."
sudo cp system_files/tuxpulse-helper.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tuxpulse-helper.service

# 3. Install Polkit Policy
echo "[3/3] Installing Polkit Policy..."
sudo cp system_files/com.eoliann.tuxpulse.policy /usr/share/polkit-1/actions/

echo "--- Setup Complete ---"
echo "Helper status:"
sudo systemctl status tuxpulse-helper.service --no-pager
