import pandas as pd

def consolidate_predictions(pred_csv='data/combined/features_advanced_predictions.csv',
                            alert_labels=['Pre-apnea Warning', 'Apnea'],
                            output_csv='data/consolidated_xgboost_alerts.csv',
                            max_gap=1):
    """
    Consolidate consecutive alert epochs into apnea events using model predictions.
    Params:
      - pred_csv: CSV with model predictions including predicted_label_str and epoch columns
      - alert_labels: list of alert classes to group
      - output_csv: file location for consolidated alert events
      - max_gap: max epoch gaps allowed within one event
    Returns:
      - DataFrame of consolidated events with start, end, duration epochs
    """
    df = pd.read_csv(pred_csv)
    
    alert_df = df[df['predicted_label_str'].isin(alert_labels)].sort_values('epoch')
    
    events = []
    current_start = None
    current_end = None
    
    for _, row in alert_df.iterrows():
        epoch = row['epoch']
        
        if current_start is None:
            current_start = epoch
            current_end = epoch
        else:
            if epoch <= current_end + max_gap:
                current_end = epoch
            else:
                duration = current_end - current_start + 1
                events.append({'start_epoch': current_start, 
                               'end_epoch': current_end, 
                               'duration_epochs': duration})
                current_start = epoch
                current_end = epoch
    
    # Append last event if exists
    if current_start is not None:
        duration = current_end - current_start + 1
        events.append({'start_epoch': current_start, 
                       'end_epoch': current_end, 
                       'duration_epochs': duration})
    
    events_df = pd.DataFrame(events)
    events_df.to_csv(output_csv, index=False)
    print(f"Consolidated alerts saved to {output_csv}")
    print(f"{len(events_df)} apnea events found")
    return events_df

if __name__ == "__main__":
    consolidate_predictions()
