#include "warehouse.h"

#include <algorithm>
#include <cmath>
#include <limits>

float distance_between(Location first, Location second) {
    const float dx = first.x - second.x;
    const float dy = first.y - second.y;
    return std::sqrt(dx * dx + dy * dy);
}

std::vector<WarehouseCandidate> find_nearby_warehouses(
    Location user_location,
    const std::vector<Warehouse>& warehouses,
    float radius
) {
    std::vector<WarehouseCandidate> nearby;

    for (const Warehouse& warehouse : warehouses) {
        const float distance = distance_between(user_location, warehouse.location);
        if (distance <= radius) {
            nearby.push_back({warehouse, distance});
        }
    }

    return nearby;
}

std::vector<WarehouseCandidate> find_progressively_nearby_warehouses(
    Location user_location,
    const std::vector<Warehouse>& warehouses,
    float initial_radius,
    float radius_step,
    float max_radius
) {
    for (float radius = initial_radius; radius <= max_radius; radius += radius_step) {
        std::vector<WarehouseCandidate> nearby = find_nearby_warehouses(user_location, warehouses, radius);
        if (!nearby.empty()) {
            return nearby;
        }
    }

    return {};
}

bool has_sufficient_stock(const Warehouse& warehouse, const std::string& product_id, int required_quantity) {
    const auto found = warehouse.stock_by_product.find(product_id);
    return found != warehouse.stock_by_product.end() && found->second >= required_quantity;
}

WarehouseCandidate select_optimal_warehouse(
    const std::string& product_id,
    int required_quantity,
    const std::vector<WarehouseCandidate>& candidates
) {
    WarehouseCandidate best{{"", {0.0F, 0.0F}, {}, 0}, std::numeric_limits<float>::max()};
    bool found_candidate = false;

    for (const WarehouseCandidate& candidate : candidates) {
        if (!has_sufficient_stock(candidate.warehouse, product_id, required_quantity)) {
            continue;
        }

        if (!found_candidate ||
            candidate.warehouse.delivery_time < best.warehouse.delivery_time ||
            (candidate.warehouse.delivery_time == best.warehouse.delivery_time && candidate.distance < best.distance)) {
            best = candidate;
            found_candidate = true;
        }
    }

    if (!found_candidate) {
        return {{"", {0.0F, 0.0F}, {}, 0}, 0.0F};
    }

    return best;
}

std::vector<Warehouse> simulated_warehouses() {
    return {
        {
            "warehouse_north",
            {2.0F, 4.0F},
            {{"milk", 40}, {"rice", 30}, {"bread", 25}, {"detergent", 20}},
            1
        },
        {
            "warehouse_central",
            {7.0F, 8.0F},
            {{"milk", 8}, {"rice", 80}, {"laptop", 10}, {"detergent", 50}},
            2
        },
        {
            "warehouse_east",
            {16.0F, 6.0F},
            {{"laptop", 20}, {"phone", 30}, {"tablet", 18}, {"rice", 45}},
            4
        },
        {
            "warehouse_far",
            {26.0F, 22.0F},
            {{"general item", 50}, {"tomato", 35}, {"apple", 30}, {"headphone", 15}},
            7
        }
    };
}
