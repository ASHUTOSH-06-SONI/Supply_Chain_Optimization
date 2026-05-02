#pragma once

#include <string>

#include "../intelligence/agent.h"
#include "../intelligence/classifier.h"
#include "../models/demand_model.h"
#include "../supply/warehouse.h"

struct Decision {
    std::string action;
    int recommended_quantity;
    std::string reason;
    std::string selected_warehouse_id;
    int estimated_delivery_time;
    float warehouse_distance;
    double demand_mean;
    double demand_std_dev;
    double stockout_probability;
    double expected_cost_hold;
    double expected_cost_restock;
};

Decision decide(int current_stock, const DemandModel& model);

Decision decide(
    const ProductMetadata& metadata,
    const ProductProfile& profile,
    int stock,
    const DemandModel& model,
    Location user_location,
    const std::vector<Warehouse>& warehouses
);
