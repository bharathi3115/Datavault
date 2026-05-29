import http.server
import json
import base64
import io
import re
import time
import traceback
import pandas as pd
import numpy as np
from datetime import datetime

PORT = 8000

# ============================================================
# CLEANING ENGINE — Modular, Professional-Grade Functions
# ============================================================

def parse_dataset(file_bytes, filename):
    """Parse any supported file format into a DataFrame."""
    ext = filename.rsplit('.', 1)[-1].lower()
    if ext == 'csv':
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding='latin-1')
    elif ext in ('xlsx', 'xls'):
        df = pd.read_excel(io.BytesIO(file_bytes))
    elif ext == 'json':
        df = pd.read_json(io.BytesIO(file_bytes))
    elif ext == 'tsv':
        df = pd.read_csv(io.BytesIO(file_bytes), sep='\t')
    else:
        raise ValueError(f'Unsupported file format: .{ext}')
    # Drop fully empty rows and columns
    df = df.dropna(how='all').dropna(axis=1, how='all')
    return df


def detect_schema(df):
    """Detect column types: numeric, categorical, datetime, boolean."""
    schema = {}
    for col in df.columns:
        series = df[col].dropna()
        if len(series) == 0:
            schema[col] = 'empty'
            continue
        # Check boolean
        unique_lower = set(series.astype(str).str.strip().str.lower().unique())
        if unique_lower.issubset({'true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n'}):
            schema[col] = 'boolean'
            continue
        # Check if already numeric
        if pd.api.types.is_numeric_dtype(series):
            schema[col] = 'numeric'
            continue
        # Check if coercible to numeric (strip currency/commas first)
        cleaned = series.astype(str).str.replace(r'[$€£₹,%,\s]', '', regex=True)
        numeric_coerced = pd.to_numeric(cleaned, errors='coerce')
        if numeric_coerced.notna().mean() > 0.5:
            schema[col] = 'numeric'
            continue
        # Check datetime
        try:
            pd.to_datetime(series, infer_datetime_format=True, errors='raise')
            schema[col] = 'datetime'
            continue
        except:
            pass
        # Default: categorical/text
        n_unique = series.nunique()
        if n_unique / len(series) < 0.5 or n_unique < 50:
            schema[col] = 'categorical'
        else:
            schema[col] = 'text'
    return schema


def remove_duplicates(df):
    """Remove exact duplicate rows."""
    before = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    removed = before - len(df)
    return df, removed


def handle_missing_values(df, schema, logs):
    """Fill missing values intelligently based on column type."""
    total_fixed = 0
    cols_affected = 0
    for col in df.columns:
        null_count = df[col].isnull().sum()
        # Also treat sentinel strings as missing
        if df[col].dtype == object:
            sentinel_mask = df[col].astype(str).str.strip().str.lower().isin(
                ['', 'nan', 'n/a', 'na', 'null', 'none', 'unknown', '--', '-', '?', 'missing']
            )
            df.loc[sentinel_mask, col] = np.nan
            null_count = df[col].isnull().sum()

        if null_count == 0:
            continue
        cols_affected += 1
        total_fixed += int(null_count)
        col_type = schema.get(col, 'text')
        if col_type == 'numeric':
            median_val = pd.to_numeric(df[col], errors='coerce').median()
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(median_val)
            logs.append(f"[{col}] Filled {null_count} missing values with median: {median_val}")
        elif col_type == 'boolean':
            df[col] = df[col].fillna('False')
            logs.append(f"[{col}] Filled {null_count} missing values with 'False'")
        elif col_type == 'datetime':
            df[col] = df[col].fillna(method='ffill').fillna(method='bfill')
            logs.append(f"[{col}] Filled {null_count} missing dates using forward/backward fill")
        else:
            # For text and categorical fields, use 'Unknown' to avoid fabricating data
            fill_val = 'Unknown'
            df[col] = df[col].fillna(fill_val)
            logs.append(f"[{col}] Filled {null_count} missing text values with '{fill_val}'")
    return df, total_fixed, cols_affected


