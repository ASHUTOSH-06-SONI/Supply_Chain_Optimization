#pragma once

#include <string>

#include "../intelligence/agent.h"
#include "../intelligence/classifier.h"
#include "../supply/warehouse.h"

struct Decision {
    std::string action;
    int recommended_quantity;
    std::string reason;
    std::string selected_warehouse_id;
    int estimated_delivery_time;
    float warehouse_distance;
};

Decision decide(
    const ProductMetadata& metadata,
    const ProductProfile& profile,
    int stock,
    float demand,
    Location user_location,
    const std::vector<Warehouse>& warehouses
);
