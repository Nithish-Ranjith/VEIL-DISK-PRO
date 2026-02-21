"""
SENTINEL-DISK Pro — Predict API Route

POST /api/v1/predict
Accepts drive SMART history and returns failure prediction.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from models.health_model import compute_health_score
from sample_data import get_drive

router = APIRouter()


class SmartReading(BaseModel):
    timestamp: str
    smart_5: int = 0
    smart_187: int = 0
    smart_188: int = 0
    smart_197: int = 0
    smart_198: int = 0
    smart_194: float = 35.0
    smart_9: int = 0
    smart_12: int = 0


class PredictRequest(BaseModel):
    drive_id: str = Field(..., description="Unique drive identifier")
    smart_history: Optional[List[SmartReading]] = Field(
        None, description="30-day SMART history. If omitted, uses stored data."
    )


class KeyFactor(BaseModel):
    attribute: str
    name: str
    impact: str
    current_value: float
    score: float


class ConfidenceInterval(BaseModel):
    lower: int
    upper: int


class PredictionResult(BaseModel):
    failure_probability: float
    confidence_interval: Optional[ConfidenceInterval]
    risk_level: str
    days_to_failure: Optional[int]
    health_score: float
    key_factors: List[KeyFactor]


class PredictResponse(BaseModel):
    drive_id: str
    prediction: PredictionResult
    timestamp: str


@router.post("/predict", response_model=PredictResponse)
async def predict_failure(request: PredictRequest):
    """
    Predict drive failure based on SMART attribute history.

    If smart_history is provided, uses that data directly.
    Otherwise, retrieves stored history for the given drive_id.
    """
    # Get SMART history
    if request.smart_history:
        history = [reading.model_dump() for reading in request.smart_history]
    else:
        drive = get_drive(request.drive_id)
        if not drive:
            raise HTTPException(
                status_code=404,
                detail=f"Drive '{request.drive_id}' not found. Available: DRIVE_A_HEALTHY, DRIVE_B_WARNING, DRIVE_C_CRITICAL"
            )
        history = drive["smart_history"]

    # Run prediction
    result = compute_health_score(history)

    return PredictResponse(
        drive_id=request.drive_id,
        prediction=PredictionResult(
            failure_probability=result["failure_probability"],
            confidence_interval=ConfidenceInterval(**result["confidence_interval"]) if result["confidence_interval"] else None,
            risk_level=result["risk_level"],
            days_to_failure=result["days_to_failure"],
            health_score=result["health_score"],
            key_factors=[KeyFactor(**f) for f in result["key_factors"]],
        ),
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
