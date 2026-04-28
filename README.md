<h1 align="center">
  <br>
  CrisisAI
  <br>
</h1>

<h4 align="center">An intelligent, real-time emergency dispatch and crisis management platform built for modern governments and citizens.</h4>

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#the-solution">Solution</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#architecture--tech-stack">Architecture</a> •
  <a href="#quick-start">Quick Start</a>
</p>

---

## 🚨 The Problem

During large-scale emergencies, traditional dispatch systems become rapidly overwhelmed. Citizens struggle to report incidents efficiently, critical communication lines break down, and emergency responders lack real-time, triaged situational awareness. This leads to delayed response times and inefficient resource allocation when every second counts.

## 💡 The Solution: CrisisAI

**CrisisAI** is an end-to-end, AI-powered emergency management infrastructure designed to bridge the gap between citizens in distress and government response teams. By leveraging localized AI triage, real-time socket communication, and dynamic interactive mapping, CrisisAI autonomously categorizes, prioritizes, and routes incidents to the appropriate executive command centers. 

Built with **production-level architecture**, the platform guarantees high availability, rapid deployment, and secure two-way communication during critical operations.

---

## ✨ Key Features

- **🧠 AI-Powered Triage & Dispatch:** Automatically classifies incident severity and type using a custom Python FastAPI microservice (leveraging Hugging Face models with robust local heuristic fallbacks).
- **🗺️ Real-Time Tactical Mapping:** Live interactive map rendering active incidents, responder locations, and optimal routing/navigation.
- **🏛️ Executive Command Center:** A comprehensive, scrollable dashboard for government agencies to monitor city-wide status, manage logistics, and allocate resources efficiently.
- **📱 Citizen-Centric Reporting:** Multi-step, seamless citizen registration and intuitive incident reporting, supporting high-resolution image uploads with secure server-side storage.
- **💬 Secure Gov-Hub Communication:** Real-time, two-way encrypted messaging system between citizens and government operatives with synchronization and intervention tracking.
- **⚡ Production-Ready Infrastructure:** Modular architecture utilizing React/Vite for the frontend, Node.js/MongoDB for the backend, and Socket.io for instantaneous bidirectional data flow.

---

## 🛠️ Architecture & Tech Stack

CrisisAI is structured into three highly decoupled micro-environments:

### 1. Client (Frontend)
- **Framework:** React + Vite
- **Styling:** Custom Vanilla CSS (Premium, dark-mode, glassmorphism aesthetics)
- **State & Real-time:** React Hooks + Socket.io-client
- **Mapping:** Leaflet / React-Leaflet
- **Deployment Config:** Vercel (`vercel.json`)

### 2. Server (Backend API)
- **Environment:** Node.js + Express
- **Database:** MongoDB (Mongoose Object Modeling)
- **Real-time Engine:** Socket.io
- **Authentication:** Secure JWT (JSON Web Tokens)
- **Media Storage:** Secure local storage for image reports

### 3. AI Service (Microservice)
- **Framework:** Python + FastAPI
- **Core AI:** Local Heuristic Classification Engine & NLP models
- **Role:** Autonomous incident categorization, NLP processing, and severity ranking.

---

## 🚀 Quick Start

Follow these instructions to run the CrisisAI platform locally.

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB instance (local or MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/crisis-ai.git
cd crisis-ai
```

### 2. Start the Database & Backend Server
```bash
cd server
npm install
# Create a .env file based on environment variables (Include MONGO_URI, JWT_SECRET)
npm run start
```

### 3. Start the AI Classification Service
```bash
cd ai-service
pip install -r requirements.txt
# Create a .env file (Include HUGGINGFACE_API_KEY if applicable)
uvicorn main:app --reload --port 8000
```

### 4. Start the Frontend Client
```bash
cd client
npm install
# Ensure .env points to the local backend and AI service
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 🏆 Hackathon Context

This project was built specifically for the **GDG Hackathon**. The focus was on building a technically robust, scalable, and visually stunning solution to a critical real-world problem. Our team prioritized:
- **Seamless cross-service communication** (REST APIs + WebSockets).
- **Production-grade deployment capabilities** (Vercel/Render ready configs).
- **Zero-latency user experience** for mission-critical environments.
- **High-availability fallbacks** (e.g., local AI heuristics if external APIs fail) ensuring the app never goes down during a crisis.

## 📄 License

This project is licensed under the MIT License.
