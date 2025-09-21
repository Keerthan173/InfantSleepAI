# src/inference.py
import numpy as np
import pandas as pd
import joblib
from scipy.signal import resample, butter, filtfilt

MODEL_PATH = '../models/apnea_model.pkl'

def preprocess_signal(signal, target_fs=100):
    fs_orig = 100  # Adjust if original frequency differs
    if fs_orig != target_fs:
        signal = resample(signal, int(len(signal) * target_fs / fs_orig))
    b, a = butter(4, [0.5, 40], btype='bandpass', fs=target_fs)
    filtered = filtfilt(b, a, signal)
    normalized = (filtered - np.mean(filtered)) / np.std(filtered)
    return normalized

def extract_features(epoch):
    features = [
        np.mean(epoch),
        np.std(epoch),
        np.min(epoch),
        np.max(epoch),
        np.median(epoch),
        np.percentile(epoch, 25),
        np.percentile(epoch, 75)
    ]
    columns = ['mean', 'std', 'min', 'max', 'median', 'p25', 'p75']
    df_features = pd.DataFrame([features], columns=columns)
    return df_features

def load_model(path=MODEL_PATH):
    model = joblib.load(path)
    print(f"Loaded model from {path}")
    return model

def predict_apnea(model, signal_epoch):
    features = extract_features(signal_epoch)
    pred_prob = model.predict_proba(features)[0,1]
    pred_label = model.predict(features)[0]
    return pred_label, pred_prob

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python src/inference.py <path_to_epoch_npy>")
        exit(1)
    
    epoch_file = sys.argv[1]
    signal_epoch = np.load(epoch_file)

    preprocessed_epoch = preprocess_signal(signal_epoch)
    model = load_model()
    label, prob = predict_apnea(model, preprocessed_epoch)
    print(f"Predicted label: {label}, Probability: {prob:.2f}")