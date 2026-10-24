use crate::operations::concrete_kernel;
use crate::{execute, failure, CommandResult};
use serde::Serialize;
use std::path::Path;

fn run(program: &str, args: &[&str]) -> CommandResult {
    execute(
        program,
        &args.iter().map(|s| s.to_string()).collect::<Vec<_>>(),
        false,
    )
}

fn immutable() -> bool {
    Path::new("/run/ostree-booted").exists() || Path::new("/etc/NIXOS").exists()
}

#[derive(Serialize)]
pub struct Kernel {
    name: String,
    version: String,
    release: String,
}
#[derive(Serialize)]
pub struct Inventory {
    pub kernels: Vec<Kernel>,
    pub message: String,
}

fn installed_kernels() -> Result<(String, Vec<Kernel>), String> {
    let current = run("/usr/bin/uname", &["-r"]);
    let packages = run(
        "/usr/bin/dpkg-query",
        &[
            "-W",
            "-f=${db:Status-Abbrev} ${Package} ${Version}\n",
            "linux-image-*",
        ],
    );
    if !current.success || !packages.success {
        return Err(
            "Kernel removal is available only on mutable Debian/Ubuntu systems with dpkg.".into(),
        );
    }
    let kernels = packages
        .output
        .lines()
        .filter_map(|line| {
            let p: Vec<_> = line.split_whitespace().collect();
            if p.len() != 3 || p[0] != "ii" || !concrete_kernel(p[1]) {
                return None;
            }
            let release = p[1]
                .strip_prefix("linux-image-unsigned-")
                .or_else(|| p[1].strip_prefix("linux-image-"))?;
            Some(Kernel {
                name: p[1].into(),
                version: p[2].into(),
                release: release.into(),
            })
        })
        .collect();
    Ok((current.output.trim().into(), kernels))
}

fn removable(name: &str) -> Result<(), String> {
    if immutable() || !concrete_kernel(name) {
        return Err("This kernel package cannot be removed.".into());
    }
    let (current, kernels) = installed_kernels()?;
    let target = kernels
        .iter()
        .find(|k| k.name == name)
        .ok_or("Kernel is not installed")?;
    if target.release == current {
        return Err("The running kernel is protected.".into());
    }
    if !kernels
        .iter()
        .any(|k| k.release == current && Path::new(&format!("/boot/vmlinuz-{}", current)).is_file())
    {
        return Err("Cannot verify the installed running kernel image; removal blocked.".into());
    }
    // Keep the newest installed fallback, compared using Debian version ordering.
    let mut backups: Vec<&Kernel> = kernels.iter().filter(|k| k.release != current).collect();
    backups.sort_by(|a, b| {
        if run(
            "/usr/bin/dpkg",
            &["--compare-versions", &a.version, "lt", &b.version],
        )
        .success
        {
            std::cmp::Ordering::Less
        } else if a.version == b.version {
            std::cmp::Ordering::Equal
        } else {
            std::cmp::Ordering::Greater
        }
    });
    if backups.last().map(|k| k.release.as_str()) == Some(target.release.as_str()) {
        return Err("The newest backup kernel is protected. Keep it for recovery.".into());
    }
    Ok(())
}

#[tauri::command]
pub async fn kernel_inventory() -> Inventory {
    if immutable() {
        return Inventory {
            kernels: vec![],
            message: "Kernel changes are managed by your immutable distribution.".into(),
        };
    }
    match installed_kernels() {
        Ok((_, kernels)) => Inventory { kernels: kernels.into_iter().filter(|k| removable(&k.name).is_ok()).collect(), message: "Running and newest backup kernels are protected. Removal on Arch/Fedora is managed by distribution tools.".into() },
        Err(message) => Inventory { kernels: vec![], message },
    }
}

fn removal_plan(name: &str) -> CommandResult {
    if let Err(e) = removable(name) {
        return failure(e);
    }
    let plan = run("/usr/bin/apt-get", &["--simulate", "purge", "--", name]);
    if !plan.success {
        return plan;
    }
    if !crate::operations::safe_kernel_plan(name, &plan.output) {
        return failure("APT would remove additional packages, or nothing. Review this change in your package manager.".into());
    }
    plan
}

#[tauri::command]
pub async fn preview_kernel_removal(name: String) -> CommandResult {
    removal_plan(&name)
}

#[tauri::command]
pub async fn remove_kernel(name: String, expected_plan: String) -> CommandResult {
    let plan = removal_plan(&name);
    if !plan.success {
        return plan;
    }
    if plan.output != expected_plan {
        return failure("Package state changed. Review a fresh removal plan.".into());
    }
    execute(
        "/usr/bin/apt-get",
        &["purge".into(), "-y".into(), "--".into(), name],
        true,
    )
}

