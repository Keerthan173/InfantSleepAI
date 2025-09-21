# src/visualize_predictions.py
import pandas as pd
import matplotlib.pyplot as plt

def plot_apnea_predictions(csv_path='new_patient_apnea_predictions.csv', prob_threshold=0.6):
    df = pd.read_csv(csv_path)
    df['epoch_number'] = df['Epoch'].str.extract(r'(\d+)').astype(int)

    plt.figure(figsize=(12, 6))

    # Plot probability
    plt.plot(df['epoch_number'], df['Probability'], label='Apnea Probability', color='blue')

    # Plot binary label as scatter (with y-offset for visibility)
    plt.scatter(df['epoch_number'], df['Label']*1.1, color='red', label='Predicted Label (1=Apnea)')

    # Plot threshold line
    plt.axhline(y=prob_threshold, color='green', linestyle='--', label=f'Threshold = {prob_threshold}')

    plt.xlabel('Epoch Number')
    plt.ylabel('Apnea Probability / Label')
    plt.title('Apnea Prediction Probability and Labels Over Epochs')
    plt.legend()
    plt.grid(True)
    plt.show()

if __name__ == "__main__":
    plot_apnea_predictions()
