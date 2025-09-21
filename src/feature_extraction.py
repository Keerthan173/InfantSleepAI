# src/feature_extraction.py
import numpy as np
import pandas as pd
import os

def extract_features(epochs_path='data/combined/all_epochs.npy', labels_path='data/combined/all_labels.npy'):
    """
    Extracts statistical features from segmented ECG epochs and saves them along with labels to CSV.
    """
    # Load processed epochs and labels
    epochs = np.load(epochs_path)   # Shape: (num_epochs, samples)
    labels = np.load(labels_path)   # Shape: (num_epochs,)
    
    features = []
    for epoch in epochs:
        feat = []
        # Time-domain statistical features
        feat.append(np.mean(epoch))
        feat.append(np.std(epoch))
        feat.append(np.min(epoch))
        feat.append(np.max(epoch))
        feat.append(np.median(epoch))
        feat.append(np.percentile(epoch, 25))
        feat.append(np.percentile(epoch, 75))
        
        # Additional feature extraction can be added here
        
        features.append(feat)
    
    feature_names = ['mean', 'std', 'min', 'max', 'median', 'p25', 'p75']
    
    # Create DataFrame with features plus labels
    df = pd.DataFrame(features, columns=feature_names)
    df['label'] = labels
    
    os.makedirs('data/combined', exist_ok=True)
    features_csv = 'data/combined/features.csv'
    df.to_csv(features_csv, index=False)
    
    print(f"Feature extraction completed. Features saved to {features_csv}")
    return features_csv

if __name__ == "__main__":
    extract_features()
