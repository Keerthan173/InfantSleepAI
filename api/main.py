from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Optional
import joblib       # loads your trained ML model
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

# Create the FastAPI app
app = FastAPI(title="Apnea Alert API")

# Add CORS middleware to allow frontend requests
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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

# Expected feature columns in exact training order
expected_features = [
    'mean', 'std', 'min', 'max', 'median',
    'skewness', 'kurtosis',
    'power_vlf', 'power_lf', 'power_hf',
    'app_entropy', 'sample_entropy'
]


# Root route (just for testing)
@app.get("/")
def home():
    return {"message": "Backend running successfully!"}


@app.get("/health")
def health_check():
    return {"status": "OK"}



# Dummy users (replace later with DB check)
users_db = {
    "caregiver1": {"password": "care123", "role": "caregiver"},
    "clinician1": {"password": "clin123", "role": "clinician"},
    "admin1": {"password": "admin123", "role": "admin"},
}

class LoginRequest(BaseModel):
    username: str
    password: str
    
@app.post("/login")
def login(request: LoginRequest):
    user = users_db.get(request.username)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful", "role": user["role"]}



class NamedFeatureRequest(BaseModel):
    features: Dict[str, float]
    

# Prediction endpoint
@app.post("/predict")
def predict_apnea_named(feature_request: NamedFeatureRequest):
    input_features = feature_request.features
    # Check for missing features
    missing = [f for f in expected_features if f not in input_features]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing features: {missing}")

    # Construct DataFrame in correct column order
    feature_values = [input_features[f] for f in expected_features]
    features_df = pd.DataFrame([feature_values], columns=expected_features)

    try:
        preds = xgb_model.predict(features_df)[0]
        proba = xgb_model.predict_proba(features_df).max()  # probabilities for each class
        label_map = {0: "Normal", 1: "Pre-apnea Warning", 2: "Apnea"}
        return {"prediction": label_map[preds], "confidence": float(proba)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alerts")
def get_apnea_alerts(limit: Optional[int] = 50):
    # Load features CSV
    df = pd.read_csv('data/combined/features_advanced_predictions.csv')
    
    # Filter to show only Apnea (2) and Warnings (1)
    alert_df = df[df['predicted_label'].isin([1, 2])]
    
    # Get most recent alerts
    recent_alerts = alert_df.tail(limit).to_dict(orient="records")
    return recent_alerts