#include "decision_engine.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <limits>

 #include "../prediction/monte_carlo.h"

namespace {
constexpr int kSimulations = 120;
constexpr double kStockoutCost = 8.0;
constexpr double kHoldingCost = 1.0;
constexpr double kDistanceWeight = 0.35;
constexpr std::array<int, 3> kRestockOptions{10, 20, 50};

struct RestockEvaluation {
    int quantity;
    double cost;
};

RestockEvaluation best_restock_cost(int current_stock, const DemandModel& model) {
    RestockEvaluation best{0, simulateCost(current_stock, model, kSimulations, kStockoutCost, kHoldingCost)};

    for (const int quantity : kRestockOptions) {
        const double cost = simulateCost(
            current_stock + quantity,
            model,
            kSimulations,
            kStockoutCost,
            kHoldingCost
        );

        if (cost < best.cost) {
            best = {quantity, cost};
        }
    }

    return best;
}

struct WarehouseEvaluation {
    const Warehouse* warehouse;
    int quantity;
    float distance;
    double cost;
};

WarehouseEvaluation select_best_warehouse(
    const std::string& product_id,
    int current_stock,
    const DemandModel& model,
    Location user_location,
    const std::vector<Warehouse>& warehouses
) {
    WarehouseEvaluation best{nullptr, 0, 0.0F, std::numeric_limits<double>::max()};

    for (float radius = 5.0F; radius <= 35.0F; radius += 5.0F) {
        bool found_in_radius = false;

        for (const Warehouse& warehouse : warehouses) {
            const float distance = distance_between(user_location, warehouse.location);
            if (distance > radius) {
                continue;
            }

            const auto stock = warehouse.stock_by_product.find(product_id);
            if (stock == warehouse.stock_by_product.end() || stock->second <= 0) {
                continue;
            }

            for (const int quantity : kRestockOptions) {
                if (stock->second < quantity) {
                    continue;
                }

                const double cost = simulateCost(
                    current_stock + quantity,
                    model,
                    kSimulations,
                    kStockoutCost,
                    kHoldingCost
                ) + static_cast<double>(distance) * kDistanceWeight;

                if (cost < best.cost) {
                    best = {&warehouse, quantity, distance, cost};
                    found_in_radius = true;
                }
            }
        }

        if (found_in_radius) {
            return best;
        }
    }

    return best;
}

Decision base_decision(int current_stock, const DemandModel& model) {
    const double hold_cost = simulateCost(current_stock, model, kSimulations, kStockoutCost, kHoldingCost);
    const double stockout_probability = estimateStockoutProbability(current_stock, model, kSimulations);
    const RestockEvaluation restock = best_restock_cost(current_stock, model);

    if (restock.quantity == 0 || hold_cost <= restock.cost) {
        return {
            "HOLD",
            0,
            "hold has the lowest expected Monte Carlo cost",
            "",
            0,
            0.0F,
            model.mean,
            model.std_dev,
            stockout_probability,
            hold_cost,
            restock.cost
        };
    }

    return {
        "RESTOCK",
        restock.quantity,
        "restock lowers expected Monte Carlo cost",
        "",
        0,
        0.0F,
        model.mean,
        model.std_dev,
        stockout_probability,
        hold_cost,
        restock.cost
    };
}
}

Decision decide(int current_stock, const DemandModel& model) {
    return base_decision(current_stock, model);
}

Decision decide(
    const ProductMetadata& metadata,
    const ProductProfile& profile,
    int stock,
    const DemandModel& model,
    Location user_location,
    const std::vector<Warehouse>& warehouses
) {
    const Decision base = base_decision(stock, model);

    if (base.action == "HOLD") {
        return base;
    }

    const WarehouseEvaluation warehouse = select_best_warehouse(
        metadata.product_name,
        stock,
        model,
        user_location,
        warehouses
    );

    if (warehouse.warehouse != nullptr && warehouse.cost <= base.expected_cost_hold) {
        std::string reason = "warehouse transfer minimizes expected Monte Carlo cost";
        if (profile.perishable && profile.fast_moving) {
            reason += "; perishable + high demand increases stockout risk";
        } else if (profile.high_delay || profile.fragile_supply) {
            reason += "; profile benefits from supply buffer";
        }

        return {
            "RESTOCK_FROM_WAREHOUSE",
            warehouse.quantity,
            reason,
            warehouse.warehouse->id,
            warehouse.warehouse->delivery_time,
            warehouse.distance,
            model.mean,
            model.std_dev,
            base.stockout_probability,
            base.expected_cost_hold,
            warehouse.cost
        };
    }

    return {
        "OUT_OF_STOCK_ALERT",
        base.recommended_quantity,
        "restock would lower expected cost, but no warehouse can satisfy the selected quantity",
        "",
        0,
        0.0F,
        model.mean,
        model.std_dev,
        base.stockout_probability,
        base.expected_cost_hold,
        base.expected_cost_restock
    };
}
