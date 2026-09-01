# Netlify deployment

The Netlify site deploys the Next.js frontend in `frontend-next/`. The FastAPI service is a separate application and must be hosted on a service that supports Python processes and persistent WebSockets (for example Render, Railway, Fly.io, or a VPS).

## 1. Deploy the API first

Start the API with:

```bash
uvicorn src.api.app:app --host 0.0.0.0 --port $PORT
```

Set these backend environment variables:

```text
ENVIRONMENT=production
SECRET_KEY=<a-long-random-secret>
CORS_ALLOW_ORIGINS=https://<your-netlify-site>.netlify.app
```

After the Netlify domain is known, add any custom domain to `CORS_ALLOW_ORIGINS` as a comma-separated value. Do not use `*` when credentials are enabled.

## 2. Deploy the frontend on Netlify

1. Push this repository to GitHub, GitLab, or Bitbucket and import it into Netlify.
2. Netlify reads `netlify.toml`; do not override the base directory, build command, or publish directory in the UI.
3. In **Site configuration → Environment variables**, add:

   ```text
   NEXT_PUBLIC_API_URL=https://<your-api-host>
   NEXT_PUBLIC_WS_URL=wss://<your-api-host>
   ```

   Omit trailing slashes. `NEXT_PUBLIC_*` values are intentionally public and are compiled into the browser bundle; never place API secrets there.
4. Deploy. The Netlify Next.js runtime will handle the `.next` output.

## Local frontend setup

```bash
cd frontend-next
Copy-Item .env.example .env.local
npm ci
npm run dev
```

## Verification checklist

- Open `https://<your-api-host>/docs` and confirm the API is reachable.
- Confirm the Netlify page loads market data rather than attempting `localhost:8000`.
- In the browser console, verify WebSocket connections use `wss://` rather than `ws://`.
- Confirm Reliance prices appear in INR (`₹`), not dollars.
