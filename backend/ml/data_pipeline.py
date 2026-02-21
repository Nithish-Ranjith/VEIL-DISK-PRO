"""
SENTINEL-DISK Pro — Data Pipeline

Downloads real Backblaze hard drive failure data (Q3+Q4 2024),
filters for target drive models, and preprocesses into sequences
ready for TCN training.

Run from backend/ directory:
    python ml/data_pipeline.py

Output: ml/data/processed/training_data.csv
Note: Downloads ~2GB of data. Takes 5-15 minutes depending on connection.
"""

import os
import requests
import zipfile
import pandas as pd
import numpy as np
from datetime import datetime

# ── Paths ──────────────────────────────────────────────────────────────────────
DATA_DIR      = "ml/data"
RAW_DIR       = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

# ── Backblaze data URLs ────────────────────────────────────────────────────────
DATA_URLS = [
    "https://f001.backblazeb2.com/file/Backblaze-Hard-Drive-Data/data_Q3_2024.zip",
    "https://f001.backblazeb2.com/file/Backblaze-Hard-Drive-Data/data_Q4_2024.zip",
]

# ── Target models — use multiple popular models for more failure samples ───────
# ST12000NM0008 is the primary target but we include others for more data
TARGET_MODELS = [
    "ST12000NM0008",   # Seagate Exos 12TB — most common in Backblaze fleet
    "ST8000NM0055",    # Seagate 8TB
    "ST4000DM000",     # Seagate 4TB
    "HGST HUH721212ALN604",  # HGST 12TB
]

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


def ensure_dirs():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)


def download_data():
    """Download and extract Backblaze quarterly datasets."""
    ensure_dirs()

    for url in DATA_URLS:
        filename = url.split("/")[-1]
        zip_path = os.path.join(RAW_DIR, filename)

        if os.path.exists(zip_path):
            print(f"[Download] {filename} already exists — skipping download.")
        else:
            print(f"[Download] Downloading {filename}...")
            print(f"           URL: {url}")
            try:
                with requests.get(url, stream=True, timeout=300) as r:
                    r.raise_for_status()
                    total_size = int(r.headers.get("content-length", 0))
                    downloaded = 0
                    with open(zip_path, "wb") as f:
                        for chunk in r.iter_content(chunk_size=1024 * 1024):  # 1MB chunks
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                pct = downloaded / total_size * 100
                                mb  = downloaded / (1024 * 1024)
                                total_mb = total_size / (1024 * 1024)
                                print(f"\r           {mb:.0f} MB / {total_mb:.0f} MB ({pct:.1f}%)", end="", flush=True)
                print(f"\n[Download] ✅ {filename} downloaded.")
            except Exception as e:
                print(f"\n[Download] ❌ Failed to download {filename}: {e}")
                if os.path.exists(zip_path):
                    os.remove(zip_path)
                continue

        # Extract
        extract_dir = os.path.join(RAW_DIR, filename.replace(".zip", ""))
        if os.path.exists(extract_dir):
            print(f"[Extract]  {filename} already extracted — skipping.")
        else:
            print(f"[Extract]  Extracting {filename}...")
            try:
                with zipfile.ZipFile(zip_path, "r") as zf:
                    zf.extractall(RAW_DIR)
                print(f"[Extract]  ✅ Done.")
            except zipfile.BadZipFile as e:
                print(f"[Extract]  ❌ Bad zip file: {e}")


def preprocess_data():
    """
    Read all daily CSVs, filter for target drive models,
    fill missing SMART values, and save a clean training CSV.

    The output CSV has columns:
        date, serial_number, model, failure, smart_5_raw, ..., smart_12_raw
    """
    print("\n[Preprocess] Scanning for CSV files...")
    all_files = []
    for root, dirs, files in os.walk(RAW_DIR):
        # Skip macOS metadata directories
        if "__MACOSX" in root or ".DS_Store" in root:
            continue
        for fname in sorted(files):
            if fname.endswith(".csv") and not fname.startswith("._"):
                all_files.append(os.path.join(root, fname))

    if not all_files:
        print("[Preprocess] ❌ No CSV files found. Run download_data() first.")
        return False

    print(f"[Preprocess] Found {len(all_files)} CSV files.")

    dfs = []
    total_rows = 0
    failure_rows = 0

    for i, fpath in enumerate(all_files):
        try:
            df = pd.read_csv(fpath, low_memory=False)

            # Filter to target models
            df = df[df["model"].isin(TARGET_MODELS)]
            if df.empty:
                continue

            # Select only needed columns
            needed_cols = ["date", "serial_number", "model", "failure"] + FEATURES
            available   = [c for c in needed_cols if c in df.columns]
            missing     = [c for c in FEATURES if c not in df.columns]
            df = df[available]

            # Add missing SMART columns as 0
            for col in missing:
                df[col] = 0

            total_rows   += len(df)
            failure_rows += df["failure"].sum()
            dfs.append(df)

            if (i + 1) % 20 == 0 or (i + 1) == len(all_files):
                print(f"[Preprocess] Processed {i+1}/{len(all_files)} files | "
                      f"{total_rows:,} rows | {failure_rows:,} failures", end="\r")

        except Exception as e:
            print(f"\n[Preprocess] Warning: could not read {fpath}: {e}")

    print()  # newline after \r

    if not dfs:
        print(f"[Preprocess] ❌ No data found for models: {TARGET_MODELS}")
        print("[Preprocess]    Try expanding TARGET_MODELS list.")
        return False

    print(f"\n[Preprocess] Concatenating {len(dfs)} dataframes...")
    full_df = pd.concat(dfs, ignore_index=True)

    # Parse and sort by date
    full_df["date"] = pd.to_datetime(full_df["date"])
    full_df = full_df.sort_values(["serial_number", "date"]).reset_index(drop=True)

    # Fill NaN SMART values with 0 (missing = no error reported)
    for col in FEATURES:
        full_df[col] = pd.to_numeric(full_df[col], errors="coerce").fillna(0)

    # Clip extreme outliers (99.9th percentile) to reduce noise
    for col in FEATURES:
        cap = full_df[col].quantile(0.999)
        if cap > 0:
            full_df[col] = full_df[col].clip(upper=cap)

    print(f"\n[Preprocess] Final dataset:")
    print(f"             Rows:           {len(full_df):,}")
    print(f"             Unique drives:  {full_df['serial_number'].nunique():,}")
    print(f"             Models:         {full_df['model'].unique().tolist()}")
    print(f"             Failure events: {full_df['failure'].sum():,}")
    print(f"             Date range:     {full_df['date'].min().date()} → {full_df['date'].max().date()}")

    # Save
    out_path = os.path.join(PROCESSED_DIR, "training_data.csv")
    full_df.to_csv(out_path, index=False)
    print(f"\n[Preprocess] ✅ Saved to {out_path}")
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("SENTINEL-DISK Pro — Data Pipeline")
    print("=" * 60)
    print(f"Target models: {TARGET_MODELS}")
    print(f"Features:      {len(FEATURES)} SMART attributes")
    print()

    download_data()
    success = preprocess_data()

    if success:
        print("\n✅ Data pipeline complete. Run: python ml/train_model.py")
    else:
        print("\n❌ Pipeline failed. Check errors above.")
