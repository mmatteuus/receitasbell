#!/usr/bin/env python3
import argparse
import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_CONFIG = {
    "poll_interval_seconds": 10,
    "heartbeat_stale_after_seconds": 900,
    "lock_timeout_seconds": 1200,
    "watchdog_interval_minutes": 15,
    "max_same_step_retries": 2,
    "executor_command": "[PENDENTE]",
    "pensante_command": "[PENDENTE]",
    "verificador_command": "[PENDENTE]",
}

DEFAULT_LOCK = {
    "locked": False,
    "owner": "ninguem",
    "step_id": None,
    "acquired_at": None,
    "expires_at": None,
}

DEFAULT_HEARTBEAT = {
    "last_actor": "ninguem",
    "last_seen_at": None,
    "current_trigger": None,
    "current_step_id": None,
}


def utc_now():
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def parse_yaml_top_level(path):
    data = {}
    if not path.exists():
        return data
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        stripped = line.lstrip()
        if stripped.startswith("#"):
            continue
        if line.startswith(" ") or line.startswith("\t"):
            continue
        if stripped.startswith("- "):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip()
    return data


def coerce_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def load_config(path):
    config = DEFAULT_CONFIG.copy()
    config.update(parse_yaml_top_level(path))
    config["poll_interval_seconds"] = coerce_int(
        config.get("poll_interval_seconds"), DEFAULT_CONFIG["poll_interval_seconds"]
    )
    config["heartbeat_stale_after_seconds"] = coerce_int(
        config.get("heartbeat_stale_after_seconds"),
        DEFAULT_CONFIG["heartbeat_stale_after_seconds"],
    )
    config["lock_timeout_seconds"] = coerce_int(
        config.get("lock_timeout_seconds"), DEFAULT_CONFIG["lock_timeout_seconds"]
    )
    config["watchdog_interval_minutes"] = coerce_int(
        config.get("watchdog_interval_minutes"),
        DEFAULT_CONFIG["watchdog_interval_minutes"],
    )
    config["max_same_step_retries"] = coerce_int(
        config.get("max_same_step_retries"), DEFAULT_CONFIG["max_same_step_retries"]
    )
    return config


