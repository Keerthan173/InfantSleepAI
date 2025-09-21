import numpy as np
import os

def segment_and_save_15s_epochs(ecg_signal, fs=100, epoch_duration=15, output_dir='data/processed_15s_epochs'):
    epoch_length = fs * epoch_duration
    total_samples = len(ecg_signal)
    num_epochs = total_samples // epoch_length
    os.makedirs(output_dir, exist_ok=True)

    for i in range(num_epochs):
        start_idx = i * epoch_length
        end_idx = start_idx + epoch_length
        epoch = ecg_signal[start_idx:end_idx]
        file_path = os.path.join(output_dir, f'epoch_{i+1}.npy')
        np.save(file_path, epoch)
        print(f"Saved epoch {i+1} to {file_path}")

if __name__ == "__main__":
    # Load some actual ECG signal here instead of the random example:
    example_ecg = np.load("data/new_patient_ecg_x01.npy")  # Simulate 100 Hz, 100 minutes of data
    segment_and_save_15s_epochs(example_ecg)