# CareGrid AI - Smart Health & Emergency Response Platform

CareGrid AI is a comprehensive HealthTech MVP built for the MERN stack hackathon. It unifies patient health records, AI-driven triage, and real-time emergency response into a single production-ready progressive web app.

## 🚀 Key Features

1.  **Smart Health Wallet**: Secure digital ID with medical history, allergies, and emergency contacts.
2.  **AI Triage Engine**: Symptom assessment using LLM logic (with fallback mock mode) to determine risk severity.
3.  **Emergency SOS (Hero Feature)**: One-tap activation, real-time status tracking (Searching -> Assigned -> Arrived), and live responder details.
4.  **Hospital Routing**: Interactive map showing nearby hospitals with bed availability and distance calculation.
5.  **AI Medical Assistant**: Context-aware chat interface for medical queries.

## 🛠 Tech Stack

-   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Leaflet
-   **Backend**: Node.js, Express, MongoDB, Socket.io
-   **AI**: OpenAI API (Mock logic included for free-tier testing)
-   **Auth**: JWT Authentication

## 📦 Setup & Installation

### Prerequisites
-   Node.js (v18+)
-   MongoDB (Running locally on port 27017)

### 1. Backend Setup
```bash
cd server
npm install
# Create .env file is handled, but ensure MONGO_URI is correct
npm start
```
*Server runs on port 5000*

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Client runs on port 5173 (usually)*

## 🧪 How to Demo (Walkthrough)

1.  **Register**: Create a new account.
2.  **Dashboard**: View the "Health Wallet" with your profile.
3.  **Triage**: Go to Triage, select symptoms (e.g., "Chest Pain"), and see the AI analyze it as "Critical".
4.  **SOS**: Click the floating Red Button (bottom right) or "Activate SOS" from triage. 
    -   Wait for the 5-second countdown.
    -   Watch the status change from "Searching" to "Assigned" (simulated delay).
5.  **Map**: Check "Find Hospital" to see nearby locations.
6.  **Chat**: Talk to the AI Medic in the Chat tab.

## ⚠️ Notes for Judges
-   The **SOS Flow** simulates a real responder assignment using timeouts on the server to demonstrate the lifecycle without needing a second "driver" app active.
-   **OpenAI Key**: The app is configured to use a Mock AI Service if no valid API Key is found in `.env`, ensuring the demo never breaks.

---
*Built for Cybrathon 2026*
