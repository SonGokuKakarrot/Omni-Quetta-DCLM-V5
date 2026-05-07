const EXT = globalThis.browser ?? globalThis.chrome;

(() => {
  const DEFAULTS = {
    enabled: true,
    gainDb: 18,
    thresholdDb: -30,
    knee: 26,
    ratio: 10,
    attack: 0.002,
    release: 0.16,
    lowShelfDb: 2,
    presenceDb: 5,
    highShelfDb: 4,
    limiterDb: -3,
    drive: 0.18,
    loudness: 2.5,
    maxBoost: 50
  };

  const MSG_CFG = "MIC_MAXIMIZER_CONFIG";
  let hookReady = false;

  function heartbeat() {
    if (hookReady) EXT.runtime.sendMessage({ type: "MICMAX_HEARTBEAT" }).catch(() => {});
  }

  async function loadConfig() {
    try {
      const res = await EXT.storage.local.get("micMaximizerConfig");
      return { ...DEFAULTS, ...(res.micMaximizerConfig || {}) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function pushConfig(cfg) {
    window.postMessage({ type: MSG_CFG, payload: cfg }, "*");
  }

  async function sync() { pushConfig(await loadConfig()); }

  window.addEventListener("message", (e) => {
    if (e.source === window && e.data?.type === "MIC_MAXIMIZER_READY") {
      hookReady = true;
      sync();
      heartbeat();
    }
  });

  EXT.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.micMaximizerConfig) {
      pushConfig({ ...DEFAULTS, ...(changes.micMaximizerConfig.newValue || {}) });
    }
  });

  setInterval(sync, 4000);
  sync();
})();


setInterval(() => {
  heartbeat();
}, 5000);
