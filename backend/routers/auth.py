from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId
from models.user import UserRegister, UserLogin, TokenResponse
from auth import hash_password, verify_password, create_access_token
from services.squad_service import account_lookup
from services.profile_manager import get_or_create_profile
from database import get_db
from config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister):
    db = get_db()

    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, "Email already registered")

    verified_account_name = body.full_name.upper()
    if not settings.DEBUG:
        try:
            lookup = await account_lookup(body.bank_code, body.account_number)
            verified_account_name = lookup["account_name"]
        except ValueError as e:
            raise HTTPException(400, f"Bank account verification failed: {str(e)}")

    user_doc = {
        "full_name": body.full_name,
        "email": body.email,
        "phone": body.phone,
        "password_hash": hash_password(body.password),
        "bank_code": body.bank_code,
        "account_number": body.account_number,
        "verified_account_name": verified_account_name,
        "is_enrolled": False,
        "enrollment_sessions": 0,
        "trusted_helpers": [],
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    await get_or_create_profile(user_id)

    token = create_access_token({"sub": user_id})

    return TokenResponse(
        access_token=token,
        user_id=user_id,
        full_name=body.full_name,
        is_enrolled=False,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})

    return TokenResponse(
        access_token=token,
        user_id=user_id,
        full_name=user["full_name"],
        is_enrolled=user.get("is_enrolled", False),
    )