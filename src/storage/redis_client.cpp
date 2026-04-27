#include "redis_client.h"

#include <algorithm>

RedisClient::RedisClient(std::size_t sales_window)
    : sales_window_(std::max<std::size_t>(1, sales_window)) {}

void RedisClient::set_stock(const std::string& product_id, int stock) {
    stock_by_product_[product_id] = std::max(0, stock);
}

int RedisClient::get_stock(const std::string& product_id) const {
    const auto found = stock_by_product_.find(product_id);
    if (found == stock_by_product_.end()) {
        return 0;
    }
    return found->second;
}

void RedisClient::record_sale(const std::string& product_id, int quantity) {
    auto& sales = recent_sales_by_product_[product_id];
    sales.push_back(std::max(0, quantity));

    while (sales.size() > sales_window_) {
        sales.pop_front();
    }
}

std::vector<int> RedisClient::recent_sales(const std::string& product_id) const {
    const auto found = recent_sales_by_product_.find(product_id);
    if (found == recent_sales_by_product_.end()) {
        return {};
    }

    return {found->second.begin(), found->second.end()};
}
