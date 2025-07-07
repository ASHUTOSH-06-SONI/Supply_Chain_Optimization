import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, DBSCAN
from sklearn.pipeline import Pipeline

def hybrid_cluster(df, n_clusters=4):
    """
    Performs hybrid clustering using KMeans + DBSCAN on normalized quantity and frequency per product.
    Returns a dictionary mapping Product IDs to cluster labels.
    """
    # 🔢 Step 1: Aggregate product-level features
    product_stats = df.groupby("Product").agg({
        "Quantity": "sum",
        "InvoiceNo": "nunique"
    }).rename(columns={"Quantity": "TotalQuantity", "InvoiceNo": "Frequency"})

    # ✨ Step 2: Normalize + reduce dimensions
    scaler = StandardScaler()
    pca = PCA(n_components=2)

    X_scaled = scaler.fit_transform(product_stats)
    X_reduced = pca.fit_transform(X_scaled)

    # 💡 Step 3: Run KMeans
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    kmeans_labels = kmeans.fit_predict(X_reduced)

    # 🔍 Step 4: Apply DBSCAN on each KMeans cluster (optional refinement)
    refined_labels = []
    for cluster_id in range(n_clusters):
        indices = [i for i, lbl in enumerate(kmeans_labels) if lbl == cluster_id]
        subdata = X_reduced[indices]

        if len(subdata) < 5:
            refined_labels.extend([cluster_id] * len(subdata))  # Not enough points to cluster
            continue

        dbscan = DBSCAN(eps=0.5, min_samples=3)
        db_labels = dbscan.fit_predict(subdata)

        # Remap DBSCAN -1s to parent cluster
        for lbl in db_labels:
            refined_labels.append(cluster_id if lbl == -1 else (n_clusters + lbl))

    # 🔁 Map back to product IDs
    product_cluster_map = dict(zip(product_stats.index, refined_labels))
    
    # Optional: Save to CSV
    pd.DataFrame.from_dict(product_cluster_map, orient="index", columns=["Cluster"]) \
      .reset_index().rename(columns={"index": "Product"}) \
      .to_csv("output/cluster_labels.csv", index=False)

    return product_cluster_map
