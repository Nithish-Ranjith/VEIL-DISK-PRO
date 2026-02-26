import numpy as np
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import math

# Try to import TensorFlow, but continue without it
try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    print("[HealthEngine] TensorFlow not available, using rule-based fallback")
    TF_AVAILABLE = False

try:
    import pickle
    PICKLE_AVAILABLE = True
except ImportError:
    PICKLE_AVAILABLE = False


class HealthPredictionEngine:
    """
    ENGINE 1: Predicts drive failure using Temporal Convolution Network.
    
    THE CORE IDEA:
    - Traditional tools: Look at today's SMART values
    - Our approach: Look at 30-day PATTERN of SMART values
    
    The TCN learns temporal patterns from 200M+ drive-days.
    Falls back to rule-based prediction if model unavailable.
    """
    
    MODEL_PATH = "ml/saved_models/tcn_v1.keras"
    MODEL_PATH_ALT = "models/tcn_model.keras"  # legacy fallback
    NORM_PARAMS_PATH = "ml/saved_models/norm_params.pkl"
    NORM_PARAMS_PATH_ALT = "models/norm_params.pkl"
    SEQUENCE_LENGTH = 30  # 30 days of history
    
    # The 8 SMART features our model uses (must match training order)
    FEATURE_KEYS = [
        "smart_5",    # Reallocated Sectors
        "smart_187",  # Uncorrectable Errors
        "smart_188",  # Command Timeout
        "smart_197",  # Pending Sectors
        "smart_198",  # Offline Uncorrectable
        "smart_194",  # Temperature
        "smart_9",    # Power-On Hours
        "smart_12",   # Power Cycles
    ]
    
    def __init__(self):
        self.model = None
        self.norm_params = None
        self._load_model()
    
    def _load_model(self):
        """Load the pre-trained TCN model"""
        if not TF_AVAILABLE:
            print("[HealthEngine] TensorFlow not available - using rule-based mode")
            return

        # Try primary path, then legacy fallback
        model_path = None
        for candidate in [self.MODEL_PATH, self.MODEL_PATH_ALT]:
            if os.path.exists(candidate):
                model_path = candidate
                break

        if model_path:
            try:
                self.model = keras.models.load_model(model_path)
                print(f"[HealthEngine] ✅ TCN model loaded from {model_path}")

                # Try to load normalization params
                for norm_candidate in [self.NORM_PARAMS_PATH, self.NORM_PARAMS_PATH_ALT]:
                    if PICKLE_AVAILABLE and os.path.exists(norm_candidate):
                        with open(norm_candidate, 'rb') as f:
                            self.norm_params = pickle.load(f)
                        print("[HealthEngine] ✅ Normalization parameters loaded")
                        break
                else:
                    print("[HealthEngine] ⚠️  No norm_params found — using model without normalization")

                # ── Startup self-test: run a dummy inference to catch any remaining issues ──
                try:
                    dummy = np.zeros((1, self.SEQUENCE_LENGTH, len(self.FEATURE_KEYS)), dtype=np.float32)
                    result = float(self.model.predict(dummy, verbose=0)[0][0])
                    assert 0.0 <= result <= 1.0, f"Output out of range: {result}"
                    print(f"[HealthEngine] ✅ Self-test passed — dummy inference = {result:.4f}")
                except Exception as test_err:
                    print(f"[HealthEngine] ⚠️  Self-test failed ({test_err}) — falling back to rule-based")
                    self.model = None
                    self.norm_params = None

            except Exception as e:
                print(f"[HealthEngine] ❌ Model loading failed: {e}")
                print("[HealthEngine] Falling back to rule-based scoring")
                self.model = None
        else:
            print(f"[HealthEngine] ⚠️  No trained model found at {self.MODEL_PATH}")
            print("[HealthEngine] Using rule-based scoring")
    
    def predict(self, smart_history: List[Dict]) -> Dict:
        """
        Main prediction function.
        
        Input:
            smart_history: List of dicts with SMART values for each day
        
        Output:
            Complete prediction including failure probability, health score,
            days to failure, risk level, key factors, and trend
        """
        
        if len(smart_history) < 5:
            return self._insufficient_data_response()
        
        # Prepare the input sequence
        sequence = self._prepare_sequence(smart_history)
        
        if self.model and self.norm_params:
            # Use trained TCN model
            prediction = self._tcn_predict(sequence)
        else:
            # Fallback: Rule-based scoring
            prediction = self._rule_based_predict(smart_history)
        
        return prediction
    
    def _prepare_sequence(self, smart_history: List[Dict]) -> np.ndarray:
        """
        Convert SMART history to model input format.
        Creates a (30, 8) shaped numpy array.
        """
        # Ensure we have exactly 30 days
        history = smart_history[-self.SEQUENCE_LENGTH:]
        
        # Pad if we have fewer than 30 days
        while len(history) < self.SEQUENCE_LENGTH:
            history.insert(0, history[0])  # Repeat earliest reading
        
        # Extract features in correct order
        sequence = []
        for day in history:
            smart = day.get("smart_values", day)  # Handle both formats
            features = [
                float(smart.get(key, 0)) for key in self.FEATURE_KEYS
            ]
            sequence.append(features)
        
        return np.array(sequence)  # Shape: (30, 8)
    
    def _tcn_predict(self, sequence: np.ndarray) -> Dict:
        """Use the actual trained TCN model"""
        
        # Normalize using training parameters
        mean = self.norm_params['mean']
        std = self.norm_params['std']
        
        sequence_norm = (sequence - mean) / (std + 1e-8)
        
        # Add batch dimension: (1, 30, 8)
        batch = sequence_norm[np.newaxis, ...]
        
        # Get prediction
        failure_probability = float(self.model.predict(batch, verbose=0)[0][0])
        
        # Convert to health score (inverted probability)
        health_score = int((1 - failure_probability) * 100)
        
        # Calculate days to failure with confidence interval
        days_result = self._probability_to_days(failure_probability)
        
        # Determine risk level
        risk_level = self._get_risk_level(failure_probability)
        
        # Identify key contributing factors
        key_factors = self._identify_key_factors(sequence)
        
        # Calculate trend
        trend = self._calculate_trend(sequence)
        
        return {
            "failure_probability": round(failure_probability, 4),
            "health_score": max(0, min(100, health_score)),
            "risk_level": risk_level,
            "days_to_failure": days_result["center"],
            "confidence_interval": {
                "lower_days": days_result["lower"],
                "upper_days": days_result["upper"],
                "center_days": days_result["center"]
            },
            "key_factors": key_factors,
            "trend": trend,
            "intervention_recommended": failure_probability > 0.3 or trend == "rapid_decline",
            "model_version": "TCN_v1_backblaze_q3q4_2024"
        }
    
    def _rule_based_predict(self, smart_history: List[Dict]) -> Dict:
        """
        FALLBACK: Rule-based prediction when ML model unavailable.
        Based on Backblaze's published research.
        """
        
        latest = smart_history[-1].get("smart_values", {})
        
        # Weight each attribute by its predictive power
        WEIGHTS = {
            "smart_5":   0.35,  # Reallocated sectors: highest predictor
            "smart_187": 0.25,  # Uncorrectable errors: very high
            "smart_188": 0.10,  # Command timeout: moderate
            "smart_197": 0.15,  # Pending sectors: high
            "smart_198": 0.10,  # Offline uncorrectable: moderate
            "smart_194": 0.05,  # Temperature: low (context only)
        }
        
        # Score each attribute (0 = perfect, 1 = critical)
        scores = {}
        
        scores["smart_5"] = min(1.0, latest.get("smart_5", 0) / 100.0)
        scores["smart_187"] = min(1.0, latest.get("smart_187", 0) / 20.0)
        scores["smart_188"] = min(1.0, latest.get("smart_188", 0) / 10.0)
        scores["smart_197"] = min(1.0, latest.get("smart_197", 0) / 50.0)
        scores["smart_198"] = min(1.0, latest.get("smart_198", 0) / 20.0)
        
        # Temperature scoring (optimal: 30-40°C)
        temp = latest.get("smart_194", 35)
        if temp <= 40:
            scores["smart_194"] = 0.0
        elif temp <= 50:
            scores["smart_194"] = (temp - 40) / 10.0
        else:
            scores["smart_194"] = 1.0
        
        # Calculate weighted failure probability
        failure_probability = sum(
            scores.get(key, 0) * weight
            for key, weight in WEIGHTS.items()
        )
        
        # Add acceleration bonus
        if len(smart_history) >= 7:
            acceleration = self._calculate_acceleration(smart_history)
            failure_probability = min(1.0, failure_probability + acceleration * 0.2)
        
        health_score = int((1 - failure_probability) * 100)
        days_result = self._probability_to_days(failure_probability)
        
        return {
            "failure_probability": round(failure_probability, 4),
            "health_score": max(0, min(100, health_score)),
            "risk_level": self._get_risk_level(failure_probability),
            "days_to_failure": days_result["center"],
            "confidence_interval": {
                "lower_days": days_result["lower"],
                "upper_days": days_result["upper"],
                "center_days": days_result["center"]
            },
            "key_factors": self._identify_key_factors_from_scores(scores, latest),
            "trend": self._calculate_trend(self._prepare_sequence(smart_history)),
            "intervention_recommended": failure_probability > 0.3,
            "model_version": "rule_based_fallback"
        }
    
    def _probability_to_days(self, prob: float) -> Dict:
        """
        Convert failure probability to days estimate.
        
        Based on empirical analysis of Backblaze data.
        """
        if prob >= 0.95:
            center = 3
        elif prob >= 0.9:
            center = 7
        elif prob >= 0.8:
            center = 14
        elif prob >= 0.7:
            center = 21
        elif prob >= 0.6:
            center = 45
        elif prob >= 0.5:
            center = 62
        elif prob >= 0.4:
            center = 90
        elif prob >= 0.3:
            center = 120
        elif prob >= 0.2:
            center = 180
        elif prob >= 0.1:
            center = 270
        else:
            center = 365
        
        margin = max(3, int(center * 0.20))  # ±20% margin
        
        return {
            "center": center,
            "lower": max(1, center - margin),
            "upper": center + margin
        }
    
    def _get_risk_level(self, prob: float) -> str:
        if prob >= 0.7: return "Critical"
        if prob >= 0.5: return "High"
        if prob >= 0.3: return "Medium"
        return "Low"
    
    def _calculate_acceleration(self, smart_history: List[Dict]) -> float:
        """
        Detect if error rates are ACCELERATING (dangerous pattern).
        
        Returns acceleration score (0 = stable, 1 = rapidly accelerating)
        """
        if len(smart_history) < 7:
            return 0.0
        
        accelerations = []
        
        for key in ["smart_5", "smart_187", "smart_197"]:
            recent_values = [
                d.get("smart_values", {}).get(key, 0)
                for d in smart_history[-7:]
            ]
            
            # First half slope vs second half slope
            first_half = recent_values[:3]
            second_half = recent_values[4:]
            
            slope_1 = (first_half[-1] - first_half[0]) / 3 if len(first_half) == 3 else 0
            slope_2 = (second_half[-1] - second_half[0]) / 3 if len(second_half) == 3 else 0
            
            # If getting worse faster, that's acceleration
            if slope_2 > slope_1 and slope_1 >= 0:
                acceleration = min(1.0, (slope_2 - slope_1) / max(1, slope_1 + 1))
                accelerations.append(acceleration)
        
        return max(accelerations) if accelerations else 0.0
    
    def _calculate_trend(self, sequence: np.ndarray) -> str:
        """
        Calculate health trend direction.
        Returns: improving / stable / declining / rapid_decline
        """
        if len(sequence) < 7:
            return "stable"
        
        # Use reallocated sectors and uncorrectable errors as trend indicators
        recent = sequence[-7:, 0] + sequence[-7:, 1]
        
        # Linear regression slope
        x = np.arange(len(recent))
        slope = np.polyfit(x, recent, 1)[0]
        
        if slope < -0.5:
            return "improving"
        elif slope < 0.5:
            return "stable"
        elif slope < 2.0:
            return "declining"
        else:
            return "rapid_decline"
    
    def _identify_key_factors(self, sequence: np.ndarray) -> List[Dict]:
        """Identify which SMART attributes are contributing most to risk"""
        
        factors = []
        latest = sequence[-1]
        week_ago = sequence[-7] if len(sequence) >= 7 else sequence[0]
        
        THRESHOLDS = [5, 0, 0, 0, 0, 50, 50000, 5000]
        NAMES = [
            "Reallocated Sectors", "Uncorrectable Errors",
            "Command Timeout", "Pending Sectors", "Offline Uncorrectable",
            "High Temperature", "Drive Age", "Power Cycles"
        ]
        
        for i, (name, threshold) in enumerate(zip(NAMES, THRESHOLDS)):
            current_val = latest[i]
            past_val = week_ago[i]
            
            if current_val > threshold:
                change = current_val - past_val
                factors.append({
                    "attribute": name,
                    "smart_id": self.FEATURE_KEYS[i],
                    "current_value": float(current_val),
                    "change_7_days": float(change),
                    "impact": "high" if current_val > threshold * 2 else "medium"
                })
        
        return factors[:3]  # Top 3 factors
    
    def _identify_key_factors_from_scores(self, scores: Dict, latest_smart: Dict) -> List[Dict]:
        """Alternative factor identification for rule-based fallback"""
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        factors = []
        NAMES = {
            "smart_5": "Reallocated Sectors",
            "smart_187": "Uncorrectable Errors",
            "smart_188": "Command Timeout",
            "smart_197": "Pending Sectors",
            "smart_198": "Offline Uncorrectable",
            "smart_194": "High Temperature"
        }
        
        for key, score in sorted_scores[:3]:
            if score > 0:
                factors.append({
                    "attribute": NAMES.get(key, key),
                    "smart_id": key,
                    "current_value": latest_smart.get(key, 0),
                    "impact_score": round(score, 3),
                    "impact": "high" if score > 0.5 else "medium"
                })
        
        return factors
    
    def _insufficient_data_response(self) -> Dict:
        return {
            "failure_probability": 0.05,
            "health_score": 95,
            "risk_level": "Low",
            "days_to_failure": 365,
            "confidence_interval": {"lower_days": 300, "upper_days": 365, "center_days": 365},
            "key_factors": [],
            "trend": "stable",
            "intervention_recommended": False,
            "note": "Insufficient history for accurate prediction"
        }


