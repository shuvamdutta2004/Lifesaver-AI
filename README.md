# LifeSaver AI 🚨

> **Multi-Disaster Emergency Response System — HackTropica'26**

A real-time web-based emergency response platform (React PWA + Node.js) that helps individuals trigger SOS, receive AI-guided first-aid, and find safe zones during disasters.

---

## 🏗️ Project Structure

```
lifesaver-ai/
├── client/          # React PWA (Vite + Tailwind + Leaflet)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # 5 routes
│   │   ├── context/      # EmergencyContext (global state)
│   │   ├── hooks/        # geolocation, voice, keyboard
│   │   └── data/         # simulation JSON + instructions
│   └── .env.example  ← copy to .env and fill in values
└── server/          # Node.js + Express backend
    ├── routes/       # /api/sos, /api/ai, /api/nearby, /api/alerts
    └── .env.example  ← copy to .env and fill in values
```

---

## ⚡ Quick Start

### 1. Install dependencies

```bash
# Client
cd client && npm install

# Server
cd ../server && npm install
```

### 2. Configure environment variables

```bash
# Client
cd client
cp .env.example .env
# Fill in VITE_FIREBASE_* values

# Server
cd ../server
cp .env.example .env
# Fill in GEMINI_API_KEY and FIREBASE_* values
```

### 3. Run dev servers

```bash
# Terminal 1 – backend (port 4000)
cd server && npm run dev

# Terminal 2 – frontend (port 5173)
cd client && npm run dev
```

Open: http://localhost:5173

---

## 🔑 APIs & Keys You Need to Provide

| What | Where to get | Where to put |
|---|---|---|
| Firebase Config (6 values) | Firebase Console → Project Settings → Web App | `client/.env` |
| Firebase Realtime DB URL | Firebase Console → Realtime Database | `client/.env` + `server/.env` |
| Firebase Service Account JSON | Firebase Console → Service Accounts → Generate Key | `server/firebase-service-account.json` |
| Gemini API Key | https://aistudio.google.com/app/apikey | `server/.env` |
| Twilio (optional SMS) | https://console.twilio.com | `server/.env` |

> **Works without any keys!** The app runs in full demo mode with simulated data and offline AI fallback responses.

---

## 🗺️ Pages & Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Hero + SOS button + helplines |
| `/dashboard` | Dashboard | Map + AI chat + responders |
| `/chat` | ChatPage | Full-screen AI chat |
| `/disaster` | DisasterMode | Safe zones + shelters + evacuation |
| `/women-safety` | WomenSafety | Priority SOS overlay |

---

## 🔌 Backend API Endpoints

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `POST` | `/api/sos` | `{ type, lat, lng }` | Log SOS event to Firebase |
| `POST` | `/api/ai` | `{ message, emergencyType, history, location }` | Gemini AI chat proxy |
| `GET` | `/api/nearby` | `?type=all&limit=5` | Nearby helpers & hospitals |
| `POST` | `/api/alerts/broadcast` | `{ type, lat, lng, message }` | Broadcast alert |
| `GET` | `/api/alerts/live` | — | Recent active alerts |
| `GET` | `/health` | — | Health check |

---

## 🚀 Deploy

### Frontend → Vercel
```bash
cd client
npm run build
npx vercel --prod
```

### Backend → Railway
1. Push `server/` folder to a GitHub repo
2. Connect to Railway → New Project from GitHub
3. Set environment variables
4. Deploy

---

## 🔥 Demo Tips

1. **Two-tab trick**: Open `/dashboard` in Tab 1 (victim) and `/api/sos/active` in Tab 2 (helper) — Firebase updates in real-time
2. **Voice SOS**: Say "Help me" in Chrome → SOS triggers
3. **Keyboard**: Press `Ctrl + Shift + S` → SOS triggers
4. **Disaster mode**: Go to `/disaster` → switch between Fire/Flood/Earthquake → map shows safe zones

---

## 📋 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Leaflet.js
- **Backend**: Node.js, Express, Google Gemini API
- **Database**: Firebase Realtime DB
- **Maps**: OpenStreetMap (CartoDB dark tiles) — free, no billing
- **Deploy**: Vercel + Railway
