# LifeFit AI Frontend

Vite + React frontend for the LifeFit AI full-stack project. AI features are served by the backend through local Ollama using `gamma4:e2b`.

## Scripts

- `npm run dev`: start local dev server (`http://localhost:5173`)
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run typecheck`: TypeScript validation
- `npm run check`: typecheck + build

## Environment

Create `.env` from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

## Notes

- Auth and app data are loaded from backend APIs.
- Chat, recommendations, tracking adjustments, and nutrition views are backend-driven.
- The backend requires Ollama running locally with the `gamma4:e2b` model installed.
- No external AI API key or cloud model is required.