# Test the engine
if __name__ == "__main__":
    print("=" * 60)
    print("SENTINEL-DISK Pro - Health Engine Test")
    print("=" * 60)
    
    # Import SMART reader for testing
    from smart_reader import SMARTReader
    
    reader = SMARTReader()
    engine = HealthPredictionEngine()
    
    drives = reader.get_all_drives()
    
    print(f"\nTesting predictions for {len(drives)} drives:\n")
    
    for drive in drives:
        drive_id = drive['drive_id']
        model = drive['model']
        
        print(f"Drive: {model} ({drive_id})")
        print(f"  Current SMART: reallocated={drive['smart_values']['smart_5']}, "
              f"uncorrectable={drive['smart_values']['smart_187']}")
        
        # Get history and predict
        history = reader.get_smart_history(drive_id, days=30)
        prediction = engine.predict(history)
        
        print(f"  Prediction:")
        print(f"    Health Score: {prediction['health_score']}/100")
        print(f"    Risk Level: {prediction['risk_level']}")
        print(f"    Days to Failure: {prediction['days_to_failure']} "
              f"(range: {prediction['confidence_interval']['lower_days']}-"
              f"{prediction['confidence_interval']['upper_days']})")
        print(f"    Trend: {prediction['trend']}")
        print(f"    Intervention Recommended: {prediction['intervention_recommended']}")
        print(f"    Model: {prediction['model_version']}")
        
        if prediction['key_factors']:
            print(f"    Key Risk Factors:")
            for factor in prediction['key_factors']:
                print(f"      - {factor['attribute']}: {factor['current_value']} "
                      f"({factor['impact']} impact)")
        
        print()
