import numpy as np
import pandas as pd
import os
from scipy.stats import skew, kurtosis

def extract_features_from_epoch(epoch_signal):
    features = {}
    features['mean'] = np.mean(epoch_signal)
    features['std'] = np.std(epoch_signal)
    features['min'] = np.min(epoch_signal)
    features['max'] = np.max(epoch_signal)
    features['median'] = np.median(epoch_signal)
    features['skewness'] = skew(epoch_signal)
    features['kurtosis'] = kurtosis(epoch_signal)
    return features

def extract_features_for_all_epochs(epochs_dir, labels_csv, output_csv='data/combined/features_multiclass.csv'):
    # Load labels
    labels_df = pd.read_csv(labels_csv)
    
    feature_list = []
    for idx, row in labels_df.iterrows():
        epoch_num = row['epoch']
        label = row['label']
        epoch_path = os.path.join(epochs_dir, f'epoch_{epoch_num}.npy')
        
        if not os.path.exists(epoch_path):
            print(f"Epoch file {epoch_path} missing, skipping.")
            continue
        
        epoch_signal = np.load(epoch_path)
        feats = extract_features_from_epoch(epoch_signal)
        feats['label'] = label
        feats['epoch'] = epoch_num
        
        feature_list.append(feats)

    features_df = pd.DataFrame(feature_list)
    features_df.to_csv(output_csv, index=False)
    print(f"Extracted features with labels saved to {output_csv}")

if __name__ == "__main__":
    epochs_directory = 'data/processed_15s_epochs'
    label_file = 'data/epoch_labels.csv'
    extract_features_for_all_epochs(epochs_directory, label_file)