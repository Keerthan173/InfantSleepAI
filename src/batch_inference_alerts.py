import os
import numpy as np
import pandas as pd
import joblib
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

def batch_inference(epochs_dir='data/processed_15s_epochs', alert_threshold=0.6):
    model = load_model()
    results = []
    alarms = []

    label_map = {0: 'Normal', 1: 'Pre-apnea Warning', 2: 'Apnea'}

    for fname in sorted(os.listdir(epochs_dir)):
        if fname.endswith('.npy'):
            epoch_num = int(fname.split('_')[1].split('.')[0])
            epoch_path = os.path.join(epochs_dir, fname)
            epoch_data = np.load(epoch_path)
            label, prob = predict_epoch(model, epoch_data)

            results.append({'epoch': epoch_num, 'filename': fname, 'label': label_map[label], 'probability': prob})

            # Alert logic
            if label in [1, 2] and prob >= alert_threshold:
                alarms.append({'epoch': epoch_num, 'alert': label_map[label], 'probability': prob})
                print(f"ALERT: Epoch {epoch_num}, {label_map[label]}, Probability: {prob:.2f}")

    # Save all results
    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('epoch')
    results_df.to_csv('data/batch_inference_results.csv', index=False)
    print("Batch inference complete. Results saved to data/batch_inference_results.csv")

    if len(alarms) == 0:
        print("No alerts triggered.")
    else:
        print(f"{len(alarms)} alerts triggered.")

if __name__ == "__main__":
    batch_inference()