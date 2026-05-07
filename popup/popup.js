const EXT = globalThis.browser ?? globalThis.chrome;

const DEFAULTS = {
  enabled: true,
  gainDb: 18,
  loudness: 2.5,
  maxBoost: 50,
  drive: 0.18,
  thresholdDb: -30,
  ratio: 10,
  limiterDb: -3,
  presenceDb: 5,
  lowShelfDb: 2,
  highShelfDb: 4
};

const PRESETS = {
  stable: { enabled: true, gainDb: 12, loudness: 1.8, maxBoost: 50, drive: 0.08, thresholdDb: -30, ratio: 7, limiterDb: -4, presenceDb: 4, lowShelfDb: 1, highShelfDb: 3 },
  extreme: { enabled: true, gainDb: 24, loudness: 50, maxBoost: 50, drive: 0.12, thresholdDb: -34, ratio: 12, limiterDb: -6, presenceDb: 6, lowShelfDb: 2, highShelfDb: 5 }
};

const ids = Object.keys(DEFAULTS);

function presetMatches(config, preset) {
  return Object.entries(preset).every(([key, value]) => config[key] === value);
}

function activePreset(config) {
  if (presetMatches(config, PRESETS.stable)) return "stable";
  if (presetMatches(config, PRESETS.extreme)) return "extreme";
  return "custom";
}

function updatePresetState(config) {
  const active = activePreset(config);
  const stableButton = document.getElementById("stablePreset");
  const extremeButton = document.getElementById("extremePreset");
  document.body.dataset.theme = active;
  stableButton?.classList.toggle("active", active === "stable");
  stableButton?.setAttribute("aria-pressed", String(active === "stable"));
  extremeButton?.classList.toggle("active", active === "extreme");
  extremeButton?.setAttribute("aria-pressed", String(active === "extreme"));
}

function updateLabels() {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    const label = document.getElementById(`${id}Val`);
    if (label && el.type !== "checkbox") label.textContent = el.value;
  });
}

function applyToControls(config) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(config[id]);
    else el.value = config[id];
  });
  updateLabels();
  updatePresetState(config);
}

async function saveConfig(config) {
  await EXT.storage.local.set({ micMaximizerConfig: { ...DEFAULTS, ...config } });
  applyToControls({ ...DEFAULTS, ...config });
}

async function init() {
  const stored = await EXT.storage.local.get("micMaximizerConfig");
  const config = { ...DEFAULTS, ...(stored.micMaximizerConfig || {}) };

  applyToControls(config);

  ids.forEach((id) => {
    const el = document.getElementById(id);

    el.addEventListener("input", async () => {
      const next = await EXT.storage.local.get("micMaximizerConfig");
      const merged = { ...DEFAULTS, ...(next.micMaximizerConfig || {}) };
      merged[id] = el.type === "checkbox" ? el.checked : Number(el.value);
      await EXT.storage.local.set({ micMaximizerConfig: merged });
      updateLabels();
      updatePresetState(merged);
    });
  });

  document.getElementById("stablePreset")?.addEventListener("click", () => saveConfig(PRESETS.stable));
  document.getElementById("extremePreset")?.addEventListener("click", () => saveConfig(PRESETS.extreme));
  updateLabels();
}

init();


async function refreshHookStatus() {
  const el = document.getElementById("hookStatus");
  if (!el) return;
  try {
    const status = await EXT.runtime.sendMessage({ type: "MICMAX_STATUS_REQUEST" });
    const ageMs = status?.lastHeartbeat ? (Date.now() - status.lastHeartbeat) : Infinity;
    if (status?.ok && ageMs < 12000) {
      el.textContent = "Hook status: ACTIVE";
      el.className = "status ok";
    } else {
      el.textContent = "Hook status: NOT DETECTED (open/reload Discord tab)";
      el.className = "status warn";
    }
  } catch {
    el.textContent = "Hook status: unavailable";
    el.className = "status warn";
  }
}

setInterval(refreshHookStatus, 3000);
refreshHookStatus();
