import pandas as pd
import joblib
import numpy as np

def load_model(path='models/xgboost_balanced_model.pkl'):
    model = joblib.load(path)
    print(f"Loaded model from {path}")
    return model

def predict_epoch(model, features_df):
    X = features_df.drop(['label', 'epoch'], axis=1, errors='ignore')
    preds = model.predict(X)
    pred_probs = model.predict_proba(X)
    return preds, pred_probs

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python src/inference_xgboost_balanced.py <features_csv>")
        exit(1)

    features_csv = sys.argv[1]
    df = pd.read_csv(features_csv)
    
    model = load_model()
    preds, pred_probs = predict_epoch(model, df)

    label_map = {0: 'Normal', 1: 'Pre-apnea Warning', 2: 'Apnea'}

    df['predicted_label'] = preds
    df['predicted_label_str'] = df['predicted_label'].map(label_map)
    df['predicted_prob'] = pred_probs.max(axis=1)
    
    output_csv = features_csv.replace('.csv', '_predictions.csv')
    df.to_csv(output_csv, index=False)
    print(f"Predictions saved to {output_csv}")

    # Print summary counts
    counts = df['predicted_label_str'].value_counts()
    print("Prediction counts:")
    print(counts)
