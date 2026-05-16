"""
squad_service.py
Single source of truth for all Squad API calls.
Every function is async and raises on failure.
"""
import httpx
import time
from typing import Optional
from config import settings

BASE = settings.SQUAD_BASE_URL
HEADERS = {
    "Authorization": f"Bearer {settings.SQUAD_SECRET_KEY}",
    "Content-Type": "application/json",
}


async def account_lookup(bank_code: str, account_number: str) -> dict:
    """
    Verify a bank account exists and return the registered name.
    Used to verify recipient before any transfer.
    Raises ValueError if account not found.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                f"{BASE}/payout/account/lookup",
                json={"bank_code": bank_code, "account_number": account_number},
                headers=HEADERS,
            )
    except httpx.RequestError as exc:
        raise ValueError(f"Squad API unreachable: {exc}")
    try:
        data = res.json()
    except Exception:
        raise ValueError(f"Squad API returned non-JSON response (HTTP {res.status_code})")
    if data.get("status") != 200:
        raise ValueError(f"Account lookup failed: {data.get('message', 'Unknown error')}")
    return data["data"]  # { account_name, account_number }


async def initiate_payment(
    user: dict,
    amount_naira: float,
    recipient_name: str,
    session_id: str,
    behavioral_score: float,
    metadata: Optional[dict] = None,
) -> str:
    """
    Initiates a Squad payment and returns the checkout URL.
    Amount is in Naira — converted to kobo internally.
    """
    amount_kobo = int(amount_naira * 100)
    txn_ref = f"{settings.SQUAD_MERCHANT_ID}_TC_{session_id[:12]}_{int(time.time())}"

    payload = {
        "amount": amount_kobo,
        "email": user["email"],
        "currency": "NGN",
        "initiate_type": "inline",
        "transaction_ref": txn_ref,
        "customer_name": user["full_name"],
        "callback_url": f"{settings.APP_URL}/payments/confirm",
        "payment_channels": ["card", "bank", "ussd", "transfer"],
        "metadata": {
            "session_id": session_id,
            "behavioral_score": behavioral_score,
            "verification_method": "trustchain_biometric",
            "recipient_name": recipient_name,
            **(metadata or {}),
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                f"{BASE}/transaction/initiate",
                json=payload,
                headers=HEADERS,
            )
    except httpx.RequestError as exc:
        raise ValueError(f"Squad API unreachable: {exc}")
    try:
        data = res.json()
    except Exception:
        raise ValueError(f"Squad API returned non-JSON response (HTTP {res.status_code})")
    if data.get("status") != 200:
        raise ValueError(f"Squad payment initiation failed: {data.get('message')}")

    return data["data"]["checkout_url"], txn_ref


async def verify_transaction(transaction_ref: str) -> dict:
    """
    Verify a transaction after Squad callback.
    Returns transaction data if successful.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(
                f"{BASE}/transaction/verify/{transaction_ref}",
                headers=HEADERS,
            )
    except httpx.RequestError as exc:
        raise ValueError(f"Squad API unreachable: {exc}")
    try:
        data = res.json()
    except Exception:
        raise ValueError(f"Squad API returned non-JSON response (HTTP {res.status_code})")
    if data.get("status") != 200:
        raise ValueError(f"Transaction verification failed: {data.get('message')}")
    return data["data"]


async def fund_transfer(
    amount_naira: float,
    bank_code: str,
    account_number: str,
    account_name: str,
    session_id: str,
    behavioral_score: float,
    remark: str = "",
) -> dict:
    """
    Direct fund transfer (for high-value transactions > ₦50,000).
    Bypasses checkout — funds move directly from Squad wallet.
    """
    amount_kobo = int(amount_naira * 100)
    txn_ref = f"{settings.SQUAD_MERCHANT_ID}_TF_{session_id[:10]}_{int(time.time())}"

    payload = {
        "transaction_reference": txn_ref,
        "amount": str(amount_kobo),
        "bank_code": bank_code,
        "account_number": account_number,
        "account_name": account_name,
        "currency_id": "NGN",
        "remark": remark or f"TrustChain verified payment — score {behavioral_score:.0f}/100",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                f"{BASE}/payout/transfer",
                json=payload,
                headers=HEADERS,
            )
    except httpx.RequestError as exc:
        raise ValueError(f"Squad API unreachable: {exc}")
    try:
        data = res.json()
    except Exception:
        raise ValueError(f"Squad API returned non-JSON response (HTTP {res.status_code})")
    if data.get("status") != 200:
        raise ValueError(f"Fund transfer failed: {data.get('message')}")
    return data["data"]


async def requery_transfer(transaction_reference: str) -> dict:
    """Re-query a transfer to confirm its final status."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                f"{BASE}/payout/requery",
                json={"transaction_reference": transaction_reference},
                headers=HEADERS,
            )
    except httpx.RequestError as exc:
        raise ValueError(f"Squad API unreachable: {exc}")
    try:
        return res.json()
    except Exception:
        raise ValueError(f"Squad API returned non-JSON response (HTTP {res.status_code})")
