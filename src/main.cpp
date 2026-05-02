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

void run_monte_carlo_demo() {
    const DemandModel volatile_model{20.0, 14.0};
    const int stock = 22;
    const Decision monte_carlo = decide(stock, volatile_model);
    const std::string naive = stock >= static_cast<int>(volatile_model.mean) ? "HOLD" : "RESTOCK";

    std::cout << "\n[demo] high variance demand scenario\n"
              << "  stock=" << stock
              << " mean=" << volatile_model.mean
              << " std_dev=" << volatile_model.std_dev
              << " naive_decision=" << naive
              << " monte_carlo_decision=" << monte_carlo.action
              << " stockout_probability=" << monte_carlo.stockout_probability
              << " hold_cost=" << monte_carlo.expected_cost_hold
              << " restock_cost=" << monte_carlo.expected_cost_restock
              << '\n';
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
        const DemandModel demand_model = state.get_demand_model(event.product_id);
        const Prediction prediction = predictor.estimate_demand(
            state.recent_sales(event.product_id),
            metadata,
            profile
        );
        const Decision decision = decide(
            metadata,
            profile,
            stock,
            demand_model,
            user_location,
            warehouses
        );

        std::cout << "  product_id=" << metadata.product_name
                  << " stock=" << stock
                  << " category=" << metadata.category
                  << " type=" << metadata.type
                  << " strategy=" << prediction.strategy
                  << " predicted_mean=" << decision.demand_mean
                  << " predicted_std_dev=" << decision.demand_std_dev
                  << " stockout_probability=" << decision.stockout_probability
                  << " hold_cost=" << decision.expected_cost_hold
                  << " restock_cost=" << decision.expected_cost_restock
                  << " action=" << decision.action
                  << " reorder_qty=" << decision.recommended_quantity
                  << " warehouse=" << (decision.selected_warehouse_id.empty() ? "none" : decision.selected_warehouse_id)
                  << " eta_days=" << decision.estimated_delivery_time
                  << " warehouse_distance=" << decision.warehouse_distance
                  << " reason=\"" << decision.reason << "\""
                  << '\n';
    }

    run_monte_carlo_demo();

    return 0;
}
