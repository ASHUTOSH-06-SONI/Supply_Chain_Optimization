import os
import pandas as pd
from forecast import generate_forecast
from clustering import hybrid_cluster
import json

def calculate_reorder_quantity(predicted_demand, current_stock, buffer=1.1):
    if current_stock < predicted_demand * buffer:
        return round(predicted_demand - current_stock)
    return 0

# 🔧 Utility function to build forecast and stock levels
def build_forecast_and_stock(df):
    forecast_dict = generate_forecast(df)
    stock_dict = df.groupby('Product')['Quantity'].sum().to_dict()
    return forecast_dict, stock_dict

# 🧠 Inventory recommendation logic
def recommend_stock_actions(forecast_dict, stock_dict, product_cluster_map=None, buffer_factor=None):
    actions = {}
    for product, forecast_df in forecast_dict.items():
        predicted_demand = forecast_df['yhat'].sum()
        current_stock = stock_dict.get(product, 0)

        # cluster-specific threshold
        threshold = 1.1
        if product_cluster_map and buffer_factor:
            cluster = product_cluster_map.get(product, 0)
            threshold = buffer_factor.get(cluster, 1.1)

        if current_stock < predicted_demand * threshold:
            actions[product] = f"Restock ({predicted_demand - current_stock:.0f} units)"
        else:
            actions[product] = "Sufficient stock"
    return actions

# 🚀 Main script logic
if __name__ == "__main__":
    print("📁 Loading dataset...")
    df = pd.read_csv("data/cleaned_retail.csv", parse_dates=["InvoiceDate"])
    print(f"✅ Dataset loaded with {len(df)} rows.")

    print("🔮 Generating forecasts...")
    forecast_dict, stock_dict = build_forecast_and_stock(df)

    print("🧠 Running hybrid clustering...")
    product_cluster_map = hybrid_cluster(df)

    buffer_factor = {
        0: 1.0, 1: 1.1, 2: 1.3, 3: 0.9,
        4: 1.2, 5: 0.8, 6: 1.05
    }

    print("📦 Recommending inventory actions...")
    recommendations = recommend_stock_actions(forecast_dict, stock_dict, product_cluster_map, buffer_factor)

    # ⬇️ Save outputs for UI
    os.makedirs("output/forecasts", exist_ok=True)

    print("💾 Saving forecasts...")
    for product_id, forecast_df in forecast_dict.items():
        fname = f"output/forecasts/{str(product_id).replace('/', '_')}.csv"
        forecast_df.to_csv(fname, index=False)

    print("💾 Saving recommendations...")
    rec_df = pd.DataFrame(list(recommendations.items()), columns=["Product", "Action"])
    rec_df.to_csv("output/inventory_recommendations.csv", index=False)
    with open("output/inventory_recommendations.json", "w") as f:
        json.dump(recommendations, f, indent=2)

    print("✅ Done! Forecasts and recommendations saved.")
