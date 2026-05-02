#pragma once

#include "../models/demand_model.h"

double sampleDemand(const DemandModel& model);

double simulateCost(
    int stock,
    const DemandModel& model,
    int simulations,
    double stockout_cost,
    double holding_cost
);

double estimateStockoutProbability(
    int stock,
    const DemandModel& model,
    int simulations
);
