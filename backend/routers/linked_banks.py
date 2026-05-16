"""
linked_banks.py
Allows users to link multiple bank accounts.
Uses Squad Account Lookup to verify each account.
Verified accounts can be used as payment sources.
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
from database import get_db
from auth import get_current_user
from services.squad_service import account_lookup
from config import settings

router = APIRouter(prefix="/banks", tags=["Linked Banks"])

BANK_NAMES = {
    "000014": "Access Bank", "000013": "GTBank", "000015": "Zenith Bank",
    "000016": "First Bank", "000004": "UBA", "000010": "Ecobank",
    "000007": "Fidelity Bank", "000003": "FCMB", "000023": "Providus Bank",
    "090267": "Kuda Bank", "100004": "OPay", "100033": "PalmPay",
    "000035": "Moniepoint", "000012": "StanbicIBTC", "000017": "Wema Bank",
    "000011": "Unity Bank", "000018": "Union Bank", "090551": "FairMoney",
}

class LinkBankRequest(BaseModel):
    bank_code: str
    account_number: str
    nickname: str = ""


@router.get("/")
async def get_linked_banks(user: dict = Depends(get_current_user)):
    db = get_db()
    banks = await db.linked_banks.find(
        {"user_id": user["id"], "active": True}
    ).to_list(10)
    for b in banks:
        b["id"] = str(b.pop("_id"))
    return banks


@router.post("/link", status_code=201)
async def link_bank(body: LinkBankRequest, user: dict = Depends(get_current_user)):
    db = get_db()

    # Check not already linked
    existing = await db.linked_banks.find_one({
        "user_id": user["id"],
        "account_number": body.account_number,
        "bank_code": body.bank_code,
        "active": True,
    })
    if existing:
        raise HTTPException(400, "This account is already linked")

    # Check max 5 linked banks
    count = await db.linked_banks.count_documents({"user_id": user["id"], "active": True})
    if count >= 5:
        raise HTTPException(400, "Maximum 5 linked banks per account")

    # Verify with Squad (skip in DEBUG mode)
    verified_name = user.get("full_name", "").upper()
    if not settings.DEBUG:
        try:
            lookup = await account_lookup(body.bank_code, body.account_number)
            verified_name = lookup["account_name"]
        except ValueError as e:
            raise HTTPException(400, f"Bank verification failed: {str(e)}")

    bank_name = BANK_NAMES.get(body.bank_code, "Unknown Bank")
    nickname = body.nickname or bank_name

    doc = {
        "user_id": user["id"],
        "bank_code": body.bank_code,
        "bank_name": bank_name,
        "account_number": body.account_number,
        "account_name": verified_name,
        "nickname": nickname,
        "active": True,
        "is_primary": count == 0,  # first linked bank is primary
        "linked_at": datetime.utcnow(),
    }
    result = await db.linked_banks.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "bank_name": bank_name,
        "account_number": body.account_number,
        "account_name": verified_name,
        "nickname": nickname,
        "message": f"{bank_name} account verified and linked successfully",
    }


@router.delete("/{bank_id}")
async def unlink_bank(bank_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.linked_banks.update_one(
        {"_id": ObjectId(bank_id), "user_id": user["id"]},
        {"$set": {"active": False, "unlinked_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Bank not found")
    return {"message": "Bank account unlinked"}


@router.post("/{bank_id}/set-primary")
async def set_primary(bank_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    # Unset all primary
    await db.linked_banks.update_many(
        {"user_id": user["id"]},
        {"$set": {"is_primary": False}}
    )
    # Set new primary
    await db.linked_banks.update_one(
        {"_id": ObjectId(bank_id), "user_id": user["id"]},
        {"$set": {"is_primary": True}}
    )
    return {"message": "Primary bank updated"}
