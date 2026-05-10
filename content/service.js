(() => {
  const EXT = globalThis.browser ?? globalThis.chrome;
  if (!EXT?.runtime || !EXT?.storage?.local) return;

  const HAS_PROMISE_API = typeof globalThis.browser !== "undefined" && EXT === globalThis.browser;

  const DEFAULTS = {
    enabled: true,
    gainDb: 60,
    thresholdDb: -50,
    knee: 40,
    ratio: 20,
    attack: 0.0001,
    release: 0.05,
    lowShelfDb: 12,
    presenceDb: 15,
    highShelfDb: 10,
    limiterDb: -0.1,
    drive: 1.0,
    loudness: 10.0,
    maxBoost: 2000
  };

  const MSG_CFG = "MIC_MAXIMIZER_CONFIG";
  let hookReady = false;

  function storageGet(key) {
    if (HAS_PROMISE_API) return EXT.storage.local.get(key);
    return new Promise((resolve) => {
      try {
        EXT.storage.local.get(key, (res) => {
          if (EXT.runtime?.lastError) resolve({});
          else resolve(res || {});
        });
      } catch (_) {
        resolve({});
      }
    });
  }

  function sendMessage(message) {
    if (HAS_PROMISE_API) return EXT.runtime.sendMessage(message);
    return new Promise((resolve) => {
      try {
        EXT.runtime.sendMessage(message, () => resolve(!EXT.runtime?.lastError));
      } catch (_) {
        resolve(false);
      }
    });
  }

  function pushConfig(config) {
    window.postMessage({ type: MSG_CFG, payload: config }, "*");
  }

  async function loadConfig() {
    try {
      const res = await storageGet("micMaximizerConfig");
      return { ...DEFAULTS, ...(res.micMaximizerConfig || {}) };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  async function sync() {
    pushConfig(await loadConfig());
  }

  function heartbeat() {
    if (!hookReady) return;
    sendMessage({ type: "MICMAX_HEARTBEAT" }).catch(() => {});
  }

  window.addEventListener("message", (event) => {
    if (event.source === window && event.data?.type === "MIC_MAXIMIZER_READY") {
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

  setInterval(sync, 3500);
  setInterval(heartbeat, 5000);
  sync();
})();