def load_json(path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def write_json(path, payload):
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def append_event(path, message):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(message + "\n")


def parse_iso(ts):
    if not ts:
        return None
    value = ts
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(value).timestamp()
    except ValueError:
        return None


def acquire_lock(lock_path, owner, step_id, timeout_seconds):
    lock = load_json(lock_path, DEFAULT_LOCK.copy())
    now_iso = utc_now()
    now_ts = time.time()
    if lock.get("locked"):
        expires_at = parse_iso(lock.get("expires_at"))
        if expires_at and now_ts < expires_at:
            return False, lock
    lock = {
        "locked": True,
        "owner": owner,
        "step_id": step_id,
        "acquired_at": now_iso,
        "expires_at": datetime.fromtimestamp(now_ts + timeout_seconds, timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
    }
    write_json(lock_path, lock)
    return True, lock


def release_lock(lock_path):
    write_json(lock_path, DEFAULT_LOCK.copy())


def command_configured(value):
    if not value:
        return False
    trimmed = value.strip().strip('"').strip("'")
    return trimmed and trimmed != "[PENDENTE]"


def run_command(command):
    result = subprocess.run(command, shell=True)
    return result.returncode


def process_once(paths, config, last_signature):
    state = parse_yaml_top_level(paths["state"])
    trigger = state.get("current_trigger")
    owner = state.get("current_owner")
    step_id = state.get("current_step_id")
    signature = (trigger, owner, step_id)

    now_iso = utc_now()
    heartbeat = {
        "last_actor": owner or "ninguem",
        "last_seen_at": now_iso,
        "current_trigger": trigger,
        "current_step_id": step_id,
    }
    write_json(paths["heartbeat"], heartbeat)

    if signature != last_signature:
        append_event(
            paths["events"],
            f"{now_iso} STATE_OBSERVED trigger={trigger} owner={owner} step_id={step_id}",
        )

    if signature == last_signature:
        return signature

    if owner == "executor" and trigger == "READY_FOR_EXECUTOR":
        command = config.get("executor_command", "")
    elif owner == "pensante" and trigger == "EXECUTOR_DONE_AWAITING_REVIEW":
        command = config.get("pensante_command", "")
    elif owner == "verificador":
        command = config.get("verificador_command", "")
    else:
        return signature

    if not command_configured(command):
        append_event(
            paths["events"],
            f"{now_iso} COMMAND_NOT_CONFIGURED owner={owner} step_id={step_id}",
        )
        return signature

    acquired, lock = acquire_lock(
        paths["lock"], owner or "ninguem", step_id, config["lock_timeout_seconds"]
    )
    if not acquired:
        append_event(
            paths["events"],
            f"{now_iso} LOCK_HELD owner={lock.get('owner')} step_id={lock.get('step_id')}",
        )
        return signature

    append_event(
        paths["events"],
        f"{now_iso} LOCK_ACQUIRED owner={owner} step_id={step_id}",
    )
    exit_code = run_command(command)
    append_event(
        paths["events"],
        f"{utc_now()} COMMAND_EXIT owner={owner} step_id={step_id} code={exit_code}",
    )
    release_lock(paths["lock"])
    append_event(
        paths["events"],
        f"{utc_now()} LOCK_RELEASED owner={owner} step_id={step_id}",
    )
    return signature


def ensure_files(paths):
    paths["implantar"].mkdir(parents=True, exist_ok=True)
    if not paths["lock"].exists():
        write_json(paths["lock"], DEFAULT_LOCK.copy())
    if not paths["heartbeat"].exists():
        write_json(paths["heartbeat"], DEFAULT_HEARTBEAT.copy())
    if not paths["events"].exists():
        paths["events"].write_text("", encoding="utf-8")
    if not paths["config"].exists():
        lines = [
            "poll_interval_seconds: 10",
            "heartbeat_stale_after_seconds: 900",
            "lock_timeout_seconds: 1200",
            "watchdog_interval_minutes: 15",
            "max_same_step_retries: 2",
            "executor_command: \"[PENDENTE]\"",
            "pensante_command: \"[PENDENTE]\"",
            "verificador_command: \"[PENDENTE]\"",
            "",
        ]
        paths["config"].write_text("\n".join(lines), encoding="utf-8")


def build_paths(base_dir):
    implantar = base_dir / "IMPLANTAR"
    return {
        "implantar": implantar,
        "state": implantar / "ESTADO-ORQUESTRACAO.yaml",
        "lock": implantar / "LOCK.json",
        "heartbeat": implantar / "HEARTBEAT.json",
        "events": implantar / "EVENTOS.log",
        "config": implantar / "CONFIG-AUTOMACAO.yaml",
    }


def main():
    parser = argparse.ArgumentParser(description="Local agent orchestrator")
    parser.add_argument("--once", action="store_true", help="run one cycle and exit")
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=None,
        help="override poll interval seconds",
    )
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parents[1]
    paths = build_paths(base_dir)
    ensure_files(paths)
    config = load_config(paths["config"])

    poll_interval = args.poll_interval or config["poll_interval_seconds"]

    print("ORCHESTRATOR_START")
    print("ORCHESTRATOR_READY")

    last_signature = None
    last_state_mtime = None

    def tick():
        nonlocal last_signature, last_state_mtime
        if paths["state"].exists():
            state_mtime = paths["state"].stat().st_mtime
        else:
            state_mtime = None
        state_changed = state_mtime != last_state_mtime
        if state_changed:
            last_signature = process_once(paths, config, last_signature)
            last_state_mtime = state_mtime
        else:
            process_once(paths, config, last_signature)

    if args.once:
        tick()
        return

    while True:
        tick()
        time.sleep(poll_interval)


if __name__ == "__main__":
    main()
