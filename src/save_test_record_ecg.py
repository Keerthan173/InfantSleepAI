import wfdb
import numpy as np

# Choose a test set record, for example 'x01'
record_name = 'x01'
record = wfdb.rdrecord(f'data/raw/{record_name}')  # Adjust path as needed
ecg_signal = record.p_signal[:, 0]  # First channel ECG

# Save as .npy for new patient inference simulation
np.save(f'data/new_patient_ecg_{record_name}.npy', ecg_signal)
print(f'Saved {record_name} ECG signal as .npy')
