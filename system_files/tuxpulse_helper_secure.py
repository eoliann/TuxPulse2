import os
import socket
import subprocess
import json
import syslog
import stat
import shutil

# Secure TuxPulse Helper - Multi-Distro Version
SOCKET_PATH = "/run/tuxpulse.sock"

def get_package_manager():
    if shutil.which("apt-get"):
        return "apt"
    elif shutil.which("dnf"):
        return "dnf"
    elif shutil.which("pacman"):
        return "pacman"
    elif shutil.which("zypper"):
        return "zypper"
    return "unknown"

PM = get_package_manager()

# Distro-agnostic command mapping
PM_COMMANDS = {
    "apt": {
        "update": ["apt-get", "update"],
        "upgrade": ["apt-get", "upgrade", "-y"],
        "cleanup": ["apt-get", "autoremove", "-y"],
        "list": ["dpkg", "--get-selections"]
    },
    "dnf": {
        "update": ["dnf", "check-update"],
        "upgrade": ["dnf", "upgrade", "-y"],
        "cleanup": ["dnf", "autoremove", "-y"],
        "list": ["rpm", "-qa"]
    },
    "pacman": {
        "update": ["pacman", "-Sy"],
        "upgrade": ["pacman", "-Syu", "--noconfirm"],
        "cleanup": ["pacman", "-Rns", "$(pacman -Qtdq)", "--noconfirm"],
        "list": ["pacman", "-Q"]
    }
}

ALLOWED_COMMANDS = {
    "status": ["systemctl", "status", "tuxpulse-helper.service"],
    "list_services": ["systemctl", "list-units", "--type=service", "--state=running", "--no-pager"],
    "top_processes": ["ps", "aux", "--sort=-%cpu"],
    "disk_usage": ["df", "-h"],
    "disk_partitions": ["lsblk", "-f"],
    "kernel_info": ["uname", "-a"],
    "kernel_modules": ["lsmod"],
    "startup_apps": ["systemctl", "list-unit-files", "--type=service", "--state=enabled"],
    "logs": ["journalctl", "-n", "50", "--no-pager"],
    "network_stats": ["ip", "-s", "link"]
}

# Add PM specific commands if detected
if PM in PM_COMMANDS:
    ALLOWED_COMMANDS["update"] = PM_COMMANDS[PM]["update"]
    ALLOWED_COMMANDS["upgrade"] = PM_COMMANDS[PM]["upgrade"]
    ALLOWED_COMMANDS["cleanup"] = PM_COMMANDS[PM]["cleanup"]
    ALLOWED_COMMANDS["list_packages"] = PM_COMMANDS[PM]["list"]

def log(message):
    syslog.syslog(syslog.LOG_INFO, f"TuxPulseHelper: {message}")

def handle_client(client_sock):
    try:
        # Get peer credentials (UID, GID, PID)
        creds = client_sock.getsockopt(socket.SOL_SOCKET, socket.SO_PEERCRED, 12)
        pid, uid, gid = struct.unpack("3i", creds)
        
        # In a real scenario, we'd check if UID is allowed or if the user is in a specific group.
        # For this fix, we'll log the user and enforce strict command validation.
        log(f"Connection from UID {uid}")

        data = client_sock.recv(1024).decode('utf-8')
        if not data:
            return

        request = json.loads(data)
        cmd_key = request.get("command")
        
        if cmd_key in ALLOWED_COMMANDS:
            log(f"Executing allowed command: {cmd_key} for UID {uid}")
            result = subprocess.run(ALLOWED_COMMANDS[cmd_key], capture_output=True, text=True)
            response = {"status": "success", "output": result.stdout, "error": result.stderr}
        else:
            log(f"Unauthorized command attempt: {cmd_key} from UID {uid}")
            response = {"status": "error", "message": "Unauthorized command"}

        client_sock.sendall(json.dumps(response).encode('utf-8'))
    except Exception as e:
        log(f"Error handling client: {e}")
    finally:
        client_sock.close()

def main():
    if os.path.exists(SOCKET_PATH):
        os.remove(SOCKET_PATH)

    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.bind(SOCKET_PATH)
    
    # Secure the socket: Only root and members of the 'tuxpulse' group can connect
    # If the group doesn't exist, we might default to 0660 and root:root
    os.chmod(SOCKET_PATH, 0o660)
    
    server.listen(5)
    log("TuxPulse Secure Helper started")

    try:
        while True:
            client, _ = server.accept()
            handle_client(client)
    except KeyboardInterrupt:
        pass
    finally:
        os.remove(SOCKET_PATH)

if __name__ == "__main__":
    import struct
    main()
