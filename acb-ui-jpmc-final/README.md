# ACB UI - JPMorgan-style final pass

Drop these files into your React frontend:

- `src/index.js`
- `src/styles.css`
- `public/index.html` if needed

## What changed

- Switched to an all-white JPMorgan-style enterprise UI.
- Added black JPMorgan Chase top header.
- Removed the heavy black dashboard feel.
- Kept status colors only as borders/chips: blue approved, amber review, red banned/threat.
- Mission Control is renamed to Agent Field View.
- ValueMaxxing is renamed to Cost Intelligence.
- Removed bottom-left Token Maxxing note.
- Agent Registry, Admin Loop, Cost Intelligence and Ask Bureau are all white-card based.
- Charts use JPM-style blue and light gridlines.

## API usage

No mock/dummy data arrays are included in the UI. The frontend calls:

- `GET /agents`
- `GET /activity`
- `GET /approvals`
- `GET /metrics`
- `GET /agents/:id`
- `POST /approvals/:id/approve`
- `POST /approvals/:id/ban`
- `POST /bureau/ask`

Default API base:

```bash
http://localhost:8080/api
```

Override with:

```bash
REACT_APP_API=http://localhost:8080/api
```
