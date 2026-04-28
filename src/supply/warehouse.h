#pragma once

#include <string>
#include <unordered_map>
#include <vector>

struct Location {
    float x;
    float y;
};

struct Warehouse {
    std::string id;
    Location location;
    std::unordered_map<std::string, int> stock_by_product;
    int delivery_time;
};

struct WarehouseCandidate {
    Warehouse warehouse;
    float distance;
};

float distance_between(Location first, Location second);

std::vector<WarehouseCandidate> find_nearby_warehouses(
    Location user_location,
    const std::vector<Warehouse>& warehouses,
    float radius
);

std::vector<WarehouseCandidate> find_progressively_nearby_warehouses(
    Location user_location,
    const std::vector<Warehouse>& warehouses,
    float initial_radius,
    float radius_step,
    float max_radius
);

bool has_sufficient_stock(const Warehouse& warehouse, const std::string& product_id, int required_quantity);

WarehouseCandidate select_optimal_warehouse(
    const std::string& product_id,
    int required_quantity,
    const std::vector<WarehouseCandidate>& candidates
);

std::vector<Warehouse> simulated_warehouses();
