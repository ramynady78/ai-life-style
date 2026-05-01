# LifeFit AI (Full Stack)

AI-assisted healthy lifestyle recommendation app with:

- `backend/`: Express + PostgreSQL API + local Ollama AI integration
- `frontend/`: Vite + React client

## 1) Setup

### Backend

1. Copy env template:
   - `cp backend/.env.example backend/.env`
2. Update `DATABASE_URL` and `JWT_SECRET` in `backend/.env`.
3. Make sure Ollama is running locally and the model is installed:
   - `ollama list`
   - `ollama pull gamma4:e2b` if the model is missing
4. Confirm the local AI settings:
   - `OLLAMA_BASE_URL=http://127.0.0.1:11434/api`
   - `OLLAMA_MODEL=gamma4:e2b`
5. Install deps:
   - `cd backend && npm install`

### Frontend

1. Copy env template:
   - `cp frontend/.env.example frontend/.env`
2. Confirm `VITE_API_BASE_URL` points to backend (default `http://localhost:5000`).
3. Install deps:
   - `cd frontend && npm install`

## 2) Run

Open two terminals:

1. Backend:
   - `cd backend && npm run dev`
2. Frontend:
   - `cd frontend && npm run dev`

## 3) Quality Checks

- Backend:
  - `cd backend && npm test`
  - `cd backend && npm run check`
- Frontend:
  - `cd frontend && npm run check`

## Local AI

The app uses Ollama locally through the backend. It does not require an external AI API key or a cloud model. If Ollama is not running, plan generation returns a clear error, chat shows a local AI fallback message, and tracking data is still saved.

## Security Note

Previously exposed secrets should be considered compromised. Rotate database credentials and JWT secret values before deploying.
