from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import connect_db, close_db
from services.biometric_engine import get_model
from services.cache import connect_cache, close_cache

# Import routers directly
from routers.auth import router as auth_router
from routers.payments import router as payments_router
from routers.users import router as users_router
from routers.webhook import router as webhook_router
from routers.dashboard import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await connect_cache()
    get_model()
    print(f"✅ {settings.APP_NAME} backend running")
    yield
    await close_cache()
    await close_db()


app = FastAPI(
    title="TrustChain API",
    description="Behavioral Biometric Payment Fraud Prevention",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(payments_router)
app.include_router(users_router)
app.include_router(webhook_router)
app.include_router(dashboard_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "TrustChain API",
        "status": "running",
        "tagline": "We don't ask if you know your password. We ask if you move like yourself.",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}