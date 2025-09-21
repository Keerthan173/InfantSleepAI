import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.metrics import classification_report
import joblib

def train_xgboost_balanced(features_csv='data/combined/features_advanced.csv', model_path='models/xgboost_balanced_model.pkl'):
    df = pd.read_csv(features_csv)
    X = df.drop(['label', 'epoch'], axis=1)
    y = df['label']

    # Apply SMOTE oversampling
    smote = SMOTE(random_state=42)
    X_res, y_res = smote.fit_resample(X, y)

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X_res, y_res, test_size=0.2, random_state=42, stratify=y_res)

    # XGBoost classifier
    clf = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
    clf.fit(X_train, y_train)

    # Predict and evaluate
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred, digits=4))

    # Save model
    joblib.dump(clf, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_xgboost_balanced()
