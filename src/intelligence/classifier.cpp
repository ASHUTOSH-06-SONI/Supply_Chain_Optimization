#include "classifier.h"

ProductProfile classify(const ProductMetadata& metadata) {
    ProductProfile profile{};

    profile.perishable = metadata.type == "perishable" || metadata.type == "semi-perishable";
    profile.fast_moving = metadata.demand_pattern == "high_frequency";
    profile.high_delay = metadata.lead_time > 3;
    profile.fragile_supply = metadata.supply_chain_complexity == "high";

    profile.safety_stock = 5;
    if (profile.fast_moving) {
        profile.safety_stock += 4;
        profile.signals.push_back("fast moving demand");
    }
    if (profile.perishable) {
        profile.signals.push_back("expiry-sensitive inventory");
    }
    if (profile.high_delay) {
        profile.safety_stock += 6;
        profile.signals.push_back("long replenishment delay");
    }
    if (profile.fragile_supply) {
        profile.safety_stock += 5;
        profile.signals.push_back("fragile supply chain");
    }

    if (profile.fast_moving && profile.perishable) {
        profile.prediction_strategy = "short_term_moving_average";
    } else if (profile.high_delay) {
        profile.prediction_strategy = "buffered_forecast";
    } else {
        profile.prediction_strategy = "simple_trend";
    }

    if (profile.signals.empty()) {
        profile.signals.push_back("standard replenishment profile");
    }

    return profile;
}
