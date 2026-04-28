#include "agent.h"

#include <algorithm>
#include <cctype>

namespace {
std::string normalize(const std::string& value) {
    std::string normalized;
    normalized.reserve(value.size());

    for (char character : value) {
        if (std::isalnum(static_cast<unsigned char>(character))) {
            normalized.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(character))));
        } else if (!normalized.empty() && normalized.back() != ' ') {
            normalized.push_back(' ');
        }
    }

    if (!normalized.empty() && normalized.back() == ' ') {
        normalized.pop_back();
    }

    return normalized;
}

bool contains_any(const std::string& value, const std::vector<std::string>& tokens) {
    return std::any_of(tokens.begin(), tokens.end(), [&](const std::string& token) {
        return value.find(token) != std::string::npos;
    });
}
}

const ProductMetadata& ProductIntelligenceAgent::get_product_metadata(const std::string& product_name) {
    const std::string key = normalize(product_name);
    const auto found = product_cache_.find(key);
    if (found != product_cache_.end()) {
        return found->second;
    }

    auto inserted = product_cache_.emplace(key, infer_metadata(key));
    return inserted.first->second;
}

ProductMetadata ProductIntelligenceAgent::infer_metadata(const std::string& product_name) const {
    if (contains_any(product_name, {"milk", "yogurt", "curd", "cheese", "paneer"})) {
        return {product_name, "dairy", "perishable", 3, "high_frequency", "low", 1, {"refrigeration"}, "low"};
    }

    if (contains_any(product_name, {"bread", "bun", "cake", "pastry"})) {
        return {product_name, "bakery", "perishable", 2, "high_frequency", "low", 1, {"cool_dry_storage"}, "medium"};
    }

    if (contains_any(product_name, {"rice", "wheat", "flour", "lentil", "dal", "pasta"})) {
        return {product_name, "staples", "durable", 365, "medium", "medium", 3, {"dry_storage"}, "medium"};
    }

    if (contains_any(product_name, {"phone", "laptop", "tablet", "charger", "headphone"})) {
        return {product_name, "electronics", "durable", 1095, "low_frequency", "high", 7, {"shock_protection", "dry_storage"}, "high"};
    }

    if (contains_any(product_name, {"detergent", "soap", "cleaner", "shampoo"})) {
        return {product_name, "household", "durable", 730, "medium", "medium", 5, {"dry_storage"}, "medium"};
    }

    if (contains_any(product_name, {"tomato", "apple", "banana", "onion", "potato", "vegetable", "fruit"})) {
        return {product_name, "produce", "perishable", 5, "high_frequency", "medium", 2, {"temperature_control"}, "medium"};
    }

    return {product_name, "general", "semi-perishable", 90, "medium", "medium", 3, {"standard_storage"}, "medium"};
}
