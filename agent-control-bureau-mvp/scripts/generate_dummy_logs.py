#!/usr/bin/env python3
"""
Generate Agent Control Bureau dummy runtime logs.

Creates scenario logs under scripts/generated_logs/ and can optionally stream them to the TCP
port read by ingestion/port_ingestor.py.

Examples:
  python scripts/generate_dummy_logs.py
  python scripts/generate_dummy_logs.py --stream --port 9900 --scenario threat
  python scripts/generate_dummy_logs.py --stream --port 9900 --scenario auto_approved
  python scripts/generate_dummy_logs.py --stream --port 9900 --scenario full_demo --delay 1
"""
import argparse
import os
import socket
import time
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, "generated_logs")


def ts():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def line(event, **fields):
    parts = [f"ts={ts()}", f"event={event}"]
    for key, value in fields.items():
        if value is None:
            continue
        value = str(value)
        if " " in value or ":" in value or "/" in value:
            parts.append(f'{key}="{value}"')
        else:
            parts.append(f"{key}={value}")
    return " ".join(parts)


def baseline_logs():
    return [
        line("AGENT_START", agent="Recon Investigator", lob="CIB", team="IRECS-Recon", model="Claude-Sonnet", useCase="UC-RECON-001", pid=4321, port=9101, prompt="Investigate reconciliation breaks and explain root cause"),
        line("TOOL_CALL", agent="Recon Investigator", lob="CIB", team="IRECS-Recon", model="Claude-Sonnet", tool="athena.query", role="READ", desc="Query approved data lake tables", tokensIn=940, tokensOut=380, cost=0.026),
        line("TOOL_CALL", agent="Recon Investigator", lob="CIB", team="IRECS-Recon", model="Claude-Sonnet", tool="s3.read", role="READ", desc="Read governed S3 datasets", tokensIn=610, tokensOut=240, cost=0.014),
        line("AGENT_START", agent="KYC Review Agent", lob="CB", team="KYC-Ops", model="GPT-4.1", useCase="UC-KYC-021", pid=4322, port=9102, prompt="Review KYC exceptions and summarize missing evidence"),
        line("TOOL_CALL", agent="KYC Review Agent", lob="CB", team="KYC-Ops", model="GPT-4.1", tool="athena.query", role="READ", desc="Query approved data lake tables", tokensIn=750, tokensOut=280, cost=0.030),
        line("TOOL_CALL", agent="KYC Review Agent", lob="CB", team="KYC-Ops", model="GPT-4.1", tool="jira.createIssue", role="WRITE", desc="Create operational Jira tickets", tokensIn=420, tokensOut=190, cost=0.017),
    ]


def threat_logs():
    return [
        line("AGENT_START", agent="Shadow PII Export Agent", lob="CIB", team="Unknown-Lab", model="Claude-Sonnet", useCase="UC-SHADOW-999", pid=98765, port=9199, prompt="Extract client PII and export full records to local file"),
        line("TOOL_CALL", agent="Shadow PII Export Agent", lob="CIB", team="Unknown-Lab", model="Claude-Sonnet", tool="clientpii.export", role="WRITE", desc="Export sensitive client PII records", tokensIn=1850, tokensOut=920, cost=0.067),
        line("TOOL_CALL", agent="Shadow PII Export Agent", lob="CIB", team="Unknown-Lab", model="Claude-Sonnet", tool="local.file.write", role="WRITE", desc="Write data outside governed store", tokensIn=1200, tokensOut=550, cost=0.043),
    ]


def auto_approved_logs():
    return [
        line("AGENT_START", agent="Settlement Break Assistant", lob="CIB", team="Settlements-Tech", model="Claude-Haiku", useCase="UC-SETTLE-011", pid=98811, port=9201, prompt="Investigate settlement breaks using approved read-only tools"),
        line("TOOL_CALL", agent="Settlement Break Assistant", lob="CIB", team="Settlements-Tech", model="Claude-Haiku", tool="athena.query", role="READ", desc="Query approved data lake tables", tokensIn=1320, tokensOut=410, cost=0.021),
        line("TOOL_CALL", agent="Settlement Break Assistant", lob="CIB", team="Settlements-Tech", model="Claude-Haiku", tool="s3.read", role="READ", desc="Read governed S3 datasets", tokensIn=860, tokensOut=290, cost=0.013),
        line("TOOL_CALL", agent="Settlement Break Assistant", lob="CIB", team="Settlements-Tech", model="Claude-Haiku", tool="iceberg.scan", role="READ", desc="Scan governed Iceberg tables", tokensIn=1420, tokensOut=510, cost=0.025),
    ]


def value_logs():
    agents = [
        ("Payment Ops Agent", "CB", "Payments-Ops", "GPT-4.1-mini", "UC-PAY-034", "athena.query", 6800, 2100, 0.144),
        ("Fraud Signal Agent", "CCB", "Fraud-Analytics", "Claude-Haiku", "UC-FRAUD-008", "athena.query", 9200, 3400, 0.192),
        ("Market Risk Explainer", "AWM", "Risk-Tech", "Claude-Sonnet", "UC-RISK-044", "s3.read", 4800, 1800, 0.118),
        ("Data Quality Sentinel", "CIB", "Data-Platform", "Llama-3.1", "UC-DQ-017", "iceberg.scan", 3600, 1200, 0.044),
        ("Ops Ticket Drafter", "CCB", "Servicing-Tech", "GPT-4.1-mini", "UC-OPS-002", "jira.createIssue", 2500, 900, 0.052),
    ]
    rows = []
    for name, lob, team, model, uc, tool, tin, tout, cost in agents:
        pid = abs(hash(name)) % 50000 + 30000
        port = abs(hash(name)) % 1000 + 9300
        rows.append(line("AGENT_START", agent=name, lob=lob, team=team, model=model, useCase=uc, pid=pid, port=port, prompt=f"Operate as {name} for {team}"))
        for i in range(3):
            rows.append(line("TOOL_CALL", agent=name, lob=lob, team=team, model=model, tool=tool, role="READ" if not tool.startswith("jira") else "WRITE", desc="Approved enterprise tool", tokensIn=tin+i*110, tokensOut=tout+i*50, cost=round(cost+i*0.009, 4)))
    return rows


SCENARIOS = {
    "baseline": baseline_logs,
    "threat": threat_logs,
    "auto_approved": auto_approved_logs,
    "value": value_logs,
    "full_demo": lambda: baseline_logs() + threat_logs() + auto_approved_logs() + value_logs(),
}


def write_files():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, factory in SCENARIOS.items():
        path = os.path.join(OUT_DIR, f"{name}.log")
        with open(path, "w", encoding="utf-8") as f:
            f.write("\n".join(factory()) + "\n")
        print(f"wrote {path}")


def stream_logs(lines, host, port, delay):
    for row in lines:
        with socket.create_connection((host, port), timeout=5) as s:
            s.sendall((row + "\n").encode("utf-8"))
        print("sent", row)
        if delay:
            time.sleep(delay)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", choices=SCENARIOS.keys(), default="full_demo")
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9900)
    parser.add_argument("--delay", type=float, default=0.2)
    args = parser.parse_args()
    write_files()
    if args.stream:
        stream_logs(SCENARIOS[args.scenario](), args.host, args.port, args.delay)


if __name__ == "__main__":
    main()
