import numpy as np
import os
import joblib
import pandas as pd
from scipy.stats import skew, kurtosis

def load_model(path='models/multiclass_rf_model.pkl'):
    model = joblib.load(path)
    print(f"Loaded model from {path}")
    return model

def extract_features(epoch_signal):
    features = {
        'mean': np.mean(epoch_signal),
        'std': np.std(epoch_signal),
        'min': np.min(epoch_signal),
        'max': np.max(epoch_signal),
        'median': np.median(epoch_signal),
        'skewness': skew(epoch_signal),
        'kurtosis': kurtosis(epoch_signal)
    }
    return pd.DataFrame([features])
  
def predict_epoch(model, epoch_array):
    features = extract_features(epoch_array)
    pred_label = model.predict(features)[0]
    pred_prob = model.predict_proba(features).max()
    return pred_label, pred_prob

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python src/inference_multiclass.py <path_to_epoch_npy>")
        exit(1)
    
    epoch_file = sys.argv[1]
    epoch_data = np.load(epoch_file)

    model = load_model()
    label, prob = predict_epoch(model, epoch_data)

    label_map = {0: 'Normal', 1: 'Pre-apnea Warning', 2: 'Apnea'}

    print(f"Predicted label: {label} ({label_map[label]}), Probability: {prob:.2f}")