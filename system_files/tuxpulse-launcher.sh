#!/bin/bash
# TuxPulse Launcher

# Start the backend server in the background if not already running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    node /usr/share/tuxpulse/server.js &
    sleep 2 # Give it a second to start
fi

# Open the browser
xdg-open http://localhost:3000
