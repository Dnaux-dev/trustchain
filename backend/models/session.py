from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SessionDecision(str, Enum):
    APPROVED = "APPROVED"
    CHALLENGE = "CHALLENGE"
    BLOCKED = "BLOCKED"
    COMPLETE = "COMPLETE"
    PENDING = "PENDING"


class ChallengeType(str, Enum):
    OWNER = "owner"
    HELPER = "helper"


# ── Raw signal shapes from TrustChain.js SDK ──────────────────────
class KeystrokeEvent(BaseModel):
    key: str
    downTime: float
    holdDuration: Optional[float] = None


class TouchEvent(BaseModel):
    x: float
    y: float
    force: float = 0.0
    radiusX: float = 0.0
    radiusY: float = 0.0
    timestamp: float


class SwipeEvent(BaseModel):
    deltaY: float
    velocityY: float
    timestamp: float


class MotionEvent(BaseModel):
    alpha: Optional[float] = None
    beta: Optional[float] = None
    gamma: Optional[float] = None
    timestamp: float


class FieldTiming(BaseModel):
    focusTime: Optional[float] = None
    blurTime: Optional[float] = None
    keyCount: int = 0
    pasteDetected: bool = False


class TapOffset(BaseModel):
    targetId: str = ""
    offsetX: float
    offsetY: float
    timestamp: float


class RawSignals(BaseModel):
    keystrokes: List[Dict[str, Any]] = []
    touchEvents: List[Dict[str, Any]] = []
    swipeEvents: List[Dict[str, Any]] = []
    deviceMotion: List[Dict[str, Any]] = []
    fieldTimings: Dict[str, Any] = {}
    tapOffsets: List[Dict[str, Any]] = []
    extractedFeatures: List[float] = []        # ← add this
    signalHash: Optional[str] = None    # ← add this
    quality: Optional[float] = None  # ← add this



class BehavioralData(BaseModel):
    userId: str
    sessionDuration: float
    signals: RawSignals
    collectedAt: str


# ── Request bodies ─────────────────────────────────────────────────
class VerifySessionRequest(BaseModel):
    behavioralData: BehavioralData
    paymentAmount: float = Field(..., gt=0)
    recipientBankCode: str
    recipientAccount: str
    # For challenge re-attempt
    challengeType: Optional[ChallengeType] = None
    helperId: Optional[str] = None


class ChallengeSubmitRequest(BaseModel):
    sessionId: str
    behavioralData: BehavioralData
    challengeType: ChallengeType
    helperId: Optional[str] = None


# ── Response shapes ────────────────────────────────────────────────
class ScoreBreakdown(BaseModel):
    stage1_isolation_forest: float
    stage2_cosine_similarity: float
    combined: float
    sessions_in_profile: int
    profile_confidence: float


class VerifySessionResponse(BaseModel):
    decision: SessionDecision
    behavioral_score: float
    breakdown: Optional[ScoreBreakdown] = None
    session_id: str
    # APPROVED fields
    checkout_url: Optional[str] = None
    recipient_name: Optional[str] = None
    # CHALLENGE fields
    challenge_message: Optional[str] = None
    has_trusted_helpers: Optional[bool] = None
    trusted_helpers: Optional[List[Dict]] = None
    # BLOCKED fields
    block_reason: Optional[str] = None


class SessionLog(BaseModel):
    id: str
    user_id: str
    behavioral_score: float
    decision: SessionDecision
    payment_amount: float
    squad_txn_ref: Optional[str] = None
    created_at: datetime
