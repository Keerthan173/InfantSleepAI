import numpy as np
import pandas as pd

def create_15s_epoch_labels(epochs_dir, annotation_df, fs=100, epoch_duration=15):
    """
    Assign labels to 15-sec epochs with pre-apnea warning (1) and apnea (2).
    
    Args:
    - epochs_dir: directory with segmented 15-s epochs (named epoch_1.npy, epoch_2.npy,...)
    - annotation_df: DataFrame with columns 'start_sec', 'end_sec' for apnea events (in seconds)
    - fs: sampling frequency (Hz)
    - epoch_duration: duration of each epoch in seconds
    
    Returns:
    - labels: list of integer labels for each epoch
    """
    
    import os
    num_epochs = len([f for f in os.listdir(epochs_dir) if f.endswith('.npy')])
    labels = np.zeros(num_epochs, dtype=int)
    
    # Convert apnea event times to epoch indices
    for _, row in annotation_df.iterrows():
        apnea_start = row['start_sec']
        apnea_end = row['end_sec']
        
        # Apnea epoch indices (1-based)
        start_epoch = int(apnea_start // epoch_duration) + 1
        end_epoch = int(apnea_end // epoch_duration) + 1
        
        # Pre-apnea epochs: 1 epoch before start_epoch
        pre_apnea_epoch = max(start_epoch - 1, 1)
        
        # Assign apnea label (2)
        for e in range(start_epoch, end_epoch + 1):
            if e <= num_epochs:
                labels[e-1] = 2
        
        # Assign pre-apnea label (1) if not already apnea
        if pre_apnea_epoch <= num_epochs and labels[pre_apnea_epoch - 1] == 0:
            labels[pre_apnea_epoch - 1] = 1
    
    return labels

if __name__ == "__main__":
    # Load your apnea annotations from CSV or other source
    # Expected columns: 'start_sec', 'end_sec' with apnea event times in seconds
    annotations = pd.read_csv('data/apnea_annotations_x01.csv')
    epochs_dir = 'data/processed_15s_epochs'
    
    labels = create_15s_epoch_labels(epochs_dir, annotations)
    
    # Save labels to CSV for reference
    pd.DataFrame({'epoch': list(range(1, len(labels)+1)), 'label': labels}).to_csv('data/epoch_labels.csv', index=False)
    print("Pre-apnea labels created and saved to data/epoch_labels.csv")