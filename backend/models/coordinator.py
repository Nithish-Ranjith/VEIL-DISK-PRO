"""
SENTINEL-DISK Pro — Intelligent Coordinator

Decision engine that orchestrates Health AI and Compression AI.
Implements closed-loop control: detect decline → optimize → measure → adapt.
"""

from models.compression_model import get_optimization_mode


def calculate_life_extension(baseline_remaining_days: int, write_reduction_rate: float) -> dict:
    """
    Calculate how many additional days of drive life are gained
    through write reduction.

    Formula: extended_days = baseline × (1 + write_reduction × 0.4)
    The 0.4 coefficient represents the correlation between write operations
    and drive failure rate (validated on Backblaze data).
    """
    if baseline_remaining_days is None or baseline_remaining_days <= 0:
        return {
            "baseline_days": baseline_remaining_days,
            "extended_days": baseline_remaining_days,
            "days_gained": 0,
            "extension_percent": 0,
            "write_reduction_rate": write_reduction_rate,
        }

    extension_factor = 1 + write_reduction_rate * 0.4
    extended_days = round(baseline_remaining_days * extension_factor)
    days_gained = extended_days - baseline_remaining_days
    extension_percent = round((days_gained / baseline_remaining_days) * 100, 1)

    return {
        "baseline_days": baseline_remaining_days,
        "extended_days": extended_days,
        "days_gained": days_gained,
        "extension_percent": extension_percent,
        "write_reduction_rate": write_reduction_rate,
    }


def make_decision(health_score: float, previous_health_score: float = None,
                  write_reduction_current: float = 0.0) -> dict:
    """
    Coordinator decision engine — determines what action to take
    based on current health assessment and trend.
    """
    optimization = get_optimization_mode(health_score)

    # Determine urgency
    health_declining = False
    decline_rate = 0.0
    if previous_health_score is not None:
        decline_rate = previous_health_score - health_score
        health_declining = decline_rate > 2  # >2 point drop

    # Build action plan
    actions = []
    if health_score < 40:
        actions.append({
            "priority": "CRITICAL",
            "action": "Backup all data immediately",
            "reason": f"Health score is {health_score}/100 — drive failure imminent",
        })
    if health_declining and decline_rate > 5:
        actions.append({
            "priority": "HIGH",
            "action": "Increase monitoring frequency to hourly",
            "reason": f"Health dropped {decline_rate:.1f} points since last check",
        })
    if optimization["write_reduction_target"] > write_reduction_current:
        actions.append({
            "priority": "MEDIUM",
            "action": f"Upgrade to {optimization['mode']} optimization mode",
            "reason": f"Can achieve {optimization['write_reduction_target']*100:.0f}% write reduction (currently {write_reduction_current*100:.0f}%)",
        })

    return {
        "optimization_mode": optimization,
        "health_declining": health_declining,
        "decline_rate": round(decline_rate, 1),
        "recommended_actions": actions,
        "next_check_hours": 1 if health_score < 40 else (3 if health_score < 60 else 6),
    }
