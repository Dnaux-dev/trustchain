"""
main.py — TrustChain FastAPI backend
Wrapped with Mangum for Vercel serverless deployment.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from routers.auth import router as auth_router
from routers.payments import router as payments_router
from routers.users import router as users_router
from routers.dashboard import router as dashboard_router
from routers.webhook import router as webhook_router
from routers.fraud_intelligence import router as intelligence_router
from routers.linked_banks import router as banks_router

app = FastAPI(
    title="TrustChain API",
    description="Behavioral Biometric Payment Security — Squad Hackathon 3.0",
    version="1.0.0",
)

# CORS — allow your Vercel frontend URL + localhost for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",   # all Vercel preview deployments
        # Add your actual frontend URL after deployment:
        # "https://trustchain.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(payments_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(webhook_router)
app.include_router(intelligence_router)
app.include_router(banks_router)


@app.get("/")
async def root():
    return {
        "service": "TrustChain API",
        "version": "1.0.0",
        "status": "live",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Vercel serverless handler ─────────────────────────────────────
# Mangum wraps the ASGI app for AWS Lambda / Vercel Functions
handler = Mangum(app, lifespan="off")
