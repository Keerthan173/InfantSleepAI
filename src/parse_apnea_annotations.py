import wfdb
import pandas as pd

def parse_apnea_annotations(record_name, raw_data_path='data/raw/'):
    """
    Parse apnea event annotations from .apn file for given record.
    Saves apnea events (start_sec, end_sec) CSV for that record.
    """
    ann = wfdb.rdann(raw_data_path + record_name, 'apn')
    fs = 100  # Known ECG sampling freq for this dataset

    events = []
    samples = ann.sample
    symbols = ann.symbol

    # Apnea start and end samples from symbols (assuming 'A' or similar symbol for apnea)
    apnea_starts = []
    apnea_ends = []

    # The .apn file uses "A" or specific patterns to mark apnea events in annotation
    # We will consider annotations marked "A" as apnea events

    for i, sym in enumerate(symbols):
        if sym == 'A':  # apnea event marker
            start_sec = samples[i] / fs
            # We can try to estimate duration using next marker or fixed window
            # Since apnea events are typically annotated as single markers, estimate duration arbitrarily (e.g., 30 sec)
            end_sec = start_sec + 30  
            events.append({'start_sec': start_sec, 'end_sec': end_sec})

    df_apnea = pd.DataFrame(events)
    csv_path = f'data/apnea_annotations_{record_name}.csv'
    df_apnea.to_csv(csv_path, index=False)
    print(f"Apnea annotation CSV saved to {csv_path}")
    return csv_path

if __name__ == "__main__":
    record = 'x01'  # Change for different record
    parse_apnea_annotations(record)