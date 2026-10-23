/**
 * Campus Energy Sentinel - Modern Interactive Measuring Engine
 * Developed for BCA Semester 1 Academic Project
 */

// Global Presets
const LAB_PRESETS = {
  standard: {
    name: "Computer Science Lab 1 (BCA)",
    pcCount: 50,
    pcType: "120",
    activeHours: 4.5,
    idleHours: 3.5,
    tariff: 9.0,
    workingDays: 26,
    emissionFactor: 0.82
  },
  ai: {
    name: "AI & Graphics Development Lab",
    pcCount: 30,
    pcType: "200",
    activeHours: 5.0,
    idleHours: 3.0,
    tariff: 9.0,
    workingDays: 24,
    emissionFactor: 0.82
  },
  library: {
    name: "Digital Central Library",
    pcCount: 40,
    pcType: "85",
    activeHours: 8.0,
    idleHours: 2.0,
    tariff: 9.0,
    workingDays: 28,
    emissionFactor: 0.82
  },
  server: {
    name: "Department Rack & Server Cluster",
    pcCount: 10,
    pcType: "350",
    activeHours: 24.0,
    idleHours: 0.0,
    tariff: 9.0,
    workingDays: 30,
    emissionFactor: 0.82
  }
};

let simulationActive = false;

// 1. Tab Switching Function
function switchTab(targetTab, event = window.event) {
  const buttons = document.querySelectorAll(".nav-tabs .tab-btn");
  buttons.forEach(btn => btn.classList.remove("active"));

  if (event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }

  const views = document.querySelectorAll(".tab-view");
  views.forEach(v => v.classList.remove("active"));

  const activeView = document.getElementById(`view-${targetTab}`);
  if (activeView) {
    activeView.classList.add("active");
  }
}

// 2. Sync Range Slider with Value Badge
function syncRange(sliderId, displayId, unit) {
  const val = document.getElementById(sliderId).value;
  document.getElementById(displayId).innerText = val + unit;
  calculateMeasuring();
}

// 3. Apply Quick Lab Presets
function applyPreset(presetKey, event = window.event) {
  const chips = document.querySelectorAll(".preset-chip");
  chips.forEach(c => c.classList.remove("active"));

  if (event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }

  const p = LAB_PRESETS[presetKey];
  if (!p) return;

  document.getElementById("labName").value = p.name;
  document.getElementById("pcType").value = p.pcType;

  document.getElementById("pcCount").value = p.pcCount;
  document.getElementById("pcCountVal").innerText = p.pcCount + " PCs";

  document.getElementById("activeHours").value = p.activeHours;
  document.getElementById("activeHoursVal").innerText = p.activeHours + " hrs/day";

  document.getElementById("idleHours").value = p.idleHours;
  document.getElementById("idleHoursVal").innerText = p.idleHours + " hrs/day";

  document.getElementById("tariff").value = p.tariff;
  document.getElementById("workingDays").value = p.workingDays;
  document.getElementById("emissionFactor").value = p.emissionFactor;

  const simToggle = document.getElementById("simToggle");
  if (simToggle) simToggle.checked = false;
  simulationActive = false;

  calculateMeasuring();
}

// 4. Toggle Automated Power-Cycling Simulation
function toggleSimulation() {
  const toggle = document.getElementById("simToggle");
  simulationActive = toggle.checked;
  calculateMeasuring();
}