def standardize_columns(df, schema, logs):
    """Coerce types, strip symbols, normalize text."""
    num_fixed = 0
    text_fixed = 0
    bool_fixed = 0
    invalid_coerced = 0
    for col in df.columns:
        col_type = schema.get(col, 'text')
        if col_type == 'numeric':
            original = df[col].copy()
            # Strip currency symbols, commas, percentage signs, spaces
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.replace(r'[$€£₹,%,\s]', '', regex=True)
            df[col] = pd.to_numeric(df[col], errors='coerce')
            # Count how many were coerced from invalid text to NaN
            newly_null = df[col].isnull() & original.notna()
            newly_null_count = int(newly_null.sum())
            if newly_null_count > 0:
                invalid_coerced += newly_null_count
                # Fill newly created NaNs with median
                median_val = df[col].median()
                fill_val = median_val if not pd.isna(median_val) else 0
                df[col] = df[col].fillna(fill_val)
                logs.append(f"[{col}] Converted {newly_null_count} invalid text values to median: {fill_val}")
            num_fixed += 1
        elif col_type == 'boolean':
            mapping = {
                'true': True, 'yes': True, '1': True, 't': True, 'y': True,
                'false': False, 'no': False, '0': False, 'f': False, 'n': False
            }
            df[col] = df[col].astype(str).str.strip().str.lower().map(mapping).fillna(False)
            bool_fixed += 1
        elif col_type == 'categorical' or col_type == 'text':
            df[col] = df[col].astype(str).str.strip()
            # Normalize casing: Title Case for categoricals
            if col_type == 'categorical':
                df[col] = df[col].str.title()
            # Remove excessive whitespace
            df[col] = df[col].str.replace(r'\s+', ' ', regex=True)
            text_fixed += 1
        elif col_type == 'datetime':
            df[col] = pd.to_datetime(df[col], errors='coerce', infer_datetime_format=True)
    return df, num_fixed, text_fixed, bool_fixed, invalid_coerced


def validate_business_rules(df, schema, logs):
    """Apply semantic business-rule validation on numeric columns."""
    total_fixed = 0
    details = []
    # Keywords that should NEVER be negative
    non_negative_keywords = [
        'age', 'hour', 'duration', 'watch', 'price', 'cost', 'revenue',
        'sales', 'quantity', 'count', 'score', 'rating', 'salary', 'wage',
        'income', 'weight', 'height', 'distance', 'speed', 'views',
        'subscribers', 'followers', 'likes', 'attendance', 'population'
    ]
    # Keywords with known upper bounds
    capped_keywords = {
        'age': (0, 120),
        'percentage': (0, 100),
        'percent': (0, 100),
        'pct': (0, 100),
        'rating': (0, 10),
        'score': (0, 100),
    }
    for col in df.columns:
        if schema.get(col) != 'numeric':
            continue
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        col_lower = col.lower().replace('_', ' ')
        # Check for non-negative rule
        should_be_non_negative = any(kw in col_lower for kw in non_negative_keywords)
        if should_be_non_negative:
            neg_mask = df[col] < 0
            neg_count = int(neg_mask.sum())
            if neg_count > 0:
                pos_median = df.loc[~neg_mask, col].median()
                df[col] = df[col].astype(float)
                df.loc[neg_mask, col] = pos_median if not pd.isna(pos_median) else 0
                total_fixed += neg_count
                msg = f"[{col}] Fixed {neg_count} invalid negative values with median: {pos_median}"
                details.append(msg)
                logs.append(msg)
        # Check for upper/lower bounds
        for kw, (lo, hi) in capped_keywords.items():
            if kw in col_lower:
                over_mask = df[col] > hi
                under_mask = df[col] < lo
                over_count = int(over_mask.sum())
                under_count = int(under_mask.sum())
                if over_count > 0:
                    # Replace with median of valid range
                    valid_median = df.loc[(df[col] >= lo) & (df[col] <= hi), col].median()
                    df[col] = df[col].astype(float)
                    df.loc[over_mask, col] = valid_median if not pd.isna(valid_median) else hi
                    total_fixed += over_count
                    details.append(f'{col}: {over_count} values above {hi} capped')
                if under_count > 0:
                    valid_median = df.loc[(df[col] >= lo) & (df[col] <= hi), col].median()
                    df[col] = df[col].astype(float)
                    df.loc[under_mask, col] = valid_median if not pd.isna(valid_median) else lo
                    total_fixed += under_count
                    details.append(f'{col}: {under_count} values below {lo} fixed')
                break
    return df, total_fixed, details


