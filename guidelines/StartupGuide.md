# TruthByte Quick Startup Guide

## Why previous issue happened

- Backend failed earlier because environment values from backend/.env were not being picked up.
- Then a second issue happened when port 8081 was already occupied by an old Java process.

## Fixed in project

- backend/src/main/resources/application.yml now imports .env automatically.
- Vite now proxies /api to http://localhost:8081.
- Default frontend API base is now /api/v1, so a single frontend ngrok URL can serve both UI and API.

## Normal run (local)

1. Start backend:
   - Open terminal in backend folder
   - Run: mvn spring-boot:run
2. Start frontend:
   - Open terminal in project root
   - Run: cd frontend
   - Then run: npm run dev

## If port conflict appears

- For backend port 8081 conflict:
  - Find process: Get-NetTCPConnection -LocalPort 8081 -State Listen | Select-Object OwningProcess
  - Stop process: Stop-Process -Id <PID> -Force

## Public demo with ngrok (single URL for both frontend and backend)

1. Keep backend and frontend running locally.
2. Start ngrok only for frontend port 5173 (with ngrok installed on your system):
   - ngrok http 5173
3. Share the generated https://*.ngrok-free.dev URL.
4. API calls will work through Vite proxy on the same URL.

## Optional direct API URL override

- If needed, create .env in the frontend folder (frontend/.env) with:
   - VITE_API_BASE_URL=https://your-backend-url/api/v1
