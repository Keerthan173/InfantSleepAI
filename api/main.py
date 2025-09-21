from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Apnea Alert API")

# Add CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and alerts once on startup
xgb_model = joblib.load('models/xgboost_balanced_model.pkl')
alerts_df = pd.read_csv('data/consolidated_xgboost_alerts.csv')

# Correct expected feature columns in exact training order
expected_features = [
    'mean', 'std', 'min', 'max', 'median',
    'skewness', 'kurtosis',
    'power_vlf', 'power_lf', 'power_hf',
    'app_entropy', 'sample_entropy'
]

class NamedFeatureRequest(BaseModel):
    features: Dict[str, float]

@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.post("/predict")
def predict_apnea_named(feature_request: NamedFeatureRequest):
    input_features = feature_request.features
    missing = [f for f in expected_features if f not in input_features]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing features: {missing}")

    # Construct DataFrame in correct column order
    feature_values = [input_features[f] for f in expected_features]
    features_df = pd.DataFrame([feature_values], columns=expected_features)

    try:
        preds = xgb_model.predict(features_df)[0]
        proba = xgb_model.predict_proba(features_df).max()
        label_map = {0: "Normal", 1: "Pre-apnea Warning", 2: "Apnea"}
        return {"prediction": label_map[preds], "confidence": float(proba)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alerts")
def get_apnea_alerts(limit: Optional[int] = 10):
    recent_alerts = alerts_df.tail(limit).to_dict(orient="records")
    return recent_alerts
