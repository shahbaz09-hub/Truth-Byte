# Deployment Guide (Render Backend + Vercel Frontend)

This guide deploys:

- Backend (Spring Boot) on Render
- Frontend (Vite/React) on Vercel

It also includes optional GitHub Actions deploy hooks that are already configured in this repository.

## 1. Backend deployment on Render

Create a new Web Service in Render and connect this repository.

Use one of these setup options:

### Option A: Java runtime (recommended when available)

- Root directory: `backend`
- Environment: `Java`
- Build command: `mvn clean package -DskipTests`
- Start command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`

### Option B: Docker runtime (use this if Java option is not shown)

- Root directory: `backend`
- Environment: `Docker`
- Dockerfile: `backend/Dockerfile` (or `Dockerfile` if Render resolves from root directory)
- Build command: leave empty
- Start command: leave empty

Notes for Docker path:

- Backend Docker image uses Java 17 and Maven build stage.
- Render will build from `backend/Dockerfile` and run the container directly.

### Required backend environment variables

Set these in Render service -> Environment:

1. `GEMINI_API_KEY`
2. `JWT_SECRET`
3. `JWT_EXPIRATION` (optional, default is okay)
4. `CORS_ORIGINS`
5. Database variables:
	 - Either set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
	 - Or set `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`

Notes:

- App now reads Render `PORT` automatically (`server.port` fallback supports `PORT`).
- Keep `CORS_ORIGINS` as a comma-separated list. Include your Vercel domain(s), for example:
	- `https://truth-byte.vercel.app,https://truth-byte-git-main-yourteam.vercel.app`

### Render health check

After deploy succeeds, verify API is reachable:

- `https://<your-render-service>.onrender.com/api/v1/search/claims?q=test`

Expected: HTTP 200 with JSON response.

## 2. Frontend deployment on Vercel

Create a new Vercel project from this repository.

Use these settings:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

### Required frontend environment variable

Set in Vercel project -> Environment Variables:

- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api/v1`

Then redeploy frontend.

## 3. End-to-end verification

1. Open Vercel frontend URL.
2. Open browser devtools and verify API calls go to Render domain.
3. Test at least:
	 - Login/Register
	 - Claim verification
	 - URL analyzer
4. If requests fail with CORS errors, re-check `CORS_ORIGINS` in Render.

## 4. Optional auto-deploy from GitHub Actions

Repository already has workflow: `.github/workflows/deploy.yml`

It triggers provider deploy hooks after CI passes on `main`.

### Required GitHub secrets

1. `BACKEND_DEPLOY_HOOK_URL` (Render Deploy Hook)
2. `FRONTEND_DEPLOY_HOOK_URL` (Vercel Deploy Hook)

Path:

- Repository -> Settings -> Secrets and variables -> Actions -> New repository secret

### Test hook-based auto deploy

1. Push to `main`.
2. Wait for `CI` workflow success.
3. Confirm `Deploy` workflow triggers both hook jobs.

## 5. Troubleshooting

- `502`/`503` on backend:
	- Check Render logs for DB credentials and startup errors.
	- Confirm service is listening on injected `PORT` (already handled in config).
- `401` on protected endpoints:
	- Verify login works and JWT is being stored on frontend.
- CORS blocked:
	- Add exact Vercel origins to `CORS_ORIGINS`.
- Frontend calling wrong API:
	- Ensure `VITE_API_BASE_URL` is set in Vercel for the same environment (Production/Preview).
