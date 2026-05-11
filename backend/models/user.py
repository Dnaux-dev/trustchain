from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    bank_code: str = Field(..., min_length=6, max_length=10)
    account_number: str = Field(..., min_length=10, max_length=10)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    is_enrolled: bool


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    account_number: str
    bank_code: str
    verified_account_name: Optional[str] = None
    is_enrolled: bool = False
    enrollment_sessions: int = 0
    trusted_helpers: list = []
    created_at: datetime


class TrustedHelperAdd(BaseModel):
    helper_name: str = Field(..., min_length=2)
    helper_phone: str = Field(..., min_length=10, max_length=15)
    relationship: str = Field(..., min_length=2, max_length=50)


class TrustedHelperOut(BaseModel):
    helper_id: str
    helper_name: str
    helper_phone: str
    relationship: str
    is_enrolled: bool
    enrollment_sessions: int
