// IPC accepts named operations, never executable paths, shell programs or options.
#[derive(Debug, PartialEq)]
pub struct Operation {
    pub program: &'static str,
    pub args: Vec<String>,
    pub privileged: bool,
}

fn identifier(value: &str) -> bool {
    !value.is_empty()
        && value.len() < 200
        && value.as_bytes()[0].is_ascii_alphanumeric()
        && value
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"._+-".contains(&c))
}

pub fn resolve(name: &str, values: &[String]) -> Result<Operation, String> {
    let fixed = |program, args: &[&str], privileged| Operation {
        program,
        args: args.iter().map(|s| s.to_string()).collect(),
        privileged,
    };
    let no_values = match name {
        "system.uname" => Some(fixed("/usr/bin/uname", &["-a"], false)),
        "system.host" => Some(fixed("/usr/bin/hostnamectl", &[], false)),
        "system.os" => Some(fixed("/usr/bin/cat", &["/etc/os-release"], false)),
        "system.cpu" => Some(fixed("/usr/bin/lscpu", &[], false)),
        "system.usb" => Some(fixed("/usr/bin/lsusb", &[], false)),
        "system.pci" => Some(fixed("/usr/bin/lspci", &[], false)),
        "system.processes" => Some(fixed("/usr/bin/ps", &["aux"], false)),
        "system.disk" => Some(fixed("/usr/bin/df", &["-h"], false)),
        "network.addresses" => Some(fixed("/usr/bin/ip", &["addr"], false)),
        "network.routes" => Some(fixed("/usr/bin/ip", &["route"], false)),
        "network.connections" => Some(fixed(
            "/usr/bin/nmcli",
            &["-t", "-f", "UUID,TYPE,STATE", "con", "show", "--active"],
            false,
        )),
        "network.dns" => Some(fixed(
            "/usr/bin/nmcli",
            &[
                "-t",
                "-f",
                "GENERAL.DEVICE,IP4.DNS,IP6.DNS",
                "device",
                "show",
            ],
            false,
        )),
        "services.list" => Some(fixed(
            "/usr/bin/systemctl",
            &["list-units", "--type=service", "--all", "--no-pager"],
            false,
        )),
        "services.startup" => Some(fixed(
            "/usr/bin/systemctl",
            &["list-unit-files", "--type=service", "--state=enabled"],
            false,
        )),
        "logs.recent" => Some(fixed(
            "/usr/bin/journalctl",
            &["-n", "20", "--no-pager"],
            false,
        )),
        "logs.errors" => Some(fixed(
            "/usr/bin/journalctl",
            &["-p", "3", "-n", "50"],
            false,
        )),
        "logs.clean" => Some(fixed("/usr/bin/journalctl", &["--vacuum-time=7d"], true)),
        "audit.ports" => Some(fixed("/usr/bin/netstat", &["-tuln"], false)),
        "audit.files" => Some(fixed(
            "/usr/bin/find",
            &["/etc", "-maxdepth", "2", "-perm", "-0002", "-type", "f"],
            false,
        )),
        "audit.ssh" => Some(fixed(
            "/usr/bin/grep",
            &["PermitRootLogin", "/etc/ssh/sshd_config"],
            false,
        )),
        "apt.list" => Some(fixed("/usr/bin/dpkg", &["-l"], false)),
        "apt.refresh" => Some(fixed("/usr/bin/apt-get", &["update"], true)),
        "apt.upgrade" => Some(fixed("/usr/bin/apt-get", &["upgrade", "-y"], true)),
        "apt.clean" => Some(fixed("/usr/bin/apt-get", &["autoclean"], true)),
        "arch.list" => Some(fixed("/usr/bin/pacman", &["-Q"], false)),
        "arch.clean" => Some(fixed("/usr/bin/pacman", &["-Sc", "--noconfirm"], true)),
        "rpm.list" => Some(fixed("/usr/bin/rpm", &["-qa"], false)),
        "suse.list" => Some(fixed("/usr/bin/zypper", &["se", "--installed-only"], false)),
        "dnf.clean" => Some(fixed("/usr/bin/dnf", &["clean", "all"], true)),
        "flatpak.list" => Some(fixed(
            "/usr/bin/flatpak",
            &["list", "--columns=application"],
            false,
        )),
        "flatpak.update" => Some(fixed("/usr/bin/flatpak", &["update", "-y"], false)),
        _ => None,
    };
    if let Some(op) = no_values {
        return if values.is_empty() {
            Ok(op)
        } else {
            Err("Operation takes no parameters".into())
        };
    }
    if values.is_empty() || !values.iter().all(|s| identifier(s)) {
        return Err("Invalid operation parameters".into());
    }
    let mut op = match name {
        "apt.info" => fixed("/usr/bin/apt-cache", &["show"], false),
        "arch.info" => fixed("/usr/bin/pacman", &["-Si"], false),
        "dnf.info" => fixed("/usr/bin/dnf", &["info"], false),
        "apt.install" if values.len() == 1 => {
            fixed("/usr/bin/apt-get", &["install", "-y", "--"], true)
        }
        "arch.install" if values.len() == 1 => {
            fixed("/usr/bin/pacman", &["-S", "--noconfirm", "--"], true)
        }
        "dnf.install" if values.len() == 1 => fixed("/usr/bin/dnf", &["install", "-y", "--"], true),
        "flatpak.install" if values.len() == 1 => {
            fixed("/usr/bin/flatpak", &["install", "-y", "flathub"], false)
        }
        "flatpak.remove" if values.len() == 1 => {
            fixed("/usr/bin/flatpak", &["uninstall", "-y"], false)
        }
        // Package removal requires distribution tools to review dependency changes.
        "apt.remove" | "arch.remove" | "dnf.remove" => {
            return Err("Use your distribution package manager to review package removals.".into())
        }
        "service.start" | "service.stop" | "service.restart" | "service.enable"
        | "service.disable"
            if values.len() == 1 && values[0].ends_with(".service") =>
        {
            fixed(
                "/usr/bin/systemctl",
                &[name.strip_prefix("service.").unwrap(), "--"],
                true,
            )
        }
        "process.kill"
            if values.len() == 1 && values[0].parse::<u32>().map(|n| n > 1).unwrap_or(false) =>
        {
            fixed("/usr/bin/kill", &["-9", "--"], false)
        }
        _ => return Err("Unsupported operation".into()),
    };
    op.args.extend_from_slice(values);
    Ok(op)
}

