#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct CommandResult {
    success: bool,
    output: String,
    error: Option<String>,
}

#[tauri::command]
async fn execute_system_command(command: String, args: Vec<String>, sudo: Option<bool>) -> CommandResult {
    // Define allowed commands and their base arguments for security
    let allowed_commands = vec![
        "systemctl", "ps", "df", "lsblk", "uname", "lsmod", "journalctl", "ip", 
        "apt-get", "apt-cache", "apt", "dnf", "pacman", "free", "uptime", "hostnamectl", "lscpu", "lsusb", "lspci",
        "dpkg", "flatpak", "rm", "cat", "ls", "grep", "find", "sh", "bash", "pkexec", "zypper", "nala", "xdg-open"
    ];

    if !allowed_commands.contains(&command.as_str()) {
        return CommandResult {
            success: false,
            output: "".into(),
            error: Some(format!("Unauthorized command: {}", command)),
        };
    }

    let mut cmd = if sudo.unwrap_or(false) {
        let mut c = Command::new("pkexec");
        c.arg(&command);
        c
    } else {
        Command::new(&command)
    };

    match cmd.args(args).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            if output.status.success() {
                CommandResult {
                    success: true,
                    output: stdout,
                    error: None,
                }
            } else {
                CommandResult {
                    success: false,
                    output: stdout,
                    error: Some(stderr),
                }
            }
        }
        Err(e) => CommandResult {
            success: false,
            output: "".into(),
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn execute_multiple_commands(commands: Vec<String>, sudo: bool) -> Vec<CommandResult> {
    let mut results = Vec::new();
    
    if sudo {
        let joined_commands = commands.join(" && ");
        let output = Command::new("pkexec")
            .args(["bash", "-c", &joined_commands])
            .output();
            
        match output {
            Ok(out) => {
                results.push(CommandResult {
                    success: out.status.success(),
                    output: String::from_utf8_lossy(&out.stdout).to_string(),
                    error: Some(String::from_utf8_lossy(&out.stderr).to_string()),
                });
            }
            Err(e) => {
                results.push(CommandResult {
                    success: false,
                    output: "".into(),
                    error: Some(e.to_string()),
                });
            }
        }
    } else {
        for command_str in commands {
            let parts: Vec<&str> = command_str.split_whitespace().collect();
            if parts.is_empty() { continue; }
            let cmd_name = parts[0];
            let args = &parts[1..];
            
            let output = Command::new(cmd_name).args(args).output();
            match output {
                Ok(out) => {
                    results.push(CommandResult {
                        success: out.status.success(),
                        output: String::from_utf8_lossy(&out.stdout).to_string(),
                        error: Some(String::from_utf8_lossy(&out.stderr).to_string()),
                    });
                }
                Err(e) => {
                    results.push(CommandResult {
                        success: false,
                        output: "".into(),
                        error: Some(e.to_string()),
                    });
                }
            }
        }
    }
    
    results
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
                total = line.split_whitespace().nth(1).and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
            } else if line.starts_with("MemAvailable:") {
                available = line.split_whitespace().nth(1).and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
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
        stats["uptime"] = serde_json::json!(String::from_utf8_lossy(&output.stdout).trim().replace("up ", ""));
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
    if let Ok(output) = Command::new("df").arg("/").arg("--output=size,used,pcent").output() {
        let out = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = out.lines().collect();
        if lines.len() > 1 {
            let parts: Vec<&str> = lines[1].split_whitespace().collect();
            if parts.len() >= 3 {
                let total_kb: f64 = parts[0].parse().unwrap_or(0.0);
                let used_kb: f64 = parts[1].parse().unwrap_or(0.0);
                let percent: f64 = parts[2].replace("%", "").parse().unwrap_or(0.0);
                stats["disk"] = serde_json::json!(percent);
                stats["disk_total"] = serde_json::json!(format!("{:.1} GB", total_kb / 1024.0 / 1024.0));
                stats["disk_used"] = serde_json::json!(format!("{:.1} GB", used_kb / 1024.0 / 1024.0));
            }
        }
    }

    Ok(stats)
}

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
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
        execute_system_command, 
        execute_multiple_commands,
        get_detailed_stats, 
        open_url
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
