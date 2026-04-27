#pragma once

#include <string>

enum class EventType {
    Sale,
    StockUpdate
};

struct Event {
    EventType type;
    std::string product_id;
    int quantity;
    std::string timestamp;

    static Event sale(const std::string& product_id, int quantity, const std::string& timestamp) {
        return {EventType::Sale, product_id, quantity, timestamp};
    }

    static Event stock_update(const std::string& product_id, int quantity, const std::string& timestamp) {
        return {EventType::StockUpdate, product_id, quantity, timestamp};
    }
};
