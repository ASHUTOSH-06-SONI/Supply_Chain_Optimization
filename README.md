📦 Supply Chain Demand Forecasting & Inventory Optimization

⚠️ Live Demo
Due to AWS free tier limits, the live app is not hosted 24/7.
📩 If you'd like to try it out, feel free to contact me, and I’ll spin it up instantly.

An AI-powered application to forecast product demand and generate intelligent inventory restocking recommendations. Built with **Prophet**, **custom clustering algorithms**, and deployed on **AWS EC2** via **Streamlit**.

---Yes, absolutely — you should add the GitHub repo link.

Even if it just contains the code (and not a live deployment), it:

✅ Shows your implementation

✅ Lets judges/devs review your work

✅ Acts as proof of originality

✅ Helps if they want to run it locally or understand your logic



---

## 📊 Features

- 📈 **Time Series Forecasting** (30-day horizon) using Facebook Prophet Library
- 🧠 **Custom Hybrid Clustering** to segment products by behavior
- 🔁 **Inventory Action Recommendations** based on predicted vs. current stock
- 📉 **Confidence Intervals** for better decision-making
- 🖥️ Deployed on an EC2 Ubuntu instance using Python + Streamlit

---
![image](https://github.com/user-attachments/assets/c1965783-9ac0-43fd-a2a9-6f333745f909)


## 🏗️ Architecture
Firstly, the user access the site using web browser.
The Service used for running the application is AWS Elastic Cloud Compute (EC-2) and the deploying is done on streamlit 
At the backed of the app, there exists a forecasting engine designed using the Prophet library by Meta
and there also exists a clustering model which is a hybrid of K- Means clustering, DBSCAN and PCA 

Why **K means** ?
To segment products into k distinct clusters based on their features like quantity sold, frequency of sales, and demand trends.
Its advantanges- Fast and effective on large data sets' analysis, well separared and spherical clusters, helps in identifying high/low volume of products

Why **DBSCAN** ?
To detect outliers and irregular demand patterns.
Unlike K-Means, DBSCAN doesn’t assume the number of clusters.
Identifying anomalous or erratic-selling products and filter out the products that don't follow the normal trend

Why **PCA** ?
To reduce the number of features while preserving the important patterns.
Dataset may include high-dimensional vectors (like sales over time), so PCA reduces that to 2 principal components for clustering.
PCA simplifies the problem, allowing clustering to focus on core patterns rather than noise.