// 5. Core Measuring Calculation Engine
function calculateMeasuring() {
  const labName = document.getElementById("labName").value.trim() || "Main Academic Lab";
  const pcCount = Math.max(1, parseInt(document.getElementById("pcCount").value) || 50);
  const unitWattage = Math.max(10, parseFloat(document.getElementById("pcType").value) || 120);
  const activeHours = Math.max(0, parseFloat(document.getElementById("activeHours").value) || 0);
  let idleHours = Math.max(0, parseFloat(document.getElementById("idleHours").value) || 0);
  const tariff = Math.max(1.0, parseFloat(document.getElementById("tariff").value) || 9.0);
  const workingDays = Math.max(1, parseInt(document.getElementById("workingDays").value) || 26);
  const emissionFactor = Math.max(0.1, parseFloat(document.getElementById("emissionFactor").value) || 0.82);

  const originalIdleHours = idleHours;
  if (simulationActive) {
    idleHours = 0.2; // Automated standby drops waste to ~10 mins
  }

  // ACPI G0/S0 Desktop Idle Baseline = 45% of peak draw
  const idleWattageRatio = 0.45;
  const idleUnitWattage = unitWattage * idleWattageRatio;

  // 1. Peak Load (kW)
  const peakLoadKw = (pcCount * unitWattage) / 1000;

  // 2. Daily Energy Breakdown (kWh)
  const dailyActiveKwh = (pcCount * unitWattage * activeHours) / 1000;
  const dailyIdleKwh = (pcCount * idleUnitWattage * idleHours) / 1000;
  const dailyTotalKwh = dailyActiveKwh + dailyIdleKwh;

  const baselineDailyWasteKwh = (pcCount * idleUnitWattage * originalIdleHours) / 1000;
  const potentialMonthlyWasteKwh = baselineDailyWasteKwh * workingDays;
  const potentialMonthlyWasteCost = potentialMonthlyWasteKwh * tariff;
  const potentialMonthlyWasteCarbon = potentialMonthlyWasteKwh * emissionFactor;

  // 3. Monthly Metrics
  const monthlyTotalKwh = dailyTotalKwh * workingDays;
  const monthlyWastedKwh = dailyIdleKwh * workingDays;
  const monthlyWastedCost = monthlyWastedKwh * tariff;
  const monthlyCarbonKg = monthlyTotalKwh * emissionFactor;

  const treesNeeded = Math.ceil(monthlyCarbonKg / 1.83);

  // 4. Efficiency Score Computation
  let efficiencyScore = 100;
  if (dailyTotalKwh > 0) {
    efficiencyScore = Math.round((dailyActiveKwh / dailyTotalKwh) * 100);
  }
  efficiencyScore = Math.max(10, Math.min(100, efficiencyScore));

  // 5. Update DOM Elements
  document.getElementById("targetLabHeader").innerText = labName;
  document.getElementById("outPeakLoad").innerText = peakLoadKw.toFixed(1) + " kW";
  document.getElementById("outTotalKwh").innerText = Math.round(monthlyTotalKwh).toLocaleString("en-IN") + " kWh";

  const wasteCostEl = document.getElementById("outWasteCost");
  const wasteKwhEl = document.getElementById("outWasteKwh");

  if (simulationActive) {
    wasteCostEl.innerText = "₹ " + Math.round(monthlyWastedCost).toLocaleString("en-IN");
    wasteCostEl.classList.remove("text-red");
    wasteCostEl.classList.add("text-green");
    wasteKwhEl.innerText = `Reduced from ₹${Math.round(potentialMonthlyWasteCost).toLocaleString("en-IN")} via S3 sleep`;
  } else {
    wasteCostEl.innerText = "₹ " + Math.round(monthlyWastedCost).toLocaleString("en-IN");
    wasteCostEl.classList.remove("text-green");
    wasteCostEl.classList.add("text-red");
    wasteKwhEl.innerText = `${Math.round(monthlyWastedKwh).toLocaleString("en-IN")} kWh unutilized waste`;
  }

  document.getElementById("outCarbon").innerText = Math.round(monthlyCarbonKg).toLocaleString("en-IN") + " kg CO₂";
  document.getElementById("outTreesEquivalent").innerText = `Requires ~${treesNeeded} trees to offset`;

  // 6. Update Radial Gauge SVG
  const gaugeCircle = document.getElementById("gaugeCircle");
  const gaugePct = document.getElementById("gaugePct");
  const healthStatusTag = document.getElementById("healthStatusTag");
  const healthDesc = document.getElementById("healthDesc");

  gaugeCircle.setAttribute("stroke-dasharray", `${efficiencyScore}, 100`);
  gaugePct.innerText = efficiencyScore + "%";

  if (efficiencyScore >= 85) {
    gaugeCircle.style.stroke = "#10b981";
    healthStatusTag.innerText = "High Energy Efficiency";
    healthStatusTag.style.color = "#10b981";
    healthStatusTag.style.borderColor = "rgba(16, 185, 129, 0.4)";
    healthStatusTag.style.backgroundColor = "rgba(16, 185, 129, 0.12)";
    healthDesc.innerText = "Minimal idle leakage. Workstations actively utilized or powered down.";
  } else if (efficiencyScore >= 60) {
    gaugeCircle.style.stroke = "#f59e0b";
    healthStatusTag.innerText = "Moderate Waste Detected";
    healthStatusTag.style.color = "#f59e0b";
    healthStatusTag.style.borderColor = "rgba(245, 158, 11, 0.4)";
    healthStatusTag.style.backgroundColor = "rgba(245, 158, 11, 0.12)";
    healthDesc.innerText = `Terminals draw 54W baseline during ${originalIdleHours} idle hours. Automated S3 sleep recommended.`;
  } else {
    gaugeCircle.style.stroke = "#f43f5e";
    healthStatusTag.innerText = "Critical Idle Drain";
    healthStatusTag.style.color = "#f43f5e";
    healthStatusTag.style.borderColor = "rgba(244, 63, 94, 0.4)";
    healthStatusTag.style.backgroundColor = "rgba(244, 63, 94, 0.12)";
    healthDesc.innerText = "Severe unmonitored power dissipation. Systems left active with zero compute.";
  }

  // 7. Update Simulation Callout
  const simText = document.getElementById("simText");
  if (simulationActive) {
    simText.innerHTML = `<strong>Simulation Active:</strong> Recovering <strong>₹${Math.round(potentialMonthlyWasteCost).toLocaleString("en-IN")}/month</strong> (₹${Math.round(potentialMonthlyWasteCost * 12).toLocaleString("en-IN")}/yr) and cutting <strong>${Math.round(potentialMonthlyWasteCarbon).toLocaleString("en-IN")} kg of CO₂</strong> monthly!`;
  } else {
    simText.innerHTML = `Toggling automated S3 sleep would recover <strong>₹${Math.round(potentialMonthlyWasteCost).toLocaleString("en-IN")}/month</strong> and prevent <strong>${Math.round(potentialMonthlyWasteCarbon).toLocaleString("en-IN")} kg of CO₂</strong>.`;
  }
}

// Initial Boot
window.addEventListener("DOMContentLoaded", () => {
  calculateMeasuring();
});