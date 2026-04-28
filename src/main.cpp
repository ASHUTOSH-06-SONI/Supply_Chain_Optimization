#include <iostream>

#include "decision/decision_engine.h"
#include "intelligence/agent.h"
#include "intelligence/classifier.h"
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
    ProductIntelligenceAgent agent;
    const Location user_location{4.0F, 5.0F};
    const std::vector<Warehouse> warehouses = simulated_warehouses();

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

        const ProductMetadata& metadata = agent.get_product_metadata(event.product_id);
        const ProductProfile profile = classify(metadata);
        const int stock = state.get_stock(event.product_id);
        const Prediction prediction = predictor.estimate_demand(
            state.recent_sales(event.product_id),
            metadata,
            profile
        );
        const Decision decision = decide(
            metadata,
            profile,
            stock,
            prediction.demand,
            user_location,
            warehouses
        );

        std::cout << "  product_id=" << metadata.product_name
                  << " stock=" << stock
                  << " category=" << metadata.category
                  << " type=" << metadata.type
                  << " strategy=" << prediction.strategy
                  << " predicted_demand=" << prediction.demand
                  << " action=" << decision.action
                  << " reorder_qty=" << decision.recommended_quantity
                  << " warehouse=" << (decision.selected_warehouse_id.empty() ? "none" : decision.selected_warehouse_id)
                  << " eta_days=" << decision.estimated_delivery_time
                  << " warehouse_distance=" << decision.warehouse_distance
                  << " reason=\"" << decision.reason << "\""
                  << '\n';
    }

    return 0;
}
