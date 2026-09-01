# AI Market Intelligence Platform — Next.js Frontend Foundation (`frontend-next/`)

This directory contains the Netlify-ready Next.js 14 + React + TypeScript + Tailwind CSS frontend.

## Backend Integration

The Streamlit dashboard remains the primary UI. This Next.js app communicates with the FastAPI REST API backend (`src/api/app.py` running on `http://localhost:8000`).

## Development

```bash
cd frontend-next
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

Copy `.env.example` to `.env.local` before starting. For Netlify deployment,
see [the repository deployment guide](../NETLIFY_DEPLOYMENT.md).
