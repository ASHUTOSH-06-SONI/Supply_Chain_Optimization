#include "decision_engine.h"

#include <algorithm>
#include <cmath>

Decision decide(
    const ProductMetadata& metadata,
    const ProductProfile& profile,
    int stock,
    float demand,
    Location user_location,
    const std::vector<Warehouse>& warehouses
) {
    const int projected_need = std::max(1, static_cast<int>(std::ceil(demand)));

    if (stock >= projected_need) {
        return {"HOLD", 0, "local stock covers predicted demand", "", 0, 0.0F};
    }

    const int recommended_quantity = std::max(0, projected_need - stock);
    WarehouseCandidate selected{{"", {0.0F, 0.0F}, {}, 0}, 0.0F};
    for (float radius = 5.0F; radius <= 35.0F; radius += 5.0F) {
        const std::vector<WarehouseCandidate> nearby = find_nearby_warehouses(user_location, warehouses, radius);
        selected = select_optimal_warehouse(metadata.product_name, recommended_quantity, nearby);
        if (!selected.warehouse.id.empty()) {
            break;
        }
    }

    if (!selected.warehouse.id.empty()) {
        std::string reason = "local shortage covered by nearby warehouse";
        if (profile.perishable && profile.fast_moving) {
            reason += "; perishable + high demand prioritizes fast replenishment";
        } else if (profile.high_delay || profile.fragile_supply) {
            reason += "; profile benefits from supply buffer";
        }

        return {
            "RESTOCK_FROM_WAREHOUSE",
            recommended_quantity,
            reason,
            selected.warehouse.id,
            selected.warehouse.delivery_time,
            selected.distance
        };
    }

    return {
        "OUT_OF_STOCK_ALERT",
        recommended_quantity,
        "local stock is below demand and no nearby warehouse has sufficient stock",
        "",
        0,
        0.0F
    };
}
