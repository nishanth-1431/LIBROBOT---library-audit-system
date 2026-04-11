import pandas as pd
import os

DB_FILE = r"d:\projects\final_lib\data\books_database.xlsx"

try:
    print(f"Checking for file existence: {os.path.exists(DB_FILE)}")
    # Explicitly use openpyxl
    df = pd.read_excel(DB_FILE, engine='openpyxl')
    print(f"Successfully read {len(df)} rows.")
    print("Columns:", list(df.columns))
    print("First 5 rows:")
    print(df.head())
except PermissionError:
    print("PERMISSION ERROR: File is locked.")
except Exception as e:
    print(f"OTHER ERROR: {e}")
