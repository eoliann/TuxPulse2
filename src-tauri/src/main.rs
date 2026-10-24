#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::thread;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Deserialize)]
struct CommandResult {
    success: bool,
    output: String,
    error: Option<String>,
}

mod operations;
mod system_actions;

fn execute(program: &str, args: &[String], privileged: bool) -> CommandResult {
    let mut cmd = if privileged {
        let mut c = Command::new("/usr/bin/pkexec");
        c.arg(program);
        c
    } else {
        Command::new(program)
    };
    cmd.env("PATH", "/usr/sbin:/usr/bin:/sbin:/bin")
        .env("LC_ALL", "C");
    match cmd.args(args).output() {
        Ok(out) => CommandResult {
            success: out.status.success(),
            output: String::from_utf8_lossy(&out.stdout).into(),
            error: if out.status.success() {
                None
            } else {
                Some(String::from_utf8_lossy(&out.stderr).into())
            },
        },
        Err(e) => failure(e.to_string()),
    }
}

fn failure(error: String) -> CommandResult {
    CommandResult {
        success: false,
        output: String::new(),
        error: Some(error),
    }
}

#[tauri::command]
async fn execute_operation(operation: String, parameters: Vec<String>) -> CommandResult {
    match operations::resolve(&operation, &parameters) {
        Ok(op) => {
            if op.privileged && std::path::Path::new("/run/ostree-booted").exists() {
                return failure(
                    "Use your immutable distribution's system tools for this operation.".into(),
                );
            }
            execute(op.program, &op.args, op.privileged)
        }
        Err(e) => failure(e),
    }
}

#[derive(Clone, Serialize)]
struct MaintenanceOutputEvent {
    stream: String,
    line: String,
}

