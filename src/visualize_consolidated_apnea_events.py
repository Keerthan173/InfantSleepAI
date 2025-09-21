import pandas as pd
import matplotlib.pyplot as plt

def visualize_apnea_events(consolidated_csv='data/consolidated_xgboost_alerts.csv', max_events=30):
    df = pd.read_csv(consolidated_csv)

    df = df.head(max_events)
    df['duration_seconds'] = df['duration_epochs'] * 15  # 15 seconds per epoch

    plt.figure(figsize=(12, 6))
    plt.bar(df['start_epoch'], df['duration_seconds'], width=8, align='edge', color='skyblue', edgecolor='k')

    plt.xlabel('Start Epoch')
    plt.ylabel('Apnea Event Duration (seconds)')
    plt.title(f'Apnea Event Durations for First {max_events} Consolidated Events')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.tight_layout()

    plt.show()

if __name__ == "__main__":
    visualize_apnea_events()
