#include "redis_client.h"

#include <algorithm>
#include <cmath>

namespace {
constexpr double kDemandAlpha = 0.35;
constexpr double kStdDevEpsilon = 0.25;
}

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

DemandModel RedisClient::get_demand_model(const std::string& product_id) const {
    const auto found = demand_models_.find(product_id);
    if (found == demand_models_.end()) {
        return {0.0, kStdDevEpsilon};
    }

    return found->second;
}

void RedisClient::update_demand_model(const std::string& product_id, int sale_quantity) {
    const double sale = static_cast<double>(std::max(0, sale_quantity));
    auto found = demand_models_.find(product_id);

    if (found == demand_models_.end()) {
        const double initial_std_dev = std::max(kStdDevEpsilon, sale * 0.25);
        demand_models_[product_id] = {sale, initial_std_dev};
        return;
    }

    DemandModel& model = found->second;
    const double previous_mean = model.mean;
    const double previous_variance = model.std_dev * model.std_dev;
    const double delta = sale - previous_mean;

    model.mean = kDemandAlpha * sale + (1.0 - kDemandAlpha) * previous_mean;
    const double variance = (1.0 - kDemandAlpha) * (previous_variance + kDemandAlpha * delta * delta);
    model.std_dev = std::max(kStdDevEpsilon, std::sqrt(std::max(0.0, variance)));
}

void RedisClient::set_demand_model(const std::string& product_id, DemandModel model) {
    model.std_dev = std::max(kStdDevEpsilon, model.std_dev);
    demand_models_[product_id] = model;
}