#[tauri::command]
async fn execute_full_maintenance_stream(profile: String, app_handle: AppHandle) -> CommandResult {
    let normalized = profile.to_lowercase();

    let script = match normalized.as_str() {
        "debian" => {
            r#"
set +e
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
if [ -e /run/ostree-booted ]; then echo "Immutable systems are not supported by this maintenance profile."; exit 1; fi
export DEBIAN_FRONTEND=noninteractive
errors=0

run_step() {
  label="$1"
  shift
  echo
  echo "==> ${label}"
  printf '$'
  printf ' %q' "$@"
  printf '\n'
  "$@"
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "[WARNING] ${label} failed with exit code ${status}"
    errors=1
  else
    echo "[OK] ${label}"
  fi
}

run_flatpak() {
  label="$1"
  shift
  if ! command -v flatpak >/dev/null 2>&1; then
    echo
    echo "==> ${label}"
    echo "[SKIPPED] flatpak is not installed on this system."
    return 0
  fi
  run_step "${label}" flatpak "$@"
}

echo "Running TuxPulse Full Maintenance profile: debian"
run_step "Update package database" apt-get update
run_step "Full system upgrade" env DEBIAN_FRONTEND=noninteractive apt-get full-upgrade -y
echo "[SKIPPED] Review autoremove in your package manager to protect boot kernels."
run_step "Clean APT cache" apt-get autoclean -y
run_flatpak "Repair Flatpak installation" repair
run_flatpak "Update Flatpak applications" update -y
run_flatpak "Remove unused Flatpak runtimes and applications" uninstall --unused -y

exit "$errors"
"#
        }
        "arch" => {
            r#"
set +e
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
if [ -e /run/ostree-booted ]; then echo "Immutable systems are not supported by this maintenance profile."; exit 1; fi
errors=0

run_step() {
  label="$1"
  shift
  echo
  echo "==> ${label}"
  printf '$'
  printf ' %q' "$@"
  printf '\n'
  "$@"
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "[WARNING] ${label} failed with exit code ${status}"
    errors=1
  else
    echo "[OK] ${label}"
  fi
}

run_flatpak() {
  label="$1"
  shift
  if ! command -v flatpak >/dev/null 2>&1; then
    echo
    echo "==> ${label}"
    echo "[SKIPPED] flatpak is not installed on this system."
    return 0
  fi
  run_step "${label}" flatpak "$@"
}

echo "Running TuxPulse Full Maintenance profile: arch"
run_step "Synchronize and upgrade packages" pacman -Syu --noconfirm
run_step "Clean pacman cache" pacman -Sc --noconfirm
run_flatpak "Repair Flatpak installation" repair
run_flatpak "Update Flatpak applications" update -y
run_flatpak "Remove unused Flatpak runtimes and applications" uninstall --unused -y

exit "$errors"
"#
        }
        "fedora" => {
            r#"
set +e
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
export LC_ALL=C
if [ -e /run/ostree-booted ]; then echo "Immutable systems are not supported by this maintenance profile."; exit 1; fi
errors=0

run_step() {
  label="$1"
  shift
  echo
  echo "==> ${label}"
  printf '$'
  printf ' %q' "$@"
  printf '\n'
  "$@"
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "[WARNING] ${label} failed with exit code ${status}"
    errors=1
  else
    echo "[OK] ${label}"
  fi
}

run_flatpak() {
  label="$1"
  shift
  if ! command -v flatpak >/dev/null 2>&1; then
    echo
    echo "==> ${label}"
    echo "[SKIPPED] flatpak is not installed on this system."
    return 0
  fi
  run_step "${label}" flatpak "$@"
}

echo "Running TuxPulse Full Maintenance profile: fedora"
run_step "Upgrade packages" dnf upgrade -y
echo "[SKIPPED] Review package removals in your distribution tools."
run_step "Clean DNF cache" dnf clean all
run_flatpak "Repair Flatpak installation" repair
run_flatpak "Update Flatpak applications" update -y
run_flatpak "Remove unused Flatpak runtimes and applications" uninstall --unused -y

exit "$errors"
"#
        }
        _ => {
            return CommandResult {
                success: false,
                output: "".into(),
                error: Some(format!("Unsupported maintenance profile: {}", profile)),
            };
        }
    };

    let mut child = match Command::new("/usr/bin/pkexec")
        .args(["/bin/bash", "--noprofile", "--norc", "-c", script])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(e) => {
            return CommandResult {
                success: false,
                output: "".into(),
                error: Some(e.to_string()),
            };
        }
    };

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let stdout_app = app_handle.clone();
    let stdout_handle = thread::spawn(move || {
        let mut collected = String::new();
        if let Some(stdout) = stdout {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                match line {
                    Ok(line) => {
                        let text = format!("{}\n", line);
                        collected.push_str(&text);
                        let _ = stdout_app.emit(
                            "tuxpulse://maintenance-output",
                            MaintenanceOutputEvent {
                                stream: "stdout".into(),
                                line: text,
                            },
                        );
                    }
                    Err(e) => {
                        let text = format!("[ERROR] Failed to read stdout: {}\n", e);
                        collected.push_str(&text);
                        let _ = stdout_app.emit(
                            "tuxpulse://maintenance-output",
                            MaintenanceOutputEvent {
                                stream: "stdout".into(),
                                line: text,
                            },
                        );
                    }
                }
            }
        }
        collected
    });

    let stderr_app = app_handle.clone();
    let stderr_handle = thread::spawn(move || {
        let mut collected = String::new();
        if let Some(stderr) = stderr {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                match line {
                    Ok(line) => {
                        let text = format!("{}\n", line);
                        collected.push_str(&text);
                        let _ = stderr_app.emit(
                            "tuxpulse://maintenance-output",
                            MaintenanceOutputEvent {
                                stream: "stderr".into(),
                                line: text,
                            },
                        );
                    }
                    Err(e) => {
                        let text = format!("[ERROR] Failed to read stderr: {}\n", e);
                        collected.push_str(&text);
                        let _ = stderr_app.emit(
                            "tuxpulse://maintenance-output",
                            MaintenanceOutputEvent {
                                stream: "stderr".into(),
                                line: text,
                            },
                        );
                    }
                }
            }
        }
        collected
    });

    let status = match child.wait() {
        Ok(status) => status,
        Err(e) => {
            return CommandResult {
                success: false,
                output: "".into(),
                error: Some(e.to_string()),
            };
        }
    };

    let stdout_text = stdout_handle.join().unwrap_or_default();
    let stderr_text = stderr_handle.join().unwrap_or_default();

    if status.success() {
        CommandResult {
            success: true,
            output: "".into(),
            error: None,
        }
    } else {
        let fallback = if stderr_text.trim().is_empty() {
            format!(
                "Full Maintenance finished with exit code {}.",
                status.code().unwrap_or(-1)
            )
        } else {
            stderr_text.clone()
        };

        CommandResult {
            success: false,
            output: if stdout_text.trim().is_empty() {
                "".into()
            } else {
                stdout_text
            },
            error: Some(fallback),
        }
    }
}

