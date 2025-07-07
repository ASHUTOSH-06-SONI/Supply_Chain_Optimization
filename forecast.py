def generate_forecast(df):
    from prophet import Prophet
    import os

    forecast_dict = {}

    for product_id in df['Product'].dropna().unique():
        product_df = df[df['Product'] == product_id][['InvoiceDate', 'Quantity']].copy()
        product_df = product_df.rename(columns={"InvoiceDate": "ds", "Quantity": "y"})

        if len(product_df) < 10:
            continue  # Skip products with insufficient data

        model = Prophet()
        model.fit(product_df)
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)

        forecast_dict[product_id] = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(30)

    # ✅ Save forecasts to CSVs
    os.makedirs("output/forecasts", exist_ok=True)
    for product, forecast_df in forecast_dict.items():
        safe_name = "".join(c if c.isalnum() or c in [' ', '_'] else "_" for c in str(product))
        forecast_df.to_csv(f"output/forecasts/{safe_name}.csv", index=False)

    return forecast_dict
