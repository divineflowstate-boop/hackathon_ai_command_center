#!/usr/bin/env python3
"""Sends demo agent logs to the ingestion TCP port."""
import socket, sys, os, time
host='127.0.0.1'; port=int(sys.argv[1]) if len(sys.argv)>1 else 9900
scenario=sys.argv[2] if len(sys.argv)>2 else 'threat'
pid=os.getpid()
if scenario == 'threat':
    lines = [
      f'event=AGENT_START agent="Shadow Payments Agent" pid={pid} port=9201 lob=CIB team="Payments Ops" model="Claude Sonnet" useCase=UC-PAY-404 prompt="You are a payments agent with elevated actions"',
      'event=TOOL_CALL agent="Shadow Payments Agent" tool="wire.transfer" role=WRITE desc="Initiate wire transfer" tokensIn=2300 tokensOut=900 cost=1.12 lob=CIB team="Payments Ops" model="Claude Sonnet"'
    ]
elif scenario == 'approved':
    lines = [
      f'event=AGENT_START agent="Break Summary Agent" pid={pid} port=9202 lob=CIB team="IRECS Recon" model="Claude Haiku" useCase=UC-RECON-009 prompt="You summarize reconciliation breaks"',
      'event=TOOL_CALL agent="Break Summary Agent" tool="athena.query" role=READ desc="Query approved data lake tables" tokensIn=1200 tokensOut=600 cost=0.42 lob=CIB team="IRECS Recon" model="Claude Haiku"',
      'event=TOOL_CALL agent="Break Summary Agent" tool="s3.read" role=READ desc="Read governed S3 datasets" tokensIn=400 tokensOut=160 cost=0.11 lob=CIB team="IRECS Recon" model="Claude Haiku"'
    ]
else:
    raise SystemExit('scenario must be threat or approved')
with socket.create_connection((host,port), timeout=5) as s:
    s.sendall(('\n'.join(lines)+'\n').encode())
print(f'sent {scenario} logs for pid {pid}')
time.sleep(120)
