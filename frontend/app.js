const productCache = {};
const maxHistory = 8;
let selectedEventType = "sale";
let eventCount = 0;
let streamTimer = null;
let feedItems = [];

const seedProducts = [
  { name: "milk", stock: 35, recentSales: [10, 12, 9] },
  { name: "rice", stock: 80, recentSales: [7, 8, 10] },
  { name: "bread", stock: 42, recentSales: [15, 14, 16] },
  { name: "detergent", stock: 58, recentSales: [3, 5, 4] },
];

const userLocation = { x: 4, y: 5 };
const warehouses = [
  {
    id: "warehouse_north",
    location: { x: 2, y: 4 },
    stockByProduct: { milk: 40, rice: 30, bread: 25, detergent: 20 },
    deliveryTime: 1,
  },
  {
    id: "warehouse_central",
    location: { x: 7, y: 8 },
    stockByProduct: { milk: 8, rice: 80, laptop: 10, detergent: 50 },
    deliveryTime: 2,
  },
  {
    id: "warehouse_east",
    location: { x: 16, y: 6 },
    stockByProduct: { laptop: 20, phone: 30, tablet: 18, rice: 45 },
    deliveryTime: 4,
  },
  {
    id: "warehouse_far",
    location: { x: 26, y: 22 },
    stockByProduct: { "general item": 50, tomato: 35, apple: 30, headphone: 15 },
    deliveryTime: 7,
  },
];

const elements = {
  productInput: document.querySelector("#product-input"),
  productOptions: document.querySelector("#product-options"),
  quantityInput: document.querySelector("#quantity-input"),
  injectEvent: document.querySelector("#inject-event"),
  autoStream: document.querySelector("#auto-stream"),
  speedRange: document.querySelector("#speed-range"),
  resetState: document.querySelector("#reset-state"),
  themeToggle: document.querySelector("#theme-toggle"),
  streamStatus: document.querySelector("#stream-status"),
  statusShell: document.querySelector(".system-status"),
  inventoryBody: document.querySelector("#inventory-body"),
  chart: document.querySelector("#demand-chart"),
  chartLabel: document.querySelector("#chart-product-label"),
  decisionFeed: document.querySelector("#decision-feed"),
  metadataCard: document.querySelector("#metadata-card"),
  cacheStatus: document.querySelector("#cache-status"),
  lastEventTime: document.querySelector("#last-event-time"),
  eventCount: document.querySelector("#event-count"),
  metricProducts: document.querySelector("#metric-products"),
  metricStock: document.querySelector("#metric-stock"),
  metricDemand: document.querySelector("#metric-demand"),
  metricRestocks: document.querySelector("#metric-restocks"),
};

seedProducts.forEach((product) => {
  const cachedProduct = getProduct(product.name);
  cachedProduct.stock = product.stock;
  cachedProduct.recentSales = [...product.recentSales];
});

document.querySelectorAll("[data-event-type]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedEventType = button.dataset.eventType;
    document.querySelectorAll("[data-event-type]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  });
});

elements.productInput.addEventListener("change", () => {
  getProduct(elements.productInput.value);
  render();
});
elements.productInput.addEventListener("input", () => {
  if (elements.productInput.value.trim()) {
    renderMetadata(previewProduct(elements.productInput.value), false);
  }
});
elements.quantityInput.addEventListener("input", clampQuantity);
elements.injectEvent.addEventListener("click", () => {
  ingestEvent({
    type: selectedEventType,
    productName: elements.productInput.value,
    quantity: Number(elements.quantityInput.value),
  });
});
elements.autoStream.addEventListener("change", toggleStream);
elements.speedRange.addEventListener("input", () => {
  if (streamTimer) {
    stopStream();
    startStream();
  }
});
elements.resetState.addEventListener("click", resetState);
elements.themeToggle.addEventListener("click", toggleTheme);

function normalizeProductName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function titleCase(value) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function getProduct(productName) {
  const normalized = normalizeProductName(productName || "general item");
  if (!productCache[normalized]) {
    productCache[normalized] = {
      ...getProductMetadata(normalized),
      profile: null,
      stock: 30,
      recentSales: seedHistoryFor(normalized),
      color: colorForIndex(Object.keys(productCache).length),
    };
  }

  productCache[normalized].profile = classify(productCache[normalized]);
  return productCache[normalized];
}

function previewProduct(productName) {
  const metadataPreview = getProductMetadata(productName);
  const preview = {
    ...metadataPreview,
    profile: null,
    stock: 30,
    recentSales: seedHistoryFor(productName),
    color: "#777777",
  };
  preview.profile = classify(preview);
  return preview;
}

