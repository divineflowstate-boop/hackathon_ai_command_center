#!/usr/bin/env python3
"""
Seed Agent Control Bureau through the public /api/ingest endpoint.
No DB dependency; works anywhere Spring Boot is running.

Examples:
  python scripts/seed_dummy_dataset.py
  python scripts/seed_dummy_dataset.py --api http://localhost:8080/api/ingest --scenario full_demo
  python scripts/seed_dummy_dataset.py --scenario threat
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GENERATOR = os.path.join(BASE_DIR, "generate_dummy_logs.py")
LOG_DIR = os.path.join(BASE_DIR, "generated_logs")


def ensure_logs():
    subprocess.check_call([sys.executable, GENERATOR])


def read_logs(scenario):
    path = os.path.join(LOG_DIR, f"{scenario}.log")
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def post(api, logs):
    data = json.dumps({"logs": logs}).encode("utf-8")
    req = urllib.request.Request(api, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as res:
        print(res.read().decode("utf-8"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default="http://localhost:8080/api/ingest")
    parser.add_argument("--scenario", default="full_demo", choices=["baseline", "threat", "auto_approved", "value", "full_demo"])
    args = parser.parse_args()
    ensure_logs()
    logs = read_logs(args.scenario)
    print(f"posting {len(logs)} logs to {args.api}")
    post(args.api, logs)


if __name__ == "__main__":
    main()
