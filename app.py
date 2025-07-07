import streamlit as st
import pandas as pd
import os
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Page config
st.set_page_config(page_title="Supply Chain Optimization", page_icon="📦")
st.title("📦 Supply Chain Optimization Dashboard")

st.markdown("""
Welcome to the interactive dashboard for demand forecasting and inventory optimization.

📂 Navigate through the sidebar:
- View **Inventory Recommendations**
- Explore **Forecast Confidence Intervals**
""")

# Load recommendations
@st.cache_data
def load_recommendations(path="output/inventory_recommendations.csv"):
    try:
        return pd.read_csv(path)
    except FileNotFoundError:
        st.error("❌ inventory_recommendations.csv not found.")
        return pd.DataFrame(columns=["Product", "Action"])

# Load forecast
@st.cache_data
def load_forecast(product_id):
    safe_name = str(product_id).replace("/", "_")
    path = f"output/forecasts/{safe_name}.csv"
    try:
        return pd.read_csv(path)
    except FileNotFoundError:
        st.warning(f"⚠️ Forecast file for {product_id} not found.")
        return pd.DataFrame()

# Get product list
forecast_dir = "output/forecasts"
product_files = [f for f in os.listdir(forecast_dir) if f.endswith(".csv")]
product_names = [os.path.splitext(f)[0].replace("_", "/") for f in product_files]

if not product_names:
    st.error("❌ No forecasts found in output/forecasts.")
    st.stop()

# Product selection
selected_product = st.selectbox("🔍 Select a product:", sorted(product_names))

# Load data
recommendations_df = load_recommendations()
forecast_df = load_forecast(selected_product)

# Show recommendation
rec = recommendations_df[recommendations_df["Product"] == selected_product]
if not rec.empty:
    st.subheader("💡 Recommendation:")
    st.success(rec["Action"].values[0])
else:
    st.warning("No recommendation available.")

# Clean forecast data
if not forecast_df.empty:
    forecast_df["ds"] = pd.to_datetime(forecast_df["ds"], errors="coerce")
    forecast_df = forecast_df[forecast_df["ds"] > pd.Timestamp("2010-01-01")]

# Plot forecast
if not forecast_df.empty:
    st.subheader("📈 Forecasted Demand:")
    fig, ax = plt.subplots()
    ax.plot(forecast_df["ds"], forecast_df["yhat"], label="Predicted Demand", color="blue")

    if "yhat_lower" in forecast_df.columns and "yhat_upper" in forecast_df.columns:
        ax.fill_between(
            forecast_df["ds"],
            forecast_df["yhat_lower"],
            forecast_df["yhat_upper"],
            color="lightblue",
            alpha=0.5,
            label="Confidence Interval"
        )

    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax.xaxis.set_major_locator(mdates.AutoDateLocator())
    fig.autofmt_xdate(rotation=45)

    ax.set_xlabel("Date")
    ax.set_ylabel("Demand")
    ax.legend()
    ax.grid(True)
    st.pyplot(fig)
