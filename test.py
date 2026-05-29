import sys
sys.path.append('.')
from server import parse_dataset, detect_schema, remove_duplicates, standardize_columns, apply_dataset_specific_rules, handle_missing_values, detect_outliers, validate_business_rules
import pandas as pd
import numpy as np

# Create mock data mimicking the screenshot
data = {
    'Item': [np.nan, np.nan, np.nan, np.nan, np.nan],
    'Price Per Unit': [np.nan, 33.5, np.nan, 24.5, np.nan],
    'Quantity': [10.0, np.nan, 8.0, np.nan, 10.0],
    'Total Spent': [200.0, np.nan, 52.0, np.nan, 275.0],
    'Discount Applied': [np.nan, 'TRUE', 'TRUE', np.nan, 'FALSE']
}
df = pd.DataFrame(data)

schema = detect_schema(df)
logs = []
df, nf, tf, bf, inv = standardize_columns(df, schema, logs)
df, specific_fixes = apply_dataset_specific_rules(df, schema, logs)
df, missing_fixed, missing_cols = handle_missing_values(df, schema, logs)

print("Before Final Math Fixes:")
print(df)

if 'Total Spent' in df.columns and 'Price Per Unit' in df.columns and 'Quantity' in df.columns:
    expected_total = df['Price Per Unit'] * df['Quantity']
    mismatch_mask = abs(df['Total Spent'] - expected_total) > 0.01
    t_count = mismatch_mask.sum()
    if t_count > 0:
        df.loc[mismatch_mask, 'Total Spent'] = expected_total[mismatch_mask]
        logs.append(f"[Validation] Force-recalculated {t_count} Total Spent values to equal Price * Quantity after imputation")

print("\nAfter Final Math Fixes:")
print(df)

print("\nLogs:")
for log in logs:
    print(log)
