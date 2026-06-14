# Unified Recon Tower Redesign

A React implementation of an API-driven operations intelligence workspace for reconciliation teams.

## Product positioning

Unified Recon Tower is not an AI chat screen and not a generic NLQ dashboard. The question is only the entry point. The workspace routes the answer into one of six operational workflows:

1. Operational Brief
2. Investigation Workspace
3. SLA Intelligence
4. Anomaly Investigation
5. Resolution Workspace
6. Cost Intelligence

Core flow:

```txt
Question → Tool Selection → Structured Insight → Visual Workspace → Action
```

## Run locally

```bash
npm install
npm start
```

## Mock/API switch

The demo uses mock responses by default.

Open:

```txt
src/config.js
```

Change:

```js
export const USE_MOCK_RESPONSES = true;
```

to:

```js
export const USE_MOCK_RESPONSES = false;
```

The UI will then call:

```txt
POST http://localhost:8080/api/recon/ask
```

Override API URL with:

```bash
REACT_APP_RECON_API_URL=http://localhost:8080 npm start
```

## Expected backend response contract

```json
{
  "answer": "Human readable summary",
  "userId": "user001",
  "sessionId": "recon-demo-session",
  "toolCalls": [
    {
      "toolName": "getDailySummary",
      "toolResponse": {
        "result": {}
      }
    }
  ]
}
```

## Tool routing

| Tool Name | Screen |
|---|---|
| getDailySummary | Operational Brief |
| getDetailsForRecon | Investigation Workspace |
| predictSlaRisk | SLA Intelligence |
| detectAnomaliesByReconId | Anomaly Investigation |
| resolveIncidentByReconId | Resolution Workspace |
| getCostReport | Cost Intelligence |

## Design notes

- Black JPMorgan-style header
- White/beige/silver background
- Minimal cards, heavy whitespace, thin-line visual system
- No charting library dependency
- No mock hardcoding in components; all screen content is read from `toolCalls[0].toolResponse.result`
- Generic answer mode supported when `toolCalls` is missing or empty
- API failure degrades to a readable response instead of crashing

## Motion and cost update

This version adds a dependency-free premium motion layer:

- Smooth scroll-to-workspace after a question is submitted
- Sticky question console while the answer/workspace is being reviewed
- IntersectionObserver-driven card reveals on scroll
- Animated execution lanes, meters, risk curves, and cost bars when visible
- Header scroll progress accent
- Cost Intelligence now includes an all-recon cost field and per-recon animated cost rows

## API compatibility notes

No new top-level API contract is required.

The UI still routes by:

```txt
toolCalls[0].toolName
```

and reads data from:

```txt
toolCalls[0].toolResponse.result
```

For the enriched Cost Intelligence view, the existing `costByRecon[]` field should contain every recon you want displayed. If the backend returns only four recons, the UI will show four. To show all recons, return all recons in the existing `costByRecon` array; no schema change is needed.
