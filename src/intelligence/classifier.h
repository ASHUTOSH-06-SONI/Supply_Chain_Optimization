#pragma once

#include <string>
#include <vector>

#include "agent.h"

struct ProductProfile {
    bool fast_moving;
    bool high_delay;
    bool perishable;
    bool fragile_supply;
    int safety_stock;
    std::string prediction_strategy;
    std::vector<std::string> signals;
};

ProductProfile classify(const ProductMetadata& metadata);
