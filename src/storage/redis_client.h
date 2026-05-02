#pragma once

#include <deque>
#include <string>
#include <unordered_map>
#include <vector>

#include "../models/demand_model.h"

class RedisClient {
public:
    explicit RedisClient(std::size_t sales_window = 5);

    void set_stock(const std::string& product_id, int stock);
    int get_stock(const std::string& product_id) const;

    void record_sale(const std::string& product_id, int quantity);
    std::vector<int> recent_sales(const std::string& product_id) const;
    DemandModel get_demand_model(const std::string& product_id) const;
    void update_demand_model(const std::string& product_id, int sale_quantity);
    void set_demand_model(const std::string& product_id, DemandModel model);

private:
    std::size_t sales_window_;
    std::unordered_map<std::string, int> stock_by_product_;
    std::unordered_map<std::string, std::deque<int>> recent_sales_by_product_;
    std::unordered_map<std::string, DemandModel> demand_models_;
};
