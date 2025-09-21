# src/data_processing.py
import wfdb
import numpy as np
from scipy.signal import resample, butter, filtfilt
import os
import glob
import shutil
from tqdm import tqdm
import multiprocessing as mp
from functools import partial
from constants import FS, EPOCH_DURATION


def download_and_preprocess(record_name, target_fs=FS):
    record_path = os.path.join('data/raw', record_name)
    if not os.path.exists(record_path):
        print(f"Downloading record {record_name}...")
        wfdb.dl_database('apnea-ecg', dl_dir='data/raw', records=[record_name])
    else:
        print(f"Using existing record {record_name}.")

    try:
        record = wfdb.rdrecord(record_path)
        annotation = wfdb.rdann(record_path, 'apn')
        signals = record.p_signal[:, 0:1]  # ECG first channel
        fs = record.fs
        if fs != target_fs:
            signals = resample(signals, int(signals.shape[0] * target_fs / fs))
        b, a = butter(4, [0.5, 40], btype='bandpass', fs=target_fs)
        signals_filtered = filtfilt(b, a, signals, axis=0)
        signals_normalized = (signals_filtered - np.mean(signals_filtered)) / np.std(signals_filtered)
        return signals_normalized, annotation, target_fs
    except Exception as e:
        print(f"Error processing {record_name}: {e}")
        return None, None, None


def segment_epochs(signals, fs=FS, epoch_duration=EPOCH_DURATION):
    if signals is None:
        return np.array([])
    epoch_length = fs * epoch_duration
    total_samples = signals.shape[0]
    num_epochs = total_samples // epoch_length
    if num_epochs == 0:
        print("Signal too short for an epoch")
        return np.array([])
    trimmed_signals = signals[:num_epochs * epoch_length]
    return trimmed_signals.reshape(num_epochs, epoch_length, -1)


def get_labels(annotation, fs=FS, epoch_duration=EPOCH_DURATION, epochs=None):
    if annotation is None or epochs is None or len(epochs) == 0:
        return np.array([])
    sample_indices = annotation.sample * (fs // annotation.fs)
    epoch_length = fs * epoch_duration
    labels = np.zeros(len(epochs), dtype=int)
    for i in range(len(epochs)):
        start_idx = i * epoch_length
        end_idx = start_idx + epoch_length
        has_apnea = any(
            (start_idx <= idx < end_idx) and (symbol == 'A')
            for idx, symbol in zip(sample_indices, annotation.symbol)
        )
        labels[i] = 1 if has_apnea else 0
    return labels


def save_processed_data(epochs, labels, record_name):
    if len(epochs) == 0 or len(labels) == 0:
        print(f"Skipping {record_name} - no valid data")
        return
    os.makedirs('data/processed', exist_ok=True)
    np.save(f'data/processed/{record_name}_epochs.npy', epochs)
    np.save(f'data/processed/{record_name}_labels.npy', labels)


def process_single_record(record_name):
    signals, annotation, fs = download_and_preprocess(record_name)
    if signals is None:
        return None
    epochs = segment_epochs(signals, fs)
    labels = get_labels(annotation, fs, epochs=epochs)
    if len(epochs) > 0:
        save_processed_data(epochs, labels, record_name)
        return True
    return None


def process_all_records():
    records = wfdb.get_record_list('apnea-ecg')
    print(f"Processing {len(records)} records...")
    results = []
    for record in tqdm(records):
        results.append(process_single_record(record))
    success = sum(1 for r in results if r)
    print(f"Processed successfully: {success}/{len(records)}")


def combine_processed_data():
    epochs_files = sorted(glob.glob('data/processed/*_epochs.npy'))
    labels_files = sorted(glob.glob('data/processed/*_labels.npy'))
    all_epochs, all_labels = [], []
    for ef, lf in zip(epochs_files, labels_files):
        all_epochs.append(np.load(ef)[:, :, 0])  # Use first channel
        all_labels.append(np.load(lf))
    combined_epochs = np.concatenate(all_epochs)
    combined_labels = np.concatenate(all_labels)
    os.makedirs('data/combined', exist_ok=True)
    np.save('data/combined/all_epochs.npy', combined_epochs)
    np.save('data/combined/all_labels.npy', combined_labels)
    print(f"Combined dataset shapes: {combined_epochs.shape}, {combined_labels.shape}")


def cleanup_data():
    for folder in ['data/processed', 'data/combined']:
        if os.path.exists(folder):
            shutil.rmtree(folder)
            print(f"Removed directory {folder}")


if __name__ == "__main__":
    # Comment out cleanup_data() to keep raw data
    # cleanup_data()
    process_all_records()
    combine_processed_data()