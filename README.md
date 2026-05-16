# TrustChain Backend

> "We don't ask if you know your password. We ask if you move like yourself."

Behavioral Biometric Payment Fraud Prevention — Squad Hackathon 3.0, Challenge 01.

---

## Quick Start

### 1. Clone & enter the backend folder
```bash
cd trustchain/backend
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
cp .env.example .env
# Now open .env and fill in your values (see ENV GUIDE below)
```

### 5. Run the server
```bash
fastapi dev
```

Visit: http://localhost:8000  
API Docs: http://localhost:8000/docs

---

## ENV Guide — What Each Variable Means

### SECRET_KEY
Generate a random secret for JWT signing:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Copy the output and paste it as SECRET_KEY.

### MONGODB_URL
1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Click "Connect" → "Drivers" → copy the connection string
4. Replace `<password>` with your DB user password
5. Replace `myFirstDatabase` with `trustchain`

Example:
```
MONGODB_URL=mongodb+srv://ajilore:mypassword@cluster0.abc12.mongodb.net/trustchain?retryWrites=true&w=majority
```

### REDIS_URL
For local development, install Redis:
- Mac: `brew install redis && brew services start redis`
- Ubuntu: `sudo apt install redis-server && sudo systemctl start redis`
- Windows: Use WSL or Redis for Windows

Then set: `REDIS_URL=redis://localhost:6379`

Or use Redis Cloud free tier: https://redis.com/try-free/

### SQUAD API Keys
1. Go to https://sandbox.squadco.com/sign-up
2. Create a sandbox account
3. Go to Merchant Settings → API & Webhook tab
4. Copy your Secret Key, Public Key, and Merchant ID
5. Set your webhook URL to: `https://your-domain.com/webhooks/squad`

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /auth/register | Register + Squad bank verification |
| POST | /auth/login | Login → JWT |
| POST | /payments/verify-session | Core: score behavior + gate payment |
| POST | /payments/challenge | Re-score after behavioral challenge |
| GET  | /payments/confirm | Squad callback handler |
| GET  | /users/me | My profile |
| GET  | /users/me/profile | Behavioral profile stats |
| GET  | /users/me/sessions | Session history |
| POST | /users/me/helpers | Add trusted helper |
| GET  | /users/me/helpers | List trusted helpers |
| GET  | /dashboard/stats | Personal stats |
| GET  | /dashboard/risk-feed | Recent blocked sessions |
| POST | /webhooks/squad | Squad webhook receiver |

---

## Decision Logic

```
Score 70–100  →  APPROVED  →  Squad payment fires
Score 50–69   →  CHALLENGE →  Behavioral re-challenge screen
Score 0–49    →  BLOCKED   →  Squad never called, alert logged
```

No OTP. No PIN. No camera. Purely behavioral — always.

---

## Project Structure

```
backend/
├── main.py                  # FastAPI entry point
├── config.py                # Settings from .env
├── database.py              # MongoDB connection
├── auth.py                  # JWT + password utils
├── models/
│   ├── user.py              # User schemas
│   └── session.py           # Session + signal schemas
├── routers/
│   ├── auth.py              # /auth/*
│   ├── payments.py          # /payments/*  ← CORE
│   ├── users.py             # /users/*
│   ├── webhook.py           # /webhooks/*
│   └── dashboard.py         # /dashboard/*
├── services/
│   ├── signal_processor.py  # Raw signals → 24-feature vector
│   ├── biometric_engine.py  # Isolation Forest + Cosine Similarity
│   ├── profile_manager.py   # Profile storage + learning
│   └── squad_service.py     # All Squad API calls
├── ml/
│   └── models/              # Serialized .pkl model files
├── .env.example             # Environment template
├── requirements.txt
└── README.md
```
