"""
SENTINEL-DISK Pro — Optimize API Route

POST /api/v1/optimize
Triggers compression optimization based on drive health.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from models.compression_model import get_optimization_mode
from models.coordinator import make_decision, calculate_life_extension
from sample_data import get_drive

router = APIRouter()


class OptimizeRequest(BaseModel):
    drive_id: str = Field(..., description="Unique drive identifier")
    health_score: Optional[float] = Field(None, description="Current health score. If omitted, uses stored value.")


class ActionItem(BaseModel):
    priority: str
    action: str
    reason: str


class OptimizationMode(BaseModel):
    mode: str
    description: str
    write_reduction_target: float
    actions: List[str]


class LifeExtensionResult(BaseModel):
    baseline_days: Optional[int]
    extended_days: Optional[int]
    days_gained: int
    extension_percent: float
    write_reduction_rate: float


class OptimizeResponse(BaseModel):
    drive_id: str
    optimization_triggered: bool
    optimization_mode: OptimizationMode
    expected_write_reduction: float
    life_extension: LifeExtensionResult
    recommended_actions: List[ActionItem]
    timestamp: str


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_drive(request: OptimizeRequest):
    """
    Trigger or evaluate compression optimization for a drive.
    """
    drive = get_drive(request.drive_id)

    if request.health_score is not None:
        health_score = request.health_score
    elif drive:
        health_score = drive["health_score"]
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Drive '{request.drive_id}' not found."
        )

    # Get previous health score for trend analysis
    previous_health = None
    if drive and drive.get("health_history"):
        prev = drive["health_history"][-2] if len(drive["health_history"]) >= 2 else None
        if prev:
            previous_health = prev["score"]

    current_reduction = drive["write_reduction"] if drive else 0.0

    # Run coordinator decision engine
    decision = make_decision(health_score, previous_health, current_reduction)

    # Calculate life extension
    baseline_days = None
    if drive:
        baseline_days = drive.get("life_extension", {}).get("baseline_remaining_days")
    if baseline_days is None and health_score < 80:
        baseline_days = int(200 * (health_score / 100) ** 2)

    life_ext = calculate_life_extension(
        baseline_days or 0,
        decision["optimization_mode"]["write_reduction_target"]
    )

    should_trigger = health_score < 80 or (previous_health and previous_health - health_score > 5)

    return OptimizeResponse(
        drive_id=request.drive_id,
        optimization_triggered=should_trigger,
        optimization_mode=OptimizationMode(**decision["optimization_mode"]),
        expected_write_reduction=decision["optimization_mode"]["write_reduction_target"],
        life_extension=LifeExtensionResult(**life_ext),
        recommended_actions=[ActionItem(**a) for a in decision["recommended_actions"]],
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