function getProductMetadata(productName) {
  const normalized = normalizeProductName(productName);
  const cached = productCache[normalized];
  if (cached) {
    return cached;
  }

  if (containsAny(normalized, ["milk", "yogurt", "curd", "cheese", "paneer"])) {
    return metadata(normalized, "dairy", "perishable", 3, "high_frequency", "low", 1, ["refrigeration"], "low");
  }
  if (containsAny(normalized, ["bread", "bun", "cake", "pastry"])) {
    return metadata(normalized, "bakery", "perishable", 2, "high_frequency", "low", 1, ["cool_dry_storage"], "medium");
  }
  if (containsAny(normalized, ["rice", "wheat", "flour", "lentil", "dal", "pasta"])) {
    return metadata(normalized, "staples", "durable", 365, "medium", "medium", 3, ["dry_storage"], "medium");
  }
  if (containsAny(normalized, ["phone", "laptop", "tablet", "charger", "headphone"])) {
    return metadata(normalized, "electronics", "durable", 1095, "low_frequency", "high", 7, ["shock_protection", "dry_storage"], "high");
  }
  if (containsAny(normalized, ["detergent", "soap", "cleaner", "shampoo"])) {
    return metadata(normalized, "household", "durable", 730, "medium", "medium", 5, ["dry_storage"], "medium");
  }
  if (containsAny(normalized, ["tomato", "apple", "banana", "onion", "potato", "vegetable", "fruit"])) {
    return metadata(normalized, "produce", "perishable", 5, "high_frequency", "medium", 2, ["temperature_control"], "medium");
  }

  return metadata(normalized, "general", "semi-perishable", 90, "medium", "medium", 3, ["standard_storage"], "medium");
}

function metadata(productName, category, type, expiryDays, demandPattern, supplyChainComplexity, leadTime, storageConstraints, priceSensitivity) {
  return {
    productName,
    displayName: titleCase(productName),
    category,
    type,
    expiryDays,
    demandPattern,
    supplyChainComplexity,
    leadTime,
    storageConstraints,
    priceSensitivity,
  };
}

function containsAny(value, tokens) {
  return tokens.some((token) => value.includes(token));
}

function classify(product) {
  const profile = {
    perishable: product.type === "perishable" || product.type === "semi-perishable",
    fastMoving: product.demandPattern === "high_frequency",
    highDelay: product.leadTime > 3,
    fragileSupply: product.supplyChainComplexity === "high",
    safetyStock: 5,
    predictionStrategy: "simple_trend",
    signals: [],
  };

  if (profile.fastMoving) {
    profile.safetyStock += 4;
    profile.signals.push("fast moving");
  }
  if (profile.perishable) {
    profile.signals.push("expiry sensitive");
  }
  if (profile.highDelay) {
    profile.safetyStock += 6;
    profile.signals.push("long lead time");
  }
  if (profile.fragileSupply) {
    profile.safetyStock += 5;
    profile.signals.push("fragile supply");
  }

  if (profile.fastMoving && profile.perishable) {
    profile.predictionStrategy = "short_term_moving_average";
  } else if (profile.highDelay) {
    profile.predictionStrategy = "buffered_forecast";
  }

  if (!profile.signals.length) {
    profile.signals.push("standard replenishment");
  }

  return profile;
}

function estimateDemand(product) {
  if (!product.recentSales.length) {
    return { demand: 0, strategy: product.profile.predictionStrategy };
  }

  const total = product.recentSales.reduce((sum, value) => sum + value, 0);
  let demand = (total / product.recentSales.length) * product.leadTime;

  if (product.profile.predictionStrategy === "buffered_forecast") {
    demand *= 1.25;
  } else if (product.profile.predictionStrategy === "simple_trend" && product.recentSales.length >= 2) {
    const last = product.recentSales[product.recentSales.length - 1];
    const previous = product.recentSales[product.recentSales.length - 2];
    demand += Math.max(0, last - previous) * 0.5;
  }

  return { demand, strategy: product.profile.predictionStrategy };
}

