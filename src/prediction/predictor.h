#pragma once

#include <vector>

#include "../intelligence/agent.h"
#include "../intelligence/classifier.h"

struct Prediction {
    float demand;
    std::string strategy;
};

class Predictor {
public:
    Prediction estimate_demand(
        const std::vector<int>& recent_sales,
        const ProductMetadata& metadata,
        const ProductProfile& profile
    ) const;
};
