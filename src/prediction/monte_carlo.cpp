#include "monte_carlo.h"

#include <algorithm>
#include <random>

double sampleDemand(const DemandModel& model) {
    static thread_local std::mt19937 engine{std::random_device{}()};
    std::normal_distribution<double> distribution(model.mean, model.std_dev);
    return std::max(0.0, distribution(engine));
}

double simulateCost(
    int stock,
    const DemandModel& model,
    int simulations,
    double stockout_cost,
    double holding_cost
) {
    double total_cost = 0.0;

    for (int simulation = 0; simulation < simulations; ++simulation) {
        const double demand = sampleDemand(model);
        const double stockout = std::max(0.0, demand - static_cast<double>(stock));
        const double excess = std::max(0.0, static_cast<double>(stock) - demand);
        total_cost += stockout_cost * stockout + holding_cost * excess;
    }

    return total_cost / static_cast<double>(simulations);
}

double estimateStockoutProbability(
    int stock,
    const DemandModel& model,
    int simulations
) {
    int stockout_count = 0;

    for (int simulation = 0; simulation < simulations; ++simulation) {
        if (sampleDemand(model) > static_cast<double>(stock)) {
            ++stockout_count;
        }
    }

    return static_cast<double>(stockout_count) / static_cast<double>(simulations);
}
