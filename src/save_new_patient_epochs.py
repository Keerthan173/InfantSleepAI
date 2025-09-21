import numpy as np
import os

def save_new_patient_epochs(ecg_signal, fs=100, epoch_duration=60, output_dir='new_patient_epochs'):
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
    new_ecg_signal = np.load('data/new_patient_ecg_x01.npy')
    save_new_patient_epochs(new_ecg_signal)