function decide(product, prediction) {
  const projectedNeed = Math.max(1, Math.ceil(prediction.demand));

  if (product.stock >= projectedNeed) {
    return {
      action: "HOLD",
      reorderQty: 0,
      reason: "Local stock covers predicted demand.",
      className: "hold",
      selectedWarehouseId: "",
      estimatedDeliveryTime: 0,
      warehouseDistance: 0,
    };
  }

  const reorderQty = Math.max(0, projectedNeed - product.stock);
  const selectedWarehouse = findSuitableWarehouse(product.productName, reorderQty);

  if (selectedWarehouse) {
    const priorityReason = product.profile.perishable && product.profile.fastMoving
      ? " Perishable + high demand prioritizes fast replenishment."
      : product.profile.highDelay || product.profile.fragileSupply
        ? " Product profile benefits from a supply buffer."
        : "";

    return {
      action: "RESTOCK_FROM_WAREHOUSE",
      reorderQty,
      reason: `Local shortage covered by nearby warehouse.${priorityReason}`,
      className: "fast",
      selectedWarehouseId: selectedWarehouse.warehouse.id,
      estimatedDeliveryTime: selectedWarehouse.warehouse.deliveryTime,
      warehouseDistance: selectedWarehouse.distance,
    };
  }

  return {
    action: "OUT_OF_STOCK_ALERT",
    reorderQty,
    reason: "Local stock is below demand and no nearby warehouse has sufficient stock.",
    className: "alert",
    selectedWarehouseId: "",
    estimatedDeliveryTime: 0,
    warehouseDistance: 0,
  };
}

