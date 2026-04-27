#pragma once

#include <vector>

class Predictor {
public:
    float estimate_demand(const std::vector<int>& recent_sales, int lead_time) const;
};
