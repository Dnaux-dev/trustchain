"""
main.py — TrustChain FastAPI Backend
Robust startup — never crashes on import errors.
"""
import os
import sys
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

print("[TrustChain] Starting up...", flush=True)
print(f"[TrustChain] Python {sys.version}", flush=True)
print(f"[TrustChain] MONGODB_URL set: {bool(os.getenv('MONGODB_URL'))}", flush=True)
print(f"[TrustChain] SECRET_KEY set: {bool(os.getenv('SECRET_KEY'))}", flush=True)

app = FastAPI(
    title="TrustChain API",
    description="Behavioral Biometric Payment Security — Squad Hackathon 3.0",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://trustchain-9p21-git-main-dnauxdevs-projects.vercel.app",
        "https://trustchain-9p21.vercel.app",
        "https://*.vercel.app",
        "*",  # allow all during hackathon
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Always-working endpoints ───────────────────────────────────────
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
    return {
        "status": "ok",
        "mongodb_configured": bool(os.getenv("MONGODB_URL")),
        "secret_configured": bool(os.getenv("SECRET_KEY")),
        "squad_configured": bool(os.getenv("SQUAD_SECRET_KEY")),
        "debug": os.getenv("DEBUG", "true"),
    }


# ── Load routers — each isolated so one failure doesn't kill all ───
_loaded = []
_failed = []


def try_load(name, import_fn):
    try:
        router = import_fn()
        app.include_router(router)
        _loaded.append(name)
        print(f"[TrustChain] ✓ Loaded router: {name}", flush=True)
    except Exception as e:
        _failed.append({"router": name, "error": str(e)})
        print(f"[TrustChain] ✗ Failed router: {name} — {e}", flush=True)
        traceback.print_exc()


try_load("auth", lambda: __import__("routers.auth", fromlist=["router"]).router)
try_load("payments", lambda: __import__("routers.payments", fromlist=["router"]).router)
try_load("users", lambda: __import__("routers.users", fromlist=["router"]).router)
try_load("dashboard", lambda: __import__("routers.dashboard", fromlist=["router"]).router)
try_load("webhook", lambda: __import__("routers.webhook", fromlist=["router"]).router)
try_load("intelligence", lambda: __import__("routers.fraud_intelligence", fromlist=["router"]).router)
try_load("banks", lambda: __import__("routers.linked_banks", fromlist=["router"]).router)


@app.get("/startup-status")
async def startup_status():
    return {
        "loaded_routers": _loaded,
        "failed_routers": _failed,
        "total_loaded": len(_loaded),
        "total_failed": len(_failed),
    }


print(f"[TrustChain] Startup complete. Loaded: {len(_loaded)} routers, Failed: {len(_failed)}", flush=True)
