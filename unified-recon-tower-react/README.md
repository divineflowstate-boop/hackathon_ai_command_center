# Unified Recon Tower - Create React App version

This is the CRA-compatible version of the Unified Recon Tower prototype. It does not use Vite.

## Run locally

```bash
npm install
npm start
```

Open: http://localhost:3000

## API / Mock mode

Use the selector in the top-right header:

- `Mock`: no backend required, uses built-in demo data.
- `API`: calls `REACT_APP_RECON_AGENT_URL`; if the call fails, it falls back to mock data and shows the error in the header.

## API environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Example:

```env
REACT_APP_RECON_AGENT_URL=http://localhost:8080/api/agent/ask
REACT_APP_RECON_USER_ID=user001
REACT_APP_RECON_SESSION_ID=recon-demo-session
```

CRA requires environment variables to start with `REACT_APP_`.
