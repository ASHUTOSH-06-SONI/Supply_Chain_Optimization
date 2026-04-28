#include "predictor.h"

#include <algorithm>
#include <numeric>

Prediction Predictor::estimate_demand(
    const std::vector<int>& recent_sales,
    const ProductMetadata& metadata,
    const ProductProfile& profile
) const {
    if (recent_sales.empty()) {
        return {0.0F, profile.prediction_strategy};
    }

    const int total = std::accumulate(recent_sales.begin(), recent_sales.end(), 0);
    const float average = static_cast<float>(total) / static_cast<float>(recent_sales.size());
    float demand = average * static_cast<float>(metadata.lead_time);

    if (profile.prediction_strategy == "buffered_forecast") {
        demand *= 1.25F;
    } else if (profile.prediction_strategy == "simple_trend" && recent_sales.size() >= 2) {
        const int last = recent_sales.back();
        const int previous = recent_sales[recent_sales.size() - 2];
        demand += std::max(0, last - previous) * 0.5F;
    }

    return {demand, profile.prediction_strategy};
}
