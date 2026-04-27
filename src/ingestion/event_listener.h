#pragma once

#include <vector>

#include "../models/event.h"

class EventListener {
public:
    std::vector<Event> simulated_events() const;
};
