#pragma once

#include <string>

enum class ProductType {
    Perishable,
    Durable
};

struct Product {
    std::string product_id;
    ProductType type;
    int expiry_days;
    int lead_time;
    int safety_stock;

    bool is_perishable() const {
        return type == ProductType::Perishable;
    }
};
