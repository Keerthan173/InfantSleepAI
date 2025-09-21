import pandas as pd

def consolidate_alerts(results_csv='data/batch_inference_results.csv', alert_labels=['Pre-apnea Warning', 'Apnea'], max_gap=1):
    """
    Groups consecutive alert epochs into apnea events.
    
    Args:
    - results_csv: CSV file from batch inference with columns 'epoch', 'label', 'probability'
    - alert_labels: Labels considered as alerts for grouping
    - max_gap: Maximum gaps (in epochs) allowed between alerts within same event
    
    Returns:
    - events_df: DataFrame with apnea events start_epoch, end_epoch, duration_epochs
    """
    df = pd.read_csv(results_csv)
    alert_df = df[df['label'].isin(alert_labels)].sort_values('epoch')

    events = []
    current_event_start = None
    current_event_end = None

    for idx, row in alert_df.iterrows():
        epoch = row['epoch']
        if current_event_start is None:
            current_event_start = epoch
            current_event_end = epoch
        else:
            if epoch <= current_event_end + max_gap:
                current_event_end = epoch
            else:
                duration = current_event_end - current_event_start + 1
                events.append({'start_epoch': current_event_start, 
                               'end_epoch': current_event_end, 
                               'duration_epochs': duration})
                current_event_start = epoch
                current_event_end = epoch

    # Append last event
    if current_event_start is not None:
        duration = current_event_end - current_event_start + 1
        events.append({'start_epoch': current_event_start, 
                       'end_epoch': current_event_end, 
                       'duration_epochs': duration})

    events_df = pd.DataFrame(events)
    return events_df

if __name__ == "__main__":
    events = consolidate_alerts()
    print(f"{len(events)} consolidated apnea events found")
    print(events)
    events.to_csv('data/consolidated_apnea_events.csv', index=False)
    print("Saved consolidated apnea events to data/consolidated_apnea_events.csv")