#!/usr/bin/env python3
"""
Agent Control Bureau port ingestor.
Reads newline logs from a TCP port in 30 second batches and posts to Spring Boot /api/ingest.

Usage:
  python port_ingestor.py --port 9900 --api http://localhost:8080/api/ingest --batch-seconds 30
"""
import argparse, socket, time, json, urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--host', default='127.0.0.1')
parser.add_argument('--port', type=int, default=9900)
parser.add_argument('--api', default='http://localhost:8080/api/ingest')
parser.add_argument('--batch-seconds', type=int, default=30)
args = parser.parse_args()

buf = []
last = time.time()

def flush():
    global buf, last
    if not buf:
        last = time.time(); return
    data = json.dumps({'logs': buf}).encode('utf-8')
    req = urllib.request.Request(args.api, data=data, headers={'Content-Type':'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            print('POSTED', len(buf), r.read().decode('utf-8'))
    except Exception as e:
        print('POST FAILED', e)
    buf = []
    last = time.time()

print(f'Listening on {args.host}:{args.port}, posting to {args.api}')
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((args.host, args.port))
    s.listen(5)
    s.settimeout(1)
    while True:
        try:
            conn, addr = s.accept()
            with conn:
                conn.settimeout(1)
                data = b''
                while True:
                    try:
                        chunk = conn.recv(4096)
                        if not chunk: break
                        data += chunk
                    except socket.timeout:
                        break
                for line in data.decode('utf-8', errors='ignore').splitlines():
                    if line.strip():
                        print('LOG', line.strip())
                        buf.append(line.strip())
        except socket.timeout:
            pass
        if time.time() - last >= args.batch_seconds:
            flush()
