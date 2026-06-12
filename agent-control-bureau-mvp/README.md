# Agent Control Bureau — Final MVP

**Agent Control Bureau** is an enterprise command center for AI agents.

Pitch line:

> **KNOW. GOVERN. MAXIMIZE.**  
> Moving from Token Maxxing to Value Maxxing.

This MVP is aligned to the final ACB deck and demo narrative:

- LOB-level visibility where firm-level governance already exists.
- Agent inventory with LOB, team, owner, model, tools, PID, status and cost.
- Runtime ingestion from local port logs.
- Admin-in-the-loop approval and ban flow.
- Ban attempts to kill the agent process PID.
- Auto-approval when a new agent uses already approved tools.
- ValueMaxxing screen for token usage, cost and model consumption.
- Ask Bureau screen, ready to be replaced with JPMC SmartSDK Java.

## Tech stack

- Frontend: Create React App, no Vite
- Backend: Java 17, Spring Boot, SQLite
- Ingestion: Python 3 TCP port reader
- AI Copilot seam: `SmartSdkBureauBridge` placeholder for JPMC SmartSDK Java wrapper

## Project structure

```text
agent-control-bureau-mvp/
  backend/      Spring Boot + SQLite REST API
  frontend/     Create React App UI
  ingestion/    TCP log ingestor and demo log sender
  API.md        API contract
```

## Run backend

```bash
cd backend
mvn spring-boot:run
```

Backend starts on:

```text
http://localhost:8080
```

SQLite file created automatically:

```text
backend/acb.sqlite
```

## Run frontend

```bash
cd frontend
npm install
npm start
```

Frontend starts on:

```text
http://localhost:3000
```

## Run ingestion

Terminal 1:

```bash
python ingestion/port_ingestor.py --port 9900 --batch-seconds 5
```

Terminal 2 — threat / unapproved tool scenario:

```bash
python ingestion/demo_agent_sender.py 9900 threat
```

Terminal 3 — auto-approved known-tools scenario:

```bash
python ingestion/demo_agent_sender.py 9900 approved
```

## Demo flow

1. Open **Mission Control**.
2. Show existing **Agent Field View** with LOB, team, model and status.
3. Start the Python ingestor.
4. Run the `threat` scenario.
5. New agent appears as **UNDER_REVIEW** with a high-risk runtime event.
6. Open **Admin Loop**.
7. Click **Ban & Kill PID**.
8. Show agent status as **BANNED**.
9. Run the `approved` scenario.
10. New agent appears as **APPROVED** because all tools are already globally approved.
11. Open **ValueMaxxing** and show token/cost/model charts.
12. Open **Ask Bureau** and ask:
    - Which agents use Athena?
    - Top token cost agents
    - Show under review agents

## Ingestion log examples

```text
event=AGENT_START agent="Break Summary Agent" pid=1234 port=9202 lob=CIB team="IRECS Recon" model="Claude Haiku" useCase=UC-RECON-009 prompt="You summarize reconciliation breaks"
event=TOOL_CALL agent="Break Summary Agent" tool="athena.query" role=READ desc="Query approved data lake tables" tokensIn=1200 tokensOut=600 cost=0.42 lob=CIB team="IRECS Recon" model="Claude Haiku"
```

## SmartSDK integration plan

The MVP currently answers Ask Bureau using SQL-backed mock logic so the demo works without internal dependencies.

In JPMC VDI, keep the Spring Boot APIs and replace `/api/bureau/ask` with a SmartSDK Java wrapper:

```text
React Ask Bureau
    ↓
Spring Boot /api/bureau/ask
    ↓
SmartSDK Java Agent
    ↓
Spring tools: agents, metrics, approvals, costs, tools
```

Expose these Spring APIs as SmartSDK tools:

```text
getAgents()
getAgentDetails(agentId)
getPendingApprovals()
getTopTokenConsumers(range)
getCostByLob(range)
getAgentsByModel(model)
getAgentsByTool(toolName)
getDuplicateAgentCandidates()
```

## JPMC VDI notes

- No Vite.
- No Docker.
- No external DB.
- SQLite local file only.
- Spring Boot REST APIs.
- Process kill only works if the Java process has permission to kill the target PID.

## Dummy dataset and demo logs

Generate all demo log files:

```bash
python scripts/generate_dummy_logs.py
```

This creates:

```text
scripts/generated_logs/baseline.log
scripts/generated_logs/threat.log
scripts/generated_logs/auto_approved.log
scripts/generated_logs/value.log
scripts/generated_logs/full_demo.log
```

Seed the backend directly through `/api/ingest`:

```bash
python scripts/seed_dummy_dataset.py --scenario full_demo
```

Stream logs through the TCP ingestion flow:

```bash
python ingestion/port_ingestor.py --port 9900 --batch-seconds 5
python scripts/generate_dummy_logs.py --stream --port 9900 --scenario threat
python scripts/generate_dummy_logs.py --stream --port 9900 --scenario auto_approved
```

Recommended demo sequence:

```bash
# 1. Seed baseline estate
python scripts/seed_dummy_dataset.py --scenario baseline

# 2. Show new unapproved/shadow agent
python scripts/generate_dummy_logs.py --stream --port 9900 --scenario threat

# 3. Ban from Governance Center

# 4. Show new agent auto-approved because all tools are already approved
python scripts/generate_dummy_logs.py --stream --port 9900 --scenario auto_approved

# 5. Seed reporting data for ValueMaxxing
python scripts/seed_dummy_dataset.py --scenario value
```