#[tauri::command]
async fn get_detailed_stats() -> Result<serde_json::Value, String> {
    let mut stats = serde_json::json!({
        "cpu": 0.0,
        "ram": 0.0,
        "disk": 0.0,
        "uptime": "",
        "load": [0.0, 0.0, 0.0],
        "battery": null
    });

    // RAM - Using /proc/meminfo for better performance
    if let Ok(output) = std::fs::read_to_string("/proc/meminfo") {
        let mut total = 0.0;
        let mut available = 0.0;
        for line in output.lines() {
            if line.starts_with("MemTotal:") {
                total = line
                    .split_whitespace()
                    .nth(1)
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
            } else if line.starts_with("MemAvailable:") {
                available = line
                    .split_whitespace()
                    .nth(1)
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
            }
        }
        if total > 0.0 {
            stats["ram"] = serde_json::json!(((total - available) / total * 100.0).round());
        }
    }

    // CPU - Using /proc/stat for much better performance than 'top'
    static mut PREV_IDLE: f64 = 0.0;
    static mut PREV_TOTAL: f64 = 0.0;

    if let Ok(output) = std::fs::read_to_string("/proc/stat") {
        if let Some(line) = output.lines().next() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 5 {
                let user: f64 = parts[1].parse().unwrap_or(0.0);
                let nice: f64 = parts[2].parse().unwrap_or(0.0);
                let system: f64 = parts[3].parse().unwrap_or(0.0);
                let idle: f64 = parts[4].parse().unwrap_or(0.0);
                let iowait: f64 = parts[5].parse().unwrap_or(0.0);
                let irq: f64 = parts[6].parse().unwrap_or(0.0);
                let softirq: f64 = parts[7].parse().unwrap_or(0.0);
                let steal: f64 = parts[8].parse().unwrap_or(0.0);

                let current_idle = idle + iowait;
                let current_non_idle = user + nice + system + irq + softirq + steal;
                let current_total = current_idle + current_non_idle;

                unsafe {
                    let total_diff = current_total - PREV_TOTAL;
                    let idle_diff = current_idle - PREV_IDLE;

                    if total_diff > 0.0 {
                        let cpu_usage = (total_diff - idle_diff) / total_diff * 100.0;
                        stats["cpu"] = serde_json::json!(cpu_usage.round());
                    }

                    PREV_TOTAL = current_total;
                    PREV_IDLE = current_idle;
                }
            }
        }
    }

    // Battery Detection
    let power_supply_path = "/sys/class/power_supply";
    if let Ok(entries) = std::fs::read_dir(power_supply_path) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("BAT") {
                let capacity_path = format!("{}/{}/capacity", power_supply_path, name);
                if let Ok(capacity) = std::fs::read_to_string(capacity_path) {
                    if let Ok(val) = capacity.trim().parse::<i32>() {
                        stats["battery"] = serde_json::json!(val);
                        break;
                    }
                }
            }
        }
    }

    // Uptime
    if let Ok(output) = Command::new("uptime").arg("-p").output() {
        stats["uptime"] = serde_json::json!(String::from_utf8_lossy(&output.stdout)
            .trim()
            .replace("up ", ""));
    }

    // Load Average
    if let Ok(output) = std::fs::read_to_string("/proc/loadavg") {
        let parts: Vec<&str> = output.split_whitespace().collect();
        if parts.len() >= 3 {
            stats["load"] = serde_json::json!([
                parts[0].parse::<f64>().unwrap_or(0.0),
                parts[1].parse::<f64>().unwrap_or(0.0),
                parts[2].parse::<f64>().unwrap_or(0.0)
            ]);
        }
    }

    // Disk Usage (Root /)
    if let Ok(output) = Command::new("df")
        .arg("/")
        .arg("--output=size,used,pcent")
        .output()
    {
        let out = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = out.lines().collect();
        if lines.len() > 1 {
            let parts: Vec<&str> = lines[1].split_whitespace().collect();
            if parts.len() >= 3 {
                let total_kb: f64 = parts[0].parse().unwrap_or(0.0);
                let used_kb: f64 = parts[1].parse().unwrap_or(0.0);
                let percent: f64 = parts[2].replace("%", "").parse().unwrap_or(0.0);
                stats["disk"] = serde_json::json!(percent);
                stats["disk_total"] =
                    serde_json::json!(format!("{:.1} GB", total_kb / 1024.0 / 1024.0));
                stats["disk_used"] =
                    serde_json::json!(format!("{:.1} GB", used_kb / 1024.0 / 1024.0));
            }
        }
    }

    Ok(stats)
}

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    if !url.starts_with("https://") || url.chars().any(|c| c.is_control()) {
        return Err("Only HTTPS links are allowed".into());
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            execute_operation,
            system_actions::configure_dns,
            system_actions::kernel_inventory,
            system_actions::update_kernel,
            system_actions::preview_kernel_removal,
            system_actions::remove_kernel,
            system_actions::autostart_files,
            execute_full_maintenance_stream,
            get_detailed_stats,
            open_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