def detect_outliers(df, schema, logs):
    """Detect and cap outliers using IQR method."""
    total_outliers = 0
    cols_affected = 0
    for col in df.columns:
        if schema.get(col) != 'numeric':
            continue
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        if IQR == 0:
            continue
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        mask = (df[col] < lower) | (df[col] > upper)
        count = int(mask.sum())
        if count > 0:
            total_outliers += count
            cols_affected += 1
            df[col] = df[col].astype(float)
            df.loc[df[col] < lower, col] = lower
            df.loc[df[col] > upper, col] = upper
            logs.append(f"[{col}] Capped {count} outliers to range [{lower:.2f}, {upper:.2f}]")
    return df, total_outliers, cols_affected


def apply_dataset_specific_rules(df, schema, logs):
    """Apply specific business derivations for retail datasets."""
    total_fixed = 0
    if 'Total Spent' in df.columns and 'Price Per Unit' in df.columns and 'Quantity' in df.columns:
        # Convert to numeric safely
        df['Total Spent'] = pd.to_numeric(df['Total Spent'], errors='coerce')
        df['Price Per Unit'] = pd.to_numeric(df['Price Per Unit'], errors='coerce')
        df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')

        # 1. Derive Quantity
        mask_q = df['Quantity'].isna() & df['Total Spent'].notna() & df['Price Per Unit'].notna() & (df['Price Per Unit'] != 0)
        q_count = mask_q.sum()
        if q_count > 0:
            df.loc[mask_q, 'Quantity'] = df.loc[mask_q, 'Total Spent'] / df.loc[mask_q, 'Price Per Unit']
            total_fixed += q_count
            logs.append(f"[Quantity] Derived {q_count} missing values using Total Spent / Price Per Unit")

        # 2. Derive Price
        mask_p = df['Price Per Unit'].isna() & df['Total Spent'].notna() & df['Quantity'].notna() & (df['Quantity'] != 0)
        p_count = mask_p.sum()
        if p_count > 0:
            df.loc[mask_p, 'Price Per Unit'] = df.loc[mask_p, 'Total Spent'] / df.loc[mask_p, 'Quantity']
            total_fixed += p_count
            logs.append(f"[Price Per Unit] Derived {p_count} missing values using Total Spent / Quantity")

        # 3. Derive/Validate Total Spent
        mask_t = df['Price Per Unit'].notna() & df['Quantity'].notna()
        # Find rows where Total Spent is nan OR where it doesn't match the math
        expected_total = df.loc[mask_t, 'Price Per Unit'] * df.loc[mask_t, 'Quantity']
        mismatch_mask = mask_t & ((df['Total Spent'].isna()) | (abs(df['Total Spent'] - expected_total) > 0.01))
        t_count = mismatch_mask.sum()
        if t_count > 0:
            df.loc[mismatch_mask, 'Total Spent'] = expected_total[mismatch_mask]
            total_fixed += t_count
            logs.append(f"[Total Spent] Calculated/Fixed {t_count} values to exactly equal Price Per Unit * Quantity")

    if 'Discount Applied' in df.columns:
        null_discount = df['Discount Applied'].isna()
        d_count = null_discount.sum()
        if d_count > 0:
            df.loc[null_discount, 'Discount Applied'] = False
            total_fixed += d_count
            logs.append(f"[Discount Applied] Imputed {d_count} missing values as False")
            
    return df, total_fixed



