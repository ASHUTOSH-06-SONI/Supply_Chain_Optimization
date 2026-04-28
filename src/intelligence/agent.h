#pragma once

#include <string>
#include <unordered_map>
#include <vector>

struct ProductMetadata {
    std::string product_name;
    std::string category;
    std::string type;
    int expiry_days;
    std::string demand_pattern;
    std::string supply_chain_complexity;
    int lead_time;
    std::vector<std::string> storage_constraints;
    std::string price_sensitivity;
};

class ProductIntelligenceAgent {
public:
    const ProductMetadata& get_product_metadata(const std::string& product_name);

private:
    std::unordered_map<std::string, ProductMetadata> product_cache_;

    ProductMetadata infer_metadata(const std::string& product_name) const;
};
