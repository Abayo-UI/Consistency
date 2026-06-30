# Consistency – Frontend

React + Vite + Tailwind frontend for the Consistency personal dashboard app.

## Setup

```bash
cd consistency-frontend
cp .env.example .env        # set VITE_API_BASE_URL if your backend isn't on :3000
npm install
npm run dev                 # runs on http://localhost:5173
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend base URL |

## Pages & Routes

| Route | Page | Backend resources used |
|---|---|---|
| `/` | Dashboard | `GET /daily-logs/:date`, `GET /streaks` |
| `/log` | Morning Check-in | `POST/PUT /daily-logs`, `GET /exercise-template` |
| `/log/evening` | Evening Check-in | Same as above |
| `/calendar` | Calendar | `GET /daily-logs?from=&to=` |
| `/analytics` | Analytics | `GET /daily-logs`, `GET /streaks`, `GET /achievements` |
| `/habits` | Habits + Abstinence Brain | `GET /streaks`, `GET /learnings`, `POST /learnings` |
| `/goals` | Health & Weight | `GET/POST/PUT /health-profiles`, `GET/POST/DELETE /weight-history` |
| `/settings` | Settings | `GET/POST/PUT /exercise-template`, `POST /exercise-template/default`, `GET /audit-logs`, `GET /google-fit/status`, `POST /google-fit/sync` |
| `/login` | Login | `POST /users/login` |
| `/signup` | Signup | `POST /users/signup` |

## Auth Flow

1. Token stored in `localStorage` as `consistency_token`
2. Every Axios request injects `Authorization: Bearer <token>`
3. 401 response → clears token → redirects to `/login`
4. On mount, `GET /users/me` verifies the stored token

## Tech Stack

- **React 18** + **React Router 6**
- **Axios** – single configured instance with auth interceptors
- **Tailwind CSS** – utility classes, custom brand green palette
- **Recharts** – all charts (line, bar, radar)
- **react-hot-toast** – notifications
- **date-fns** – date manipulation