pub fn concrete_kernel(name: &str) -> bool {
    let name = name.split(':').next().unwrap_or("");
    let release = name
        .strip_prefix("linux-image-unsigned-")
        .or_else(|| name.strip_prefix("linux-image-"));
    release
        .map(|s| identifier(s) && s.as_bytes()[0].is_ascii_digit() && s.contains('.'))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_command_and_option_injection() {
        for name in ["sh", "bash", "pkexec", "rm", "execute_multiple_commands"] {
            assert!(resolve(name, &["-c".into(), "id".into()]).is_err());
        }
        for value in [
            "-oAPT::Update::Pre-Invoke::=id",
            "foo;id",
            "/tmp/evil.deb",
            "$(id)",
            "--help",
            "foo\nbar",
        ] {
            assert!(resolve("apt.install", &[value.into()]).is_err());
        }
        assert!(resolve("system.uname", &["--help".into()]).is_err());
        assert!(resolve("service.start", &["evil.socket".into()]).is_err());
        assert!(resolve("apt.remove", &["linux-image-generic".into()]).is_err());
    }
    #[test]
    fn maps_operations_to_fixed_programs_and_privileges() {
        let op = resolve("apt.install", &["firefox".into()]).unwrap();
        assert_eq!(op.program, "/usr/bin/apt-get");
        assert_eq!(op.args, ["install", "-y", "--", "firefox"]);
        assert!(op.privileged);
        assert!(!resolve("system.os", &[]).unwrap().privileged);
    }
    #[test]
    fn rejects_kernel_metapackages() {
        for name in [
            "linux-image-generic",
            "linux-image-amd64",
            "linux-image-generic-hwe-24.04",
            "linux-image-oem",
            "linux-image-virtual",
            "other-6.8",
        ] {
            assert!(!concrete_kernel(name));
        }
        assert!(concrete_kernel("linux-image-6.8.0-47-generic"));
        assert!(concrete_kernel("linux-image-unsigned-6.8.0-47-generic"));
    }
}
