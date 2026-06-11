# Unified Recon Tower — CRA + Java API

Ask-driven recon control tower prototype using Create React App and a Spring Boot backend with static contract-backed responses.

## Frontend

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

## API endpoint

```http
POST /api/agent/ask
Content-Type: application/json

{
  "message": "Show daily summary for today",
  "userId": "user001",
  "sessionId": "recon-demo-session"
}
```

The backend returns the same envelope shape used by the agent:

```json
{
  "answer": "...",
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

## Supported dummy tool contracts

| Question type | Tool returned |
|---|---|
| Daily summary | `getDailySummary` |
| Where is recon | `getPipelineStatusByReconId` |
| SLA / ETA | `predictEtaAndRiskByReconId` |
| Detect anomalies | `detectAnomaliesByReconId` |
| Resolve / next step | `resolveIncidentByReconId` |
| Cost visibility | `getCostReport` |

## Data mode

Use the top-right **Data** selector:

- `Mock`: frontend-only static data
- `API`: calls Spring Boot `/api/agent/ask`

If the API is down, the UI shows a small fallback warning and renders mock data.

## Environment override

Create `.env` if needed:

```env
REACT_APP_RECON_AGENT_URL=http://localhost:8080/api/agent/ask
REACT_APP_RECON_USER_ID=user001
REACT_APP_RECON_SESSION_ID=recon-demo-session
```