#[tauri::command]
pub async fn update_kernel() -> CommandResult {
    if immutable() {
        return failure(
            "Use rpm-ostree or your distribution's kernel update tool on immutable systems.".into(),
        );
    }
    if Path::new("/usr/bin/dpkg-query").exists() {
        let packages = run(
            "/usr/bin/dpkg-query",
            &["-W", "-f=${db:Status-Abbrev} ${Package}\n", "linux-image-*"],
        );
        if !packages.success {
            return packages;
        }
        let metas: Vec<String> = packages
            .output
            .lines()
            .filter_map(|line| {
                let p: Vec<_> = line.split_whitespace().collect();
                if p.len() == 2
                    && p[0] == "ii"
                    && p[1].starts_with("linux-image-")
                    && !concrete_kernel(p[1])
                    && p[1]
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b".-+".contains(&b))
                {
                    Some(p[1].to_string())
                } else {
                    None
                }
            })
            .collect();
        if metas.is_empty() {
            return failure("No installed kernel tracking metapackage found. Use your kernel vendor's updater; no stock kernel was installed.".into());
        }
        let mut args: Vec<String> = ["install", "--only-upgrade", "--no-remove", "-y", "--"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        args.extend(metas);
        execute("/usr/bin/apt-get", &args, true)
    } else if Path::new("/usr/bin/pacman").exists() {
        // Arch partial upgrades are unsupported. A full upgrade preserves the
        // user's installed linux/linux-lts/linux-zen/custom kernel selection.
        execute(
            "/usr/bin/pacman",
            &["-Syu".into(), "--noconfirm".into()],
            true,
        )
    } else if Path::new("/usr/bin/dnf").exists() {
        let packages = run(
            "/usr/bin/rpm",
            &[
                "-q",
                "--qf",
                "%{NAME}\n",
                "kernel",
                "kernel-core",
                "kernel-rt",
                "kernel-debug",
            ],
        );
        let mut args: Vec<String> = ["upgrade", "-y", "--"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        args.extend(
            packages
                .output
                .lines()
                .filter(|s| ["kernel", "kernel-core", "kernel-rt", "kernel-debug"].contains(s))
                .map(str::to_string),
        );
        if args.len() == 3 {
            return failure("No supported installed Fedora kernel flavor found.".into());
        }
        execute("/usr/bin/dnf", &args, true)
    } else {
        failure("Kernel updates are unavailable on this distribution. Use your distribution's kernel tools.".into())
    }
}

#[tauri::command]
pub async fn configure_dns(provider: String) -> CommandResult {
    let servers = match provider.as_str() {
        "default" => "",
        "cloudflare" => "1.1.1.1 1.0.0.1",
        "google" => "8.8.8.8 8.8.4.4",
        "opendns" => "208.67.222.222 208.67.220.220",
        "quad9" => "9.9.9.9 149.112.112.112",
        "adguard" => "94.140.14.14 94.140.15.15",
        _ => return failure("Unknown DNS provider".into()),
    };
    let connections = run(
        "/usr/bin/nmcli",
        &["-t", "-f", "UUID,TYPE,STATE", "con", "show", "--active"],
    );
    if !connections.success {
        return connections;
    }
    let mut output = String::new();
    for line in connections.output.lines() {
        let parts: Vec<_> = line.split(':').collect();
        if parts.len() != 3
            || !["802-3-ethernet", "802-11-wireless", "ethernet", "wifi"].contains(&parts[1])
        {
            continue;
        }
        let uuid = parts[0];
        if uuid.len() != 36 || !uuid.bytes().all(|b| b.is_ascii_hexdigit() || b == b'-') {
            return failure("Invalid connection UUID".into());
        }
        let result = execute(
            "/usr/bin/nmcli",
            &[
                "con".into(),
                "mod".into(),
                "uuid".into(),
                uuid.into(),
                "ipv4.dns".into(),
                servers.into(),
                "ipv4.ignore-auto-dns".into(),
                if servers.is_empty() { "no" } else { "yes" }.into(),
                "ipv6.dns".into(),
                "".into(),
                "ipv6.ignore-auto-dns".into(),
                if servers.is_empty() { "no" } else { "yes" }.into(),
            ],
            true,
        );
        if !result.success {
            return result;
        }
        let result = execute(
            "/usr/bin/nmcli",
            &["con".into(), "up".into(), "uuid".into(), uuid.into()],
            true,
        );
        if !result.success {
            return result;
        }
        output.push_str(&format!("DNS configured for {}\n", uuid));
    }
    if output.is_empty() {
        failure("No active Ethernet or Wi-Fi connections were found.".into())
    } else {
        CommandResult {
            success: true,
            output,
            error: None,
        }
    }
}

#[tauri::command]
pub async fn autostart_files() -> CommandResult {
    let mut files = Vec::new();
    let mut dirs = vec![std::path::PathBuf::from("/etc/xdg/autostart")];
    if let Some(home) = std::env::var_os("HOME") {
        dirs.push(std::path::PathBuf::from(home).join(".config/autostart"));
    }
    for dir in dirs {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.ends_with(".desktop") {
                        files.push(name.to_string());
                    }
                }
            }
        }
    }
    CommandResult {
        success: true,
        output: files.join("\n"),
        error: None,
    }
}
