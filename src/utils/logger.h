#pragma once

#include <iostream>
#include <string>

inline void log_info(const std::string& message) {
    std::cout << "[info] " << message << '\n';
}
