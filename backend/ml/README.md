# Machine Learning Pipeline

This directory contains the scripts for training the Sentinel-Disk Pro failure prediction model.

## Prerequisites
Ensure dependencies are installed:
```bash
cd backend
pip install -r requirements.txt
```

## 1. Data Pipeline
Downloads Backblaze hard drive data (Q3 & Q4 2024), filters for `ST12000NM0008` (Seagate Exos 12TB) drives, and preprocesses it into sequences.

```bash
python ml/data_pipeline.py
```
*Note: This downloads a large zip file (~1GB+).*

## 2. Model Training
Trains a TCN (Temporal Convolutional Network) on the processed data.

```bash
python ml/train_model.py
```
*Output: `ml/saved_models/tcn_v1.keras`*

## 3. Inference
The model is automatically loaded by `backend/models/health_model.py`. If the model file is missing, the system falls back to the heuristic engine.

## 4. Real-Time Monitoring
To use the real-time SMART collector:
```bash
# May require sudo on macOS/Linux
sudo python ml/smart_collector.py
```
