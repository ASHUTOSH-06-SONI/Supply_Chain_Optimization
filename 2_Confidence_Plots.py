import streamlit as st
import os
import pandas as pd
import matplotlib.pyplot as plt

st.set_page_config(page_title="Forecast Viewer", layout="wide")
st.title("📈 Forecast Confidence Visualizer")

# Get list of forecast CSVs
forecast_files = sorted(os.listdir("output/forecasts"))

# Show dropdown
selected_file = st.selectbox("Choose a product forecast", forecast_files)

# Load and plot
if selected_file:
    df = pd.read_csv(f"output/forecasts/{selected_file}")

    st.subheader(f"Forecast for {selected_file.replace('.csv', '').replace('_', ' ')}")

    plt.figure(figsize=(10, 5))
    plt.fill_between(df["ds"], df["yhat_lower"], df["yhat_upper"], alpha=0.3, label="Confidence Interval")
    plt.plot(df["ds"], df["yhat"], label="Predicted Demand", color="blue")
    plt.xticks(rotation=45)
    plt.legend()
    plt.tight_layout()
    st.pyplot(plt)