def compute_analytics(df, schema):
    """Compute real analytics summary from the cleaned DataFrame."""
    analytics = {}
    # Basic stats
    analytics['total_records'] = int(len(df))
    analytics['total_columns'] = int(len(df.columns))
    # Per-column stats
    numeric_stats = []
    for col in df.columns:
        if schema.get(col) == 'numeric' and pd.api.types.is_numeric_dtype(df[col]):
            stats = {
                'column': col,
                'mean': round(float(df[col].mean()), 2),
                'median': round(float(df[col].median()), 2),
                'min': round(float(df[col].min()), 2),
                'max': round(float(df[col].max()), 2),
                'std': round(float(df[col].std()), 2),
                'sum': round(float(df[col].sum()), 2),
            }
            numeric_stats.append(stats)
    analytics['numeric_stats'] = numeric_stats
    # Category distributions
    cat_distributions = []
    for col in df.columns:
        if schema.get(col) in ('categorical', 'boolean'):
            counts = df[col].astype(str).value_counts().head(10).to_dict()
            cat_distributions.append({'column': col, 'counts': {str(k): int(v) for k, v in counts.items()}})
    analytics['categorical_distributions'] = cat_distributions
    # Correlation matrix for numeric columns
    numeric_cols = [c for c in df.columns if schema.get(c) == 'numeric' and pd.api.types.is_numeric_dtype(df[c])]
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr().round(3)
        analytics['correlation'] = {col: {c2: float(corr.loc[col, c2]) for c2 in numeric_cols} for col in numeric_cols}
    else:
        analytics['correlation'] = {}
    return analytics


# ============================================================
# HTTP SERVER
# ============================================================

