#include "decision_engine.h"

#include <algorithm>
#include <cmath>

Decision decide(const Product& product, int stock, float demand) {
    const int projected_need = static_cast<int>(std::ceil(demand)) + product.safety_stock;

    if (stock >= projected_need) {
        return {"HOLD", 0, "stock covers predicted demand plus safety stock"};
    }

    const int recommended_quantity = std::max(0, projected_need - stock);

    if (product.is_perishable()) {
        return {
            "RESTOCK_FAST",
            recommended_quantity,
            "perishable product is below its lead-time demand threshold"
        };
    }

    return {
        "RESTOCK",
        recommended_quantity,
        "stock is below predicted demand plus safety stock"
    };
}
