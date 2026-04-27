cmake_minimum_required(VERSION 3.16)

project(InventoryIntelligenceSystem VERSION 2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(app
    src/main.cpp
    src/decision/decision_engine.cpp
    src/ingestion/event_listener.cpp
    src/prediction/predictor.cpp
    src/processing/processor.cpp
    src/storage/redis_client.cpp
)

target_include_directories(app PRIVATE src)
