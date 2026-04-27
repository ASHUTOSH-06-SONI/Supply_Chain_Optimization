#pragma once

#include <string>

#include "../models/product.h"

struct Decision {
    std::string action;
    int recommended_quantity;
    std::string reason;
};

Decision decide(const Product& product, int stock, float demand);
