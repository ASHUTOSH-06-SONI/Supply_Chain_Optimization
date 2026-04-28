# Inventory Intelligence System (v2)

Real-time, event-driven inventory intelligence prototype in C++ with an
interactive frontend for iterating on product state, demand estimates, and
inventory decisions.

## Prototype status

This is a working v2 prototype. The backend system loop is implemented as a
C++ simulation, while the frontend mirrors the same product input ->
intelligence -> reasoning -> prediction -> decision flow in the browser so the
experience can be tested before wiring in an API.

## What it does

The executable simulates a stream of inventory events, validates and processes
them, keeps live product state, estimates short-term demand with a moving
average, and emits inventory decisions.

Flow:

```text
Product Input -> Intelligence -> Reasoning -> Prediction -> Decision -> Output
```

## Current components

- Event ingestion: simulated sales and stock update events
- Processing: validation and state mutation
- State management: Redis-shaped in-memory client for stock and recent sales
- Product intelligence: cached metadata inference for known and unknown products
- Reasoning: converts metadata into decision-friendly product profiles
- Prediction: adaptive model selection over recent sales
- Geo-aware supply: simulated warehouses, radius search, and optimal warehouse selection
- Decision engine: `RESTOCK_FROM_WAREHOUSE`, `OUT_OF_STOCK_ALERT`, or `HOLD`
- Serving layer: console output plus static dashboard prototype

## Build and run

```bash
cmake -S . -B build
cmake --build build
./build/app
```

## Frontend prototype

The frontend is a static interactive dashboard for iterating on the real-time
workflow before wiring in an API.

Features:

- Inject manual `Sale` and `Stock` events.
- Type unknown products and preview inferred metadata before caching them.
- Run an automatic event stream.
- Watch stock, predicted demand, and restock decisions update live.
- Inspect product metadata, reasoning signals, prediction strategy, and decision rationale.
- Switch between white and black modes with a smooth icon-based transition.
- Inspect a demand-window chart and decision feed.

```bash
python3 -m http.server 5173 --directory frontend
```

Then open:

```text
http://localhost:5173
```

You can also open `frontend/index.html` directly in a browser for a quick local
preview.

## Next upgrades

- Replace the in-memory `RedisClient` internals with a real Redis driver.
- Add an API layer with Crow for event submission and decision retrieval.
- Connect the dashboard to the C++ API and websocket output.
- Swap the predictor for a stronger time-series model when the system loop is
  validated.
