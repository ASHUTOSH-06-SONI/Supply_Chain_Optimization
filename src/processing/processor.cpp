#include "processor.h"

#include <algorithm>

Processor::Processor(RedisClient& state) : state_(state) {}

bool Processor::process(const Event& event) {
    if (!is_valid(event)) {
        return false;
    }

    if (event.type == EventType::StockUpdate) {
        state_.set_stock(event.product_id, event.quantity);
        return true;
    }

    const int current_stock = state_.get_stock(event.product_id);
    state_.set_stock(event.product_id, std::max(0, current_stock - event.quantity));
    state_.record_sale(event.product_id, event.quantity);
    return true;
}

bool Processor::is_valid(const Event& event) const {
    return !event.product_id.empty() && event.quantity >= 0;
}