function distanceBetween(first, second) {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function findNearbyWarehouses(location, radius) {
  return warehouses
    .map((warehouse) => ({
      warehouse,
      distance: distanceBetween(location, warehouse.location),
    }))
    .filter((candidate) => candidate.distance <= radius);
}

function hasSufficientStock(warehouse, productName, requiredQuantity) {
  return (warehouse.stockByProduct[productName] || 0) >= requiredQuantity;
}

function selectOptimalWarehouse(productName, requiredQuantity, candidates) {
  return candidates
    .filter((candidate) => hasSufficientStock(candidate.warehouse, productName, requiredQuantity))
    .sort((first, second) => {
      if (first.warehouse.deliveryTime !== second.warehouse.deliveryTime) {
        return first.warehouse.deliveryTime - second.warehouse.deliveryTime;
      }
      return first.distance - second.distance;
    })[0] || null;
}

function findSuitableWarehouse(productName, requiredQuantity) {
  for (let radius = 5; radius <= 35; radius += 5) {
    const selected = selectOptimalWarehouse(
      productName,
      requiredQuantity,
      findNearbyWarehouses(userLocation, radius),
    );

    if (selected) {
      return selected;
    }
  }

  return null;
}

function ingestEvent(event) {
  const product = getProduct(event.productName);
  const quantity = Math.max(0, Math.round(event.quantity || 0));

  if (event.type === "stock") {
    product.stock = quantity;
  } else {
    product.stock = Math.max(0, product.stock - quantity);
    product.recentSales.push(quantity);
    product.recentSales = product.recentSales.slice(-maxHistory);
  }

  eventCount += 1;
  elements.lastEventTime.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const prediction = estimateDemand(product);
  const decision = decide(product, prediction);
  feedItems.unshift({
    event,
    productName: product.displayName,
    prediction,
    decision,
    profile: product.profile,
    time: elements.lastEventTime.textContent,
  });
  feedItems = feedItems.slice(0, 18);
  elements.productInput.value = product.productName;

  render();
}

function createRandomEvent() {
  const products = Object.values(productCache);
  const product = products[Math.floor(Math.random() * products.length)];
  const type = Math.random() > 0.22 ? "sale" : "stock";
  const quantity = type === "sale"
    ? Math.max(1, Math.round(product.profile.safetyStock + Math.random() * 16))
    : Math.max(product.stock + 12, Math.round(capacityFor(product) * (0.55 + Math.random() * 0.35)));

  return { type, productName: product.productName, quantity };
}

function seedHistoryFor(productName) {
  const inferred = getProductMetadata(productName);
  if (inferred.demandPattern === "high_frequency") {
    return [9, 12, 14];
  }
  if (inferred.demandPattern === "low_frequency") {
    return [2, 3, 4];
  }
  return [5, 7, 6];
}

function capacityFor(product) {
  if (product.type === "perishable") {
    return 70;
  }
  if (product.supplyChainComplexity === "high") {
    return 45;
  }
  return 120;
}

function colorForIndex(index) {
  const colors = ["#111111", "#555555", "#8c8c8c", "#d8d8d8", "#777777", "#bbbbbb"];
  return colors[index % colors.length];
}

function clampQuantity() {
  const value = Number(elements.quantityInput.value);
  if (Number.isNaN(value) || value < 0) {
    elements.quantityInput.value = 0;
  }
}

function toggleStream() {
  if (elements.autoStream.checked) {
    startStream();
  } else {
    stopStream();
  }
}

function startStream() {
  elements.statusShell.classList.add("running");
  elements.streamStatus.textContent = "Stream running";
  streamTimer = window.setInterval(() => {
    ingestEvent(createRandomEvent());
  }, Number(elements.speedRange.value));
}

function stopStream() {
  window.clearInterval(streamTimer);
  streamTimer = null;
  elements.statusShell.classList.remove("running");
  elements.streamStatus.textContent = "Stream idle";
}

function resetState() {
  if (streamTimer) {
    elements.autoStream.checked = false;
    stopStream();
  }

  Object.keys(productCache).forEach((key) => delete productCache[key]);
  seedProducts.forEach((product) => {
    const metadata = getProduct(product.name);
    metadata.stock = product.stock;
    metadata.recentSales = [...product.recentSales];
  });
  eventCount = 0;
  feedItems = [];
  elements.productInput.value = "milk";
  elements.lastEventTime.textContent = "No events";
  render();
}

function initTheme() {
  const savedTheme = window.localStorage.getItem("inventory-theme");
  const theme = savedTheme || "light";
  document.body.dataset.theme = theme;
  syncThemeButton(theme);
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  const applyTheme = () => {
    document.body.dataset.theme = nextTheme;
    window.localStorage.setItem("inventory-theme", nextTheme);
    syncThemeButton(nextTheme);
    renderChart(getProduct(elements.productInput.value));
  };

  if (document.startViewTransition) {
    document.startViewTransition(applyTheme);
    return;
  }

  applyTheme();
}

function syncThemeButton(theme) {
  const isDark = theme === "dark";
  elements.themeToggle.setAttribute("aria-label", isDark ? "Switch to white mode" : "Switch to black mode");
}

function render() {
  renderProductOptions();
  const selectedProduct = getProduct(elements.productInput.value);
  const rows = Object.values(productCache).map((product) => {
    const prediction = estimateDemand(product);
    const decision = decide(product, prediction);
    const stockPercent = Math.min(100, Math.round((product.stock / capacityFor(product)) * 100));

    return `
      <tr>
        <td>
          <div class="product-cell">
            <span class="swatch" style="background:${product.color}"></span>
            <div>
              <div>${product.displayName}</div>
              <div class="subtle">${product.productName}</div>
            </div>
          </div>
        </td>
        <td>
          <div>${product.category} / ${product.type}</div>
          <div class="subtle">${product.expiryDays}d expiry · ${product.leadTime}d lead</div>
        </td>
        <td>
          <div>${product.stock}</div>
          <div class="stock-bar" aria-hidden="true"><span style="width:${stockPercent}%"></span></div>
        </td>
        <td>
          <div>${formatNumber(prediction.demand)}</div>
          <div class="subtle">${formatStrategy(prediction.strategy)}</div>
        </td>
        <td>${profileTags(product.profile).map((tag) => `<span class="mini-tag">${tag}</span>`).join("")}</td>
        <td>${formatSupply(decision)}</td>
        <td><span class="badge ${decision.className}">${decision.action}</span></td>
        <td>${decision.reorderQty}</td>
      </tr>
    `;
  }).join("");

  elements.inventoryBody.innerHTML = rows;
  renderMetadata(selectedProduct, true);
  renderMetrics();
  renderFeed();
  renderChart(selectedProduct);
}

function renderProductOptions() {
  elements.productOptions.innerHTML = Object.values(productCache)
    .map((product) => `<option value="${product.productName}">${product.displayName}</option>`)
    .join("");
}

function renderMetadata(product, fromCache) {
  const prediction = estimateDemand(product);
  const decision = decide(product, prediction);
  elements.cacheStatus.textContent = fromCache ? "Cached metadata" : "Preview";
  elements.metadataCard.innerHTML = `
    <div class="metadata-title">
      <span>${product.displayName}</span>
      <strong>${decision.action}</strong>
    </div>
    <dl class="metadata-grid">
      <div><dt>Category</dt><dd>${product.category}</dd></div>
      <div><dt>Type</dt><dd>${product.type}</dd></div>
      <div><dt>Demand</dt><dd>${product.demandPattern}</dd></div>
      <div><dt>Supply</dt><dd>${product.supplyChainComplexity}</dd></div>
      <div><dt>Lead time</dt><dd>${product.leadTime} days</dd></div>
      <div><dt>Expiry</dt><dd>${product.expiryDays} days</dd></div>
      <div><dt>Storage</dt><dd>${product.storageConstraints.join(", ")}</dd></div>
      <div><dt>Price sensitivity</dt><dd>${product.priceSensitivity}</dd></div>
      <div><dt>Warehouse</dt><dd>${decision.selectedWarehouseId || "none"}</dd></div>
      <div><dt>ETA</dt><dd>${decision.estimatedDeliveryTime ? `${decision.estimatedDeliveryTime} days` : "n/a"}</dd></div>
    </dl>
    <div class="reasoning-strip">
      ${product.profile.signals.map((signal) => `<span>${signal}</span>`).join("")}
    </div>
    <p class="decision-rationale">${decision.reason}</p>
  `;
}

function renderMetrics() {
  const values = Object.values(productCache);
  const totalStock = values.reduce((sum, product) => sum + product.stock, 0);
  const totalDemand = values.reduce((sum, product) => sum + estimateDemand(product).demand, 0);
  const restocks = values.filter((product) => decide(product, estimateDemand(product)).action !== "HOLD").length;

  elements.metricProducts.textContent = String(values.length);
  elements.metricStock.textContent = String(totalStock);
  elements.metricDemand.textContent = formatNumber(totalDemand);
  elements.metricRestocks.textContent = String(restocks);
  elements.eventCount.textContent = `${eventCount} ${eventCount === 1 ? "event" : "events"}`;
}

function renderFeed() {
  if (!feedItems.length) {
    elements.decisionFeed.innerHTML = `
      <li class="feed-item">
        <span class="feed-marker"></span>
        <div>
          <div class="feed-topline"><span>Ready</span><span>0 events</span></div>
          <div class="feed-action">HOLD</div>
          <div class="feed-reason">Awaiting product events.</div>
        </div>
      </li>
    `;
    return;
  }

  elements.decisionFeed.innerHTML = feedItems.map((item) => `
    <li class="feed-item ${item.decision.className}">
      <span class="feed-marker"></span>
      <div>
        <div class="feed-topline">
          <span>${item.time}</span>
          <span>${item.event.type.toUpperCase()} ${item.event.quantity}</span>
        </div>
        <div class="feed-action">${item.productName}: ${item.decision.action} ${item.decision.reorderQty ? `+${item.decision.reorderQty}` : ""}</div>
        <div class="feed-reason">${item.decision.reason} · ${formatSupply(item.decision)} · ${formatStrategy(item.prediction.strategy)}</div>
      </div>
    </li>
  `).join("");
}

function renderChart(product) {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  const theme = getThemeColors();
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(260 * scale);
  context.scale(scale, scale);

  const width = rect.width;
  const height = 260;
  const padding = 34;
  const values = product.recentSales.length ? product.recentSales : [0];
  const maxValue = Math.max(...values, product.profile.safetyStock, 10);
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  context.clearRect(0, 0, width, height);
  context.fillStyle = theme.surface;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = theme.line;
  context.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = padding + i * ((height - padding * 2) / 3);
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  context.beginPath();
  values.forEach((value, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (value / maxValue) * (height - padding * 2);
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.strokeStyle = theme.ink;
  context.lineWidth = 3;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();

  values.forEach((value, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (value / maxValue) * (height - padding * 2);
    context.beginPath();
    context.arc(x, y, 4.5, 0, Math.PI * 2);
    context.fillStyle = theme.ink;
    context.fill();
  });

  const prediction = estimateDemand(product);
  const demandY = height - padding - (Math.min(prediction.demand, maxValue) / maxValue) * (height - padding * 2);
  context.setLineDash([7, 7]);
  context.strokeStyle = theme.muted;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(padding, demandY);
  context.lineTo(width - padding, demandY);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = theme.muted;
  context.font = "300 12px Helvetica Neue, Helvetica, Arial, sans-serif";
  context.fillText(`Demand ${formatNumber(prediction.demand)}`, padding, Math.max(18, demandY - 8));
  elements.chartLabel.textContent = product.displayName;
}

function profileTags(profile) {
  return [
    profile.fastMoving ? "fast" : null,
    profile.perishable ? "perishable" : null,
    profile.highDelay ? "delay" : null,
    profile.fragileSupply ? "fragile" : null,
  ].filter(Boolean);
}

function formatStrategy(strategy) {
  return strategy.replaceAll("_", " ");
}

function formatSupply(decision) {
  if (!decision.selectedWarehouseId) {
    return "none";
  }

  return `${decision.selectedWarehouseId} · ${decision.estimatedDeliveryTime}d · ${formatNumber(decision.warehouseDistance)}u`;
}

function getThemeColors() {
  const style = getComputedStyle(document.body);
  return {
    ink: style.getPropertyValue("--ink").trim(),
    muted: style.getPropertyValue("--muted").trim(),
    surface: style.getPropertyValue("--surface").trim(),
    line: style.getPropertyValue("--line").trim(),
  };
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

window.addEventListener("resize", () => renderChart(getProduct(elements.productInput.value)));

initTheme();
render();
