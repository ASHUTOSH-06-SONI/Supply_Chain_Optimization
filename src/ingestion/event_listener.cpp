#include "event_listener.h"

std::vector<Event> EventListener::simulated_events() const {
    return {
        Event::stock_update("milk", 35, "2026-04-28T09:00:00+05:30"),
        Event::stock_update("rice", 80, "2026-04-28T09:00:00+05:30"),
        Event::sale("milk", 12, "2026-04-28T09:05:00+05:30"),
        Event::sale("rice", 8, "2026-04-28T09:06:00+05:30"),
        Event::sale("milk", 18, "2026-04-28T09:07:00+05:30"),
        Event::sale("rice", 10, "2026-04-28T09:08:00+05:30"),
        Event::sale("milk", 7, "2026-04-28T09:09:00+05:30")
    };
}
