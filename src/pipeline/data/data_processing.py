import pandas as pd
import numpy as np
import os

def load_and_clean_data(file_path):
    df = pd.read_csv(file_path)
    df.rename(columns={"Description": "Product"}, inplace=True)
    df = df[~df['InvoiceNo'].astype(str).str.startswith('C')]
    df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
    df.to_csv("data/cleaned_retail.csv", index=False)
    return df

if __name__ == "__main__":
    print("📁 Loading and cleaning dataset...")

    input_path = "Online Retail.csv"  # ← update based on your file
    output_path = "data/cleaned_retail.csv"

    os.makedirs("data", exist_ok=True)

    df_cleaned = load_and_clean_data(input_path)
    df_cleaned.to_csv(output_path, index=False)

    print(f"✅ Cleaned CSV saved at: {output_path}")
