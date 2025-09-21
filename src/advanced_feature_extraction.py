import numpy as np
import pandas as pd
import os
from scipy.stats import skew, kurtosis
from scipy.signal import welch
from antropy import app_entropy, sample_entropy

def extract_hrv_features(rr_intervals):
    # RR interval statistics
    hrv_feats = {}
    hrv_feats['mean_rr'] = np.mean(rr_intervals)
    hrv_feats['std_rr'] = np.std(rr_intervals)
    hrv_feats['rmssd'] = np.sqrt(np.mean(np.diff(rr_intervals)**2))
    hrv_feats['pnn50'] = np.sum(np.abs(np.diff(rr_intervals)) > 0.05) / len(rr_intervals)
    return hrv_feats

def extract_frequency_features(epoch_signal, fs=100):
    # Power spectral density features
    f, pxx = welch(epoch_signal, fs, nperseg=min(256, len(epoch_signal)))
    bands = {'vlf': (0.003, 0.04), 'lf': (0.04, 0.15), 'hf': (0.15, 0.4)}
    freq_feats = {}
    for band, (low, high) in bands.items():
        mask = (f >= low) & (f < high)
        freq_feats[f'power_{band}'] = np.sum(pxx[mask])
    return freq_feats

def extract_nonlinear_features(epoch_signal):
    nonlinear_feats = {}
    try:
        nonlinear_feats['app_entropy'] = app_entropy(epoch_signal, order=2)
        nonlinear_feats['sample_entropy'] = sample_entropy(epoch_signal, order=2)
    except:
        nonlinear_feats['app_entropy'] = 0
        nonlinear_feats['sample_entropy'] = 0
    return nonlinear_feats

def extract_features_for_all_epochs(epochs_dir, labels_csv, output_csv='data/combined/features_advanced.csv'):
    labels_df = pd.read_csv(labels_csv)
    feature_list = []
    for idx, row in labels_df.iterrows():
        epoch_num = row['epoch']
        label = row['label']
        epoch_path = os.path.join(epochs_dir, f'epoch_{epoch_num}.npy')
        if not os.path.exists(epoch_path):
            continue
        epoch_signal = np.load(epoch_path)
        basic_feats = {
            'mean': np.mean(epoch_signal),
            'std': np.std(epoch_signal),
            'min': np.min(epoch_signal),
            'max': np.max(epoch_signal),
            'median': np.median(epoch_signal),
            'skewness': skew(epoch_signal),
            'kurtosis': kurtosis(epoch_signal)
        }
        freq_feats = extract_frequency_features(epoch_signal)
        nonlinear_feats = extract_nonlinear_features(epoch_signal)
        # If RR intervals available, add HRV features here with extract_hrv_features(rr_intervals)
        all_feats = {**basic_feats, **freq_feats, **nonlinear_feats}
        all_feats['label'] = label
        all_feats['epoch'] = epoch_num
        feature_list.append(all_feats)

    features_df = pd.DataFrame(feature_list)
    features_df.to_csv(output_csv, index=False)
    print(f"Advanced features with labels saved to {output_csv}")

if __name__ == "__main__":
    epochs_directory = 'data/processed_15s_epochs'
    label_file = 'data/epoch_labels.csv'
    extract_features_for_all_epochs(epochs_directory, label_file)