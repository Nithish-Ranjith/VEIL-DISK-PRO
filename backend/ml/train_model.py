"""
SENTINEL-DISK Pro — TCN Training Script

Trains a Temporal Convolutional Network on real Backblaze hard drive data.
Downloads Q3+Q4 2024 data, preprocesses it, trains the model, and saves:
  - ml/saved_models/tcn_v1.keras       (the trained model)
  - ml/saved_models/norm_params.pkl    (StandardScaler for inference)

Run from backend/ directory:
    python ml/train_model.py
"""

import os
import sys
import numpy as np
import pandas as pd
import pickle
import joblib

# ── Paths ──────────────────────────────────────────────────────────────────────
DATA_FILE        = "ml/data/processed/training_data.csv"
MODEL_PATH       = "ml/saved_models/tcn_v1.keras"
NORM_PARAMS_PATH = "ml/saved_models/norm_params.pkl"

os.makedirs("ml/saved_models", exist_ok=True)

# ── Feature config (must match data_pipeline.py) ──────────────────────────────
SEQUENCE_LENGTH = 30
FEATURES = [
    "smart_5_raw",   # Reallocated Sectors
    "smart_187_raw", # Uncorrectable Errors
    "smart_188_raw", # Command Timeout
    "smart_197_raw", # Pending Sectors
    "smart_198_raw", # Offline Uncorrectable
    "smart_194_raw", # Temperature
    "smart_9_raw",   # Power-On Hours
    "smart_12_raw",  # Power Cycle Count
]

# ── Imports that may fail ──────────────────────────────────────────────────────
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (
        Conv1D, Dense, Dropout, GlobalMaxPooling1D, BatchNormalization
    )
    from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
    from tensorflow.keras.optimizers import Adam
    TF_AVAILABLE = True
except ImportError:
    print("❌ TensorFlow not installed. Run: pip install tensorflow")
    sys.exit(1)

try:
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import roc_auc_score, classification_report
    SKLEARN_AVAILABLE = True
except ImportError:
    print("❌ scikit-learn not installed. Run: pip install scikit-learn")
    sys.exit(1)


# ── Sequence creation ──────────────────────────────────────────────────────────

def create_sequences(df: pd.DataFrame, seq_len: int = 30):
    """
    Convert per-drive daily SMART readings into (X, y) sequences.

    X shape: (N, seq_len, n_features)
    y shape: (N,)  — 1 if drive fails within next 7 days, else 0
    """
    X_list, y_list = [], []
    grouped = df.groupby("serial_number")

    for serial, group in grouped:
        group = group.sort_values("date")
        data    = group[FEATURES].values.astype(np.float32)
        targets = group["failure"].values

        if len(data) < seq_len:
            continue

        for i in range(len(data) - seq_len):
            window  = data[i : i + seq_len]
            # Label: does this drive fail in the next 7 days?
            horizon = targets[i + seq_len : i + seq_len + 7]
            label   = 1 if np.any(horizon == 1) else 0
            X_list.append(window)
            y_list.append(label)

    if not X_list:
        return np.array([]), np.array([])

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32)


# ── Model architecture ─────────────────────────────────────────────────────────

def build_tcn(input_shape):
    """
    Temporal Convolutional Network with dilated causal convolutions.
    Dilation rates [1, 2, 4] give a receptive field of 21 time steps.
    """
    model = Sequential([
        # Block 1 — local patterns
        Conv1D(64, kernel_size=3, padding="causal", activation="relu",
               input_shape=input_shape),
        BatchNormalization(),
        Dropout(0.2),

        # Block 2 — medium-range patterns (dilation=2)
        Conv1D(64, kernel_size=3, padding="causal", activation="relu",
               dilation_rate=2),
        BatchNormalization(),
        Dropout(0.2),

        # Block 3 — long-range patterns (dilation=4)
        Conv1D(128, kernel_size=3, padding="causal", activation="relu",
               dilation_rate=4),
        BatchNormalization(),
        Dropout(0.3),

        # Aggregate across time
        GlobalMaxPooling1D(),

        # Classification head
        Dense(64, activation="relu"),
        Dropout(0.3),
        Dense(32, activation="relu"),
        Dense(1, activation="sigmoid"),
    ], name="TCN_v1")

    model.compile(
        optimizer=Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=["AUC", "accuracy"],
    )
    return model


# ── Main training function ─────────────────────────────────────────────────────

def train():
    print("=" * 60)
    print("SENTINEL-DISK Pro — TCN Training")
    print("=" * 60)

    # 1. Load data
    if not os.path.exists(DATA_FILE):
        print(f"\n❌ Data file not found: {DATA_FILE}")
        print("   Run first: python ml/data_pipeline.py")
        sys.exit(1)

    print(f"\n[1/7] Loading data from {DATA_FILE}...")
    df = pd.read_csv(DATA_FILE)
    print(f"      Loaded {len(df):,} rows | "
          f"{df['serial_number'].nunique():,} unique drives | "
          f"{df['failure'].sum():,} failure events")

    # 2. Create sequences
    print("\n[2/7] Creating 30-day sequences...")
    X, y = create_sequences(df, SEQUENCE_LENGTH)

    if len(X) == 0:
        print("❌ No sequences created. Check data format.")
        sys.exit(1)

    print(f"      X shape: {X.shape}  |  y shape: {y.shape}")
    print(f"      Failure rate: {y.mean()*100:.2f}%  "
          f"({y.sum():,} failure / {(1-y).sum():,} healthy)")

    # 3. Normalize — fit StandardScaler on training data
    print("\n[3/7] Fitting StandardScaler on feature sequences...")
    # Reshape to (N*seq_len, features) for scaler fitting
    N, T, F = X.shape
    X_flat = X.reshape(-1, F)
    scaler = StandardScaler()
    scaler.fit(X_flat)

    # Save scaler as norm_params.pkl
    norm_params = {
        "mean": scaler.mean_.astype(np.float32),
        "std":  scaler.scale_.astype(np.float32),
        "feature_names": FEATURES,
        "sequence_length": SEQUENCE_LENGTH,
    }
    with open(NORM_PARAMS_PATH, "wb") as f:
        pickle.dump(norm_params, f)
    print(f"      ✅ Saved norm_params.pkl → {NORM_PARAMS_PATH}")
    print(f"      Feature means: {scaler.mean_.round(4)}")
    print(f"      Feature stds:  {scaler.scale_.round(4)}")

    # Apply normalization
    X_norm = scaler.transform(X_flat).reshape(N, T, F).astype(np.float32)

    # 4. Handle class imbalance — undersample majority class
    print("\n[4/7] Balancing dataset (1:4 failure:healthy ratio)...")
    idx_fail    = np.where(y == 1)[0]
    idx_healthy = np.where(y == 0)[0]

    if len(idx_fail) == 0:
        print("❌ No failure samples found. Cannot train meaningful model.")
        sys.exit(1)

    # Keep all failures + 4× as many healthy samples
    ratio = 4
    n_healthy_keep = min(len(idx_fail) * ratio, len(idx_healthy))
    rng = np.random.default_rng(42)
    idx_healthy_keep = rng.choice(idx_healthy, size=n_healthy_keep, replace=False)
    indices = np.concatenate([idx_fail, idx_healthy_keep])
    rng.shuffle(indices)

    X_bal = X_norm[indices]
    y_bal = y[indices]
    print(f"      Balanced: {len(X_bal):,} samples "
          f"({y_bal.sum():,} failure / {(1-y_bal).sum():,} healthy)")

    # 5. Train/test split
    print("\n[5/7] Splitting into train/validation sets (80/20)...")
    X_train, X_val, y_train, y_val = train_test_split(
        X_bal, y_bal, test_size=0.2, random_state=42, stratify=y_bal
    )
    print(f"      Train: {len(X_train):,}  |  Val: {len(X_val):,}")

    # 6. Build and train model
    print("\n[6/7] Building TCN model...")
    model = build_tcn((SEQUENCE_LENGTH, len(FEATURES)))
    model.summary()

    callbacks = [
        ModelCheckpoint(
            MODEL_PATH,
            save_best_only=True,
            monitor="val_auc",
            mode="max",
            verbose=1,
        ),
        EarlyStopping(
            monitor="val_auc",
            patience=8,
            mode="max",
            verbose=1,
            restore_best_weights=True,
        ),
        ReduceLROnPlateau(
            monitor="val_auc",
            factor=0.5,
            patience=3,
            mode="max",
            verbose=1,
            min_lr=1e-6,
        ),
    ]

    print("\nStarting training (up to 30 epochs with early stopping)...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=30,
        batch_size=64,
        callbacks=callbacks,
        class_weight={0: 1.0, 1: ratio},  # Extra weight on failure class
        verbose=1,
    )

    # 7. Evaluate
    print("\n[7/7] Evaluating on validation set...")
    y_pred_prob = model.predict(X_val, verbose=0).flatten()
    y_pred      = (y_pred_prob >= 0.5).astype(int)
    auc         = roc_auc_score(y_val, y_pred_prob)

    print(f"\n{'='*60}")
    print(f"  Final Validation AUC:  {auc:.4f}")
    print(f"  Best val_auc achieved: {max(history.history['val_auc']):.4f}")
    print(f"\n{classification_report(y_val, y_pred, target_names=['Healthy','Failure'])}")
    print(f"{'='*60}")
    print(f"\n✅ Model saved  → {MODEL_PATH}")
    print(f"✅ Scaler saved → {NORM_PARAMS_PATH}")
    print("\nRestart the backend to load the trained model.")


if __name__ == "__main__":
    train()
