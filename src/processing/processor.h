#pragma once

#include "../models/event.h"
#include "../storage/redis_client.h"

class Processor {
public:
    explicit Processor(RedisClient& state);

    bool process(const Event& event);

private:
    RedisClient& state_;

    bool is_valid(const Event& event) const;
};
