#include "predictor.h"

#include <numeric>

float Predictor::estimate_demand(const std::vector<int>& recent_sales, int lead_time) const {
    if (recent_sales.empty()) {
        return 0.0F;
    }

    const int total = std::accumulate(recent_sales.begin(), recent_sales.end(), 0);
    const float average = static_cast<float>(total) / static_cast<float>(recent_sales.size());
    return average * static_cast<float>(lead_time);
}
