# TrustChain: Behavioral Biometric Payment Security

> "We don't ask if you know your password. We ask if you move like yourself."

**TrustChain** is a state-of-the-art behavioral biometric payment fraud prevention system built for **Squad Hackathon 3.0 (Challenge 01)**. It eliminates the friction of traditional OTPs and PINs by using a "silent" layer of security that verifies users based on how they interact with their devices.

---

## 🏗️ Project Architecture

The repository is structured as a monorepo containing two main components:

- **[Backend](./backend)**: A high-performance FastAPI server that handles ML-based behavioral scoring, Squad payment gateway integration, and real-time fraud intelligence.
- **[Frontend (trustchain-v2)](./trustchain-v2)**: A modern React-based web application featuring a stunning dashboard, a "Sleek" UI/UX, and the core behavioral signal capture engine.

---

## 🔄 The TrustChain Flow

TrustChain operates through a continuous learning and verification loop:

### 1. Behavioral Onboarding
During registration, users complete a series of "training sessions" where the system captures their baseline behavioral DNA (typing speed, rhythm, scroll velocity, mouse movement jitter). This baseline is stored as a multi-dimensional feature vector.

### 2. Intelligent Signal Capture
As the user navigates the dashboard or initiates a payment, the **TrustChain SDK** (embedded in the frontend) silently monitors hundreds of data points without ever touching sensitive PII.

### 3. Real-time ML Scoring
The backend processes raw signals through a dual-model pipeline:
- **Isolation Forest**: Detects statistical anomalies in the current session compared to the user's history.
- **Cosine Similarity**: Measures the "angular distance" between the current session's vector and the user's historical baseline.

### 4. Adaptive Gating
Based on the behavioral score, the system makes an instant decision:
- **Score 70–100 (Low Risk)**: Transaction is **Approved** and sent to Squad for processing.
- **Score 50–69 (Medium Risk)**: User is issued a **Challenge** (e.g., a specific behavioral pattern test) to re-verify identity.
- **Score 0–49 (High Risk)**: Transaction is **Blocked**. The payment is never initiated, and a risk alert is logged.

---

## 📂 Component Breakdown

### 🖥️ Backend (`/backend`)
Powered by **Python 3.10+** and **FastAPI**.

- **Tech Stack**: FastAPI, MongoDB (Motor), Redis + RQ (Retraining), Scikit-Learn, Google Gemini AI (Fraud Intelligence).
- **Core Engine**: 
    - `biometric_engine.py`: The heart of the scoring logic.
    - `signal_processor.py`: Converts raw JSON signals into a 24-feature ML vector.
    - `retrain_worker.py`: Background worker that updates user models as they continue to use the system.
    - `squad_service.py`: Direct integration with Squad Payment APIs for payouts and verification.

### 📱 Frontend (`/trustchain-v2`)
Powered by **React** and **Vite**.

- **Tech Stack**: React 18, Zustand (State), Recharts (Analytics), Lucide (Icons), Framer Motion (Animations).
- **Key Features**:
    - **Real-time Risk Feed**: A live stream of behavioral security events.
    - **Trust Score Analytics**: Visual representation of user behavioral stability.
    - **Squad Integration**: Seamless payment flows protected by behavioral gating.
    - **Adaptive UI**: Changes state based on the risk score returned by the backend.

---

## 🛠️ Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv: source venv/bin/activate (Mac/Linux) or venv\Scripts\activate (Windows)
pip install -r requirements.txt
cp .env.example .env # Configure your MongoDB, Redis, and Squad keys
fastapi dev
```

### 2. Frontend Setup
```bash
cd trustchain-v2
npm install
npm run dev
```

---

## 🛡️ Squad Integration
TrustChain uses the **Squad Virtual Account & Payout API** to verify merchant identity and secure high-value transfers. No payment is ever fired unless the behavioral score passes the trust threshold.

## 📄 License
This project was developed for the Squad Hackathon 3.0. All rights reserved.