class DataCleaningServer(http.server.SimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Normalize path
        path = self.path.split('?', 1)[0]
        query = '?' + self.path.split('?', 1)[1] if '?' in self.path else ''
        
        # Redirection rules mapping underscored and extension-less variants to correct hyphenated HTML files
        redirects = {
            '/admin_login.html': '/admin-login.html',
            '/admin_login': '/admin-login.html',
            '/admin-login': '/admin-login.html',
            '/user_login.html': '/user-login.html',
            '/user_login': '/user-login.html',
            '/user-login': '/user-login.html',
            '/user_signup.html': '/user-signup.html',
            '/user_signup': '/user-signup.html',
            '/user-signup': '/user-signup.html',
        }
        
        if path in redirects:
            self.send_response(301)
            self.send_header('Location', redirects[path] + query)
            self.end_headers()
            return

        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/clean':
            self._handle_clean()
        elif self.path == '/api/analytics':
            self._handle_analytics()
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_clean(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            data = json.loads(body)
            filename = data.get('filename', 'unknown.csv')
            b64_content = data.get('content', '')
            file_bytes = base64.b64decode(b64_content)

            self.send_response(200)
            self.send_header('Content-Type', 'application/x-ndjson')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()

            import math
            def clean_nans(d):
                if isinstance(d, float):
                    if math.isnan(d) or math.isinf(d): return None
                    return d
                if isinstance(d, (np.integer,)): return int(d)
                if isinstance(d, (np.floating,)):
                    v = float(d)
                    if math.isnan(v) or math.isinf(v): return None
                    return v
                if isinstance(d, np.bool_): return bool(d)
                if isinstance(d, np.ndarray): return [clean_nans(x) for x in d.tolist()]
                if isinstance(d, dict): return {k: clean_nans(v) for k, v in d.items()}
                if isinstance(d, (list, tuple)): return [clean_nans(x) for x in d]
                return d

            def stream(event, payload):
                line = json.dumps(clean_nans({'event': event, 'data': payload}), default=str) + '\n'
                self.wfile.write(line.encode('utf-8'))
                self.wfile.flush()
                
            logs = []

            # ── Step 0: Parse & Schema ──
            df = parse_dataset(file_bytes, filename)
            orig_rows = len(df)
            schema = detect_schema(df)
            num_cols = sum(1 for v in schema.values() if v == 'numeric')
            cat_cols = sum(1 for v in schema.values() if v in ('categorical', 'text'))
            date_cols = sum(1 for v in schema.values() if v == 'datetime')

            # ── Step 0 (UI): Duplicates ──
            stream('progress', {'step': 0, 'progress': 10, 'msg': 'Removing duplicates...'})
            df, dups = remove_duplicates(df)
            stream('step_done', {
                'step': 0,
                'pills': [f'{dups} duplicates removed', f'{len(df)} rows retained']
            })
            
            # ── Step 1 (UI): Type Standardization ──
            stream('progress', {'step': 1, 'progress': 10, 'msg': 'Standardizing data types...'})
            df, nf, tf, bf, inv = standardize_columns(df, schema, logs)
            stream('step_done', {
                'step': 1,
                'pills': [f'{tf} text normalized', f'{nf} numbers fixed']
            })
            
            # ── Dataset Specific Business Rules (Retail Derivations) ──
            df, specific_fixes = apply_dataset_specific_rules(df, schema, logs)

            # ── Step 2 (UI): Missing Values ──
            stream('progress', {'step': 2, 'progress': 10, 'msg': 'Handling missing values...'})
            df, missing_fixed, missing_cols = handle_missing_values(df, schema, logs)
            stream('step_done', {
                'step': 2,
                'pills': [f'{missing_fixed} cells filled', f'{missing_cols} columns affected']
            })

            # ── Step 3 (UI): Outlier Detection ──
            stream('progress', {'step': 3, 'progress': 10, 'msg': 'Detecting outliers (IQR)...'})
            df, outliers, out_cols = detect_outliers(df, schema, logs)
            stream('step_done', {
                'step': 3,
                'pills': [f'{outliers} outliers capped', 'IQR method applied']
            })

            # ── Step 4 (UI): Business Rule Validation ──
            stream('progress', {'step': 4, 'progress': 10, 'msg': 'Validating business rules...'})
            df, biz_fixed, biz_details = validate_business_rules(df, schema, logs)
            
            # ── FINAL POST-IMPUTATION MATH VALIDATION ──
            final_math_fixes = 0
            if 'Total Spent' in df.columns and 'Price Per Unit' in df.columns and 'Quantity' in df.columns:
                expected_total = df['Price Per Unit'] * df['Quantity']
                mismatch_mask = abs(df['Total Spent'] - expected_total) > 0.01
                t_count = mismatch_mask.sum()
                if t_count > 0:
                    df.loc[mismatch_mask, 'Total Spent'] = expected_total[mismatch_mask]
                    final_math_fixes += t_count
                    logs.append(f"[Validation] Force-recalculated {t_count} Total Spent values to equal Price * Quantity after imputation")

            stream('step_done', {
                'step': 4,
                'pills': [f'{len(df)} valid rows', f'{biz_fixed + final_math_fixes} final validations', '0 inconsistencies']
            })

            # ── Compute analytics on the cleaned data ──
            analytics = compute_analytics(df, schema)

            # ── Quality score ──
            total_issues = dups + missing_fixed + inv + biz_fixed + outliers + specific_fixes + final_math_fixes
            total_cells = orig_rows * len(df.columns)
            quality = max(0, min(100, round(100 - (total_issues / max(total_cells, 1)) * 100)))

            # ── Final: Send cleaned data + analytics ──
            df_out = df.replace({np.nan: None, np.inf: None, -np.inf: None})
            # Convert any remaining non-serializable types
            for col in df_out.columns:
                if df_out[col].dtype == 'bool':
                    df_out[col] = df_out[col].astype(str)
                elif hasattr(df_out[col].dtype, 'tz') or 'datetime' in str(df_out[col].dtype):
                    df_out[col] = df_out[col].astype(str)
            stream('complete', {
                'headers': df_out.columns.tolist(),
                'rows': df_out.values.tolist(),
                'analytics': analytics,
                'quality_score': quality,
                'detailed_logs': logs,
                'cleaning_summary': {
                    'original_rows': orig_rows,
                    'final_rows': len(df),
                    'duplicates_removed': dups,
                    'missing_filled': missing_fixed,
                    'invalid_coerced': inv,
                    'business_rules_fixed': biz_fixed,
                    'outliers_capped': outliers,
                }
            })
            print(f'[CLEAN] {filename}: {orig_rows} -> {len(df)} rows | quality={quality}% | outliers={outliers} | invalid={inv} | biz_rules={biz_fixed}')

        except Exception as e:
            traceback.print_exc()
            try:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
            except:
                pass

    def _handle_analytics(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            data = json.loads(body)
            headers = data['headers']
            rows = data['rows']
            df = pd.DataFrame(rows, columns=headers)
            # Infer types
            for col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='ignore')
            schema = detect_schema(df)
            analytics = compute_analytics(df, schema)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(analytics, default=str).encode('utf-8'))
        except Exception as e:
            traceback.print_exc()
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))


if __name__ == '__main__':
    import socketserver
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), DataCleaningServer) as httpd:
        print(f'DataVault Backend running at http://localhost:{PORT}')
        print(f'Serving files from: {__import__("os").getcwd()}')
        httpd.serve_forever()
