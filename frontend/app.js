const products = {
  milk: {
    id: "milk",
    name: "Milk",
    type: "Perishable",
    expiryDays: 3,
    leadTime: 1,
    safetyStock: 5,
    capacity: 60,
    color: "#111111",
    stock: 35,
    recentSales: [10, 12, 9],
  },
  rice: {
    id: "rice",
    name: "Rice",
    type: "Durable",
    expiryDays: 365,
    leadTime: 3,
    safetyStock: 12,
    capacity: 120,
    color: "#555555",
    stock: 80,
    recentSales: [7, 8, 10],
  },
  bread: {
    id: "bread",
    name: "Bread",
    type: "Perishable",
    expiryDays: 2,
    leadTime: 1,
    safetyStock: 8,
    capacity: 70,
    color: "#8c8c8c",
    stock: 42,
    recentSales: [15, 14, 16],
  },
  detergent: {
    id: "detergent",
    name: "Detergent",
    type: "Durable",
    expiryDays: 730,
    leadTime: 5,
    safetyStock: 10,
    capacity: 90,
    color: "#d8d8d8",
    stock: 58,
    recentSales: [3, 5, 4],
  },
};

const initialProducts = JSON.parse(JSON.stringify(products));
const maxHistory = 8;
let selectedEventType = "sale";
let eventCount = 0;
let streamTimer = null;
let feedItems = [];

const elements = {
  productSelect: document.querySelector("#product-select"),
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
  lastEventTime: document.querySelector("#last-event-time"),
  eventCount: document.querySelector("#event-count"),
  metricProducts: document.querySelector("#metric-products"),
  metricStock: document.querySelector("#metric-stock"),
  metricDemand: document.querySelector("#metric-demand"),
  metricRestocks: document.querySelector("#metric-restocks"),
};

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

elements.productSelect.addEventListener("change", render);
elements.quantityInput.addEventListener("input", clampQuantity);
elements.injectEvent.addEventListener("click", () => {
  ingestEvent({
    type: selectedEventType,
    productId: elements.productSelect.value,
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
    renderChart(products[elements.productSelect.value]);
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

  Object.keys(products).forEach((key) => {
    products[key] = JSON.parse(JSON.stringify(initialProducts[key]));
  });
  eventCount = 0;
  feedItems = [];
  elements.lastEventTime.textContent = "No events";
  render();
}

function createRandomEvent() {
  const keys = Object.keys(products);
  const productId = keys[Math.floor(Math.random() * keys.length)];
  const product = products[productId];
  const type = Math.random() > 0.22 ? "sale" : "stock";
  const quantity = type === "sale"
    ? Math.max(1, Math.round(product.safetyStock + Math.random() * 16))
    : Math.max(product.stock + 12, Math.round(product.capacity * (0.55 + Math.random() * 0.35)));

  return { type, productId, quantity };
}

function ingestEvent(event) {
  const product = products[event.productId];
  const quantity = Math.max(0, Math.round(event.quantity || 0));

  if (!product) {
    return;
  }

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

  const demand = estimateDemand(product);
  const decision = decide(product, demand);
  feedItems.unshift({
    event,
    productName: product.name,
    demand,
    decision,
    time: elements.lastEventTime.textContent,
  });
  feedItems = feedItems.slice(0, 18);

  render();
}

function estimateDemand(product) {
  if (!product.recentSales.length) {
    return 0;
  }

  const total = product.recentSales.reduce((sum, value) => sum + value, 0);
  return (total / product.recentSales.length) * product.leadTime;
}

function decide(product, demand) {
  const projectedNeed = Math.ceil(demand) + product.safetyStock;

  if (product.stock >= projectedNeed) {
    return {
      action: "HOLD",
      reorderQty: 0,
      reason: "Stock covers lead-time demand plus safety stock.",
      className: "hold",
    };
  }

  const action = product.type === "Perishable" ? "RESTOCK_FAST" : "RESTOCK";
  return {
    action,
    reorderQty: Math.max(0, projectedNeed - product.stock),
    reason: product.type === "Perishable"
      ? "Perishable product is below the lead-time threshold."
      : "Stock is below predicted demand plus safety stock.",
    className: product.type === "Perishable" ? "fast" : "restock",
  };
}

function render() {
  const rows = Object.values(products).map((product) => {
    const demand = estimateDemand(product);
    const decision = decide(product, demand);
    const stockPercent = Math.min(100, Math.round((product.stock / product.capacity) * 100));

    return `
      <tr>
        <td>
          <div class="product-cell">
            <span class="swatch" style="background:${product.color}"></span>
            <div>
              <div>${product.name}</div>
              <div class="subtle">${product.id}</div>
            </div>
          </div>
        </td>
        <td>
          <div>${product.type}</div>
          <div class="subtle">${product.leadTime}d lead</div>
        </td>
        <td>
          <div>${product.stock}</div>
          <div class="stock-bar" aria-hidden="true"><span style="width:${stockPercent}%"></span></div>
        </td>
        <td>${formatNumber(demand)}</td>
        <td><span class="badge ${decision.className}">${decision.action}</span></td>
        <td>${decision.reorderQty}</td>
      </tr>
    `;
  }).join("");

  elements.inventoryBody.innerHTML = rows;
  renderMetrics();
  renderFeed();
  renderChart(products[elements.productSelect.value]);
}

function renderMetrics() {
  const values = Object.values(products);
  const totalStock = values.reduce((sum, product) => sum + product.stock, 0);
  const totalDemand = values.reduce((sum, product) => sum + estimateDemand(product), 0);
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
          <div class="feed-reason">Awaiting event stream.</div>
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
        <div class="feed-reason">${item.decision.reason}</div>
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
  const maxValue = Math.max(...values, product.safetyStock, 10);
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

  const demand = estimateDemand(product);
  const demandY = height - padding - (Math.min(demand, maxValue) / maxValue) * (height - padding * 2);
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
  context.fillText(`Demand ${formatNumber(demand)}`, padding, Math.max(18, demandY - 8));
  elements.chartLabel.textContent = product.name;
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

window.addEventListener("resize", () => renderChart(products[elements.productSelect.value]));

initTheme();
render();
