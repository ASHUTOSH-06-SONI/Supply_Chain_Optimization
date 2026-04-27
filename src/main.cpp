#include <iostream>
#include <unordered_map>

#include "decision/decision_engine.h"
#include "ingestion/event_listener.h"
#include "prediction/predictor.h"
#include "processing/processor.h"
#include "storage/redis_client.h"
#include "utils/logger.h"

std::string event_type_name(EventType type) {
    return type == EventType::Sale ? "SALE" : "STOCK_UPDATE";
}

int main() {
    RedisClient state;
    Processor processor(state);
    Predictor predictor;
    EventListener listener;

    const std::unordered_map<std::string, Product> products = {
        {"milk", {"milk", ProductType::Perishable, 3, 1, 5}},
        {"rice", {"rice", ProductType::Durable, 365, 3, 12}}
    };

    log_info("Inventory Intelligence System v2 started");

    for (const Event& event : listener.simulated_events()) {
        const bool accepted = processor.process(event);
        std::cout << "event=" << event_type_name(event.type)
                  << " product=" << event.product_id
                  << " quantity=" << event.quantity
                  << " accepted=" << (accepted ? "true" : "false")
                  << '\n';

        if (!accepted || event.type != EventType::Sale) {
            continue;
        }

        const auto product = products.at(event.product_id);
        const int stock = state.get_stock(event.product_id);
        const float demand = predictor.estimate_demand(
            state.recent_sales(event.product_id),
            product.lead_time
        );
        const Decision decision = decide(product, stock, demand);

        std::cout << "  stock=" << stock
                  << " predicted_demand=" << demand
                  << " action=" << decision.action
                  << " reorder_qty=" << decision.recommended_quantity
                  << " reason=\"" << decision.reason << "\""
                  << '\n';
    }

    return 0;
}
