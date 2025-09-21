# src/batch_inference.py
import os
import numpy as np
from inference import load_model, preprocess_signal, predict_apnea
import csv

def batch_inference(epochs_folder='new_patient_epochs'):
    model = load_model()
    results = []
    for fname in sorted(os.listdir(epochs_folder)):
        if fname.endswith('.npy'):
            epoch_path = os.path.join(epochs_folder, fname)
            signal_epoch = np.load(epoch_path)
            preprocessed = preprocess_signal(signal_epoch)
            label, prob = predict_apnea(model, preprocessed)
            results.append((fname, label, prob))
            print(f"{fname}: Label={label}, Probability={prob:.2f}")
    return results

if __name__ == "__main__":
    results = batch_inference()

    with open('new_patient_apnea_predictions.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Epoch', 'Label', 'Probability'])
        writer.writerows(results)
    print("Saved predictions to new_patient_apnea_predictions.csv")
