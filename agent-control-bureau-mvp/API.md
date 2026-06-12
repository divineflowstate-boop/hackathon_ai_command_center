# Agent Control Bureau API

Base URL: `http://localhost:8080/api`

## Agent visibility

- `GET /agents` — all agents with LOB, team, model, tokens, cost, status and PID.
- `GET /agents/{id}` — personnel file: prompt, tools, runtime events.
- `GET /activity` — operations log.
- `GET /metrics` — summary, token/cost charts, LOB/model breakdown.

## Ingestion

- `POST /ingest`

Request:

```json
{
  "logs": [
    "event=AGENT_START agent=\"Break Summary Agent\" pid=1234 port=9202 lob=CIB team=\"IRECS Recon\" model=\"Claude Haiku\" useCase=UC-RECON-009 prompt=\"You summarize reconciliation breaks\"",
    "event=TOOL_CALL agent=\"Break Summary Agent\" tool=\"athena.query\" role=READ tokensIn=1200 tokensOut=600 cost=0.42 lob=CIB team=\"IRECS Recon\" model=\"Claude Haiku\""
  ]
}
```

## Governance

- `GET /approvals` — pending admin-loop items.
- `POST /approvals/{id}/approve` — approve tool/prompt change.
- `POST /approvals/{id}/ban` — ban agent and attempt PID kill.
- `POST /agents/{id}/ban` — ban directly.

## Ask Bureau

- `POST /bureau/ask`

Request:

```json
{ "question": "Which agents use Athena?" }
```

Current mode: SQL-backed mock.
JPMC mode: replace with SmartSDK Java wrapper using the seam in `SmartSdkBureauBridge`.
