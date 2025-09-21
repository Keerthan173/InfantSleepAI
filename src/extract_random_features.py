import pandas as pd
import json

features_df = pd.read_csv('data/combined/features_advanced.csv')


# Only keep the expected columns exactly matching the model input
expected_cols = [
    'mean', 'std', 'min', 'max', 'median',
    'skewness', 'kurtosis',
    'power_vlf', 'power_lf', 'power_hf',
    'app_entropy', 'sample_entropy'
]

# Sample one row with expected features
sample = features_df[expected_cols].sample(1).iloc[0]

# Convert sample series to dict with float values
feature_dict = {col: float(sample[col]) for col in expected_cols}

# Print JSON for frontend input copy-paste
print(json.dumps({"features": feature_dict}, indent=2))
