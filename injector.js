// ============================================
// 🌙 NOCTURNAL OMNI — ULTRA UI EDITION
// Stylish • Loud • Clean • Advanced
// ============================================

(function () {
  console.log("[Nocturnal Omni Ultra] Loaded");

  // ============================================
  // 🎧 AUDIO ENGINE
  // ============================================

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const eq = audioCtx.createBiquadFilter();
  const compressor = audioCtx.createDynamicsCompressor();
  const gainNode = audioCtx.createGain();
  const limiter = audioCtx.createDynamicsCompressor();

  eq.type = "peaking";
  eq.frequency.value = 3200;
  eq.Q.value = 1;
  eq.gain.value = 5;

  compressor.threshold.value = -24;
  compressor.knee.value = 20;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  limiter.threshold.value = -1;
  limiter.ratio.value = 20;

  eq.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(limiter);
  limiter.connect(audioCtx.destination);

  gainNode.gain.value = 1;

  function hookAudio() {
    document.querySelectorAll("audio").forEach(audio => {
      if (!audio._omniEnhanced) {
        try {
          const src = audioCtx.createMediaElementSource(audio);
          src.connect(eq);
          audio._omniEnhanced = true;
        } catch {}
      }
    });
  }

  setInterval(hookAudio, 1500);

  // ============================================
  // 🌌 STYLE
  // ============================================

  const style = document.createElement("style");
  style.textContent = `
  
  @keyframes omniGlow {
    0% { box-shadow: 0 0 15px #00c6ff; }
    50% { box-shadow: 0 0 30px #9d4dff; }
    100% { box-shadow: 0 0 15px #00c6ff; }
  }

  @keyframes gradientFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .omni-panel {
    position: fixed;
    top: 90px;
    right: 20px;
    width: 290px;
    z-index: 999999;

    padding: 16px;
    border-radius: 20px;

    background: linear-gradient(
      135deg,
      rgba(10,10,20,0.88),
      rgba(30,20,50,0.88),
      rgba(0,80,130,0.88)
    );

    background-size: 300% 300%;

    color: white;
    font-family: Inter, sans-serif;

    backdrop-filter: blur(18px);

    border: 1px solid rgba(255,255,255,0.1);

    animation:
      omniGlow 4s infinite ease-in-out,
      gradientFlow 8s infinite ease-in-out;
  }

  .omni-title {
    font-size: 19px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 14px;
    letter-spacing: 1px;
  }

  .omni-label {
    margin-top: 12px;
    margin-bottom: 4px;
    font-size: 13px;
    opacity: 0.9;
  }

  .omni-slider {
    width: 100%;
    accent-color: #00c6ff;
  }

  .omni-btn {
    width: 100%;
    margin-top: 10px;
    padding: 9px;

    border: none;
    border-radius: 12px;

    color: white;
    cursor: pointer;

    background: linear-gradient(45deg,#00c6ff,#7d2cff);

    transition: all 0.2s ease;
  }

  .omni-btn:hover {
    transform: scale(1.04);
    filter: brightness(1.15);
  }

  .omni-status {
    margin-top: 12px;
    font-size: 12px;
    opacity: 0.75;
    text-align: center;
  }

  `;
  document.head.appendChild(style);

  // ============================================
  // 🌙 PANEL
  // ============================================

  const panel = document.createElement("div");
  panel.className = "omni-panel";

  panel.innerHTML = `
    <div class="omni-title">🌙 Nocturnal Omni</div>
  `;

  document.body.appendChild(panel);

  // ============================================
  // 🔊 VOLUME
  // ============================================

  addLabel("🔊 Volume Boost");
  const vol = createSlider(1, 5, 0.1, 1);

  vol.oninput = () => {
    gainNode.gain.value = vol.value;
    status(`Volume Boost: ${vol.value}x`);
  };

  // ============================================
  // 🎧 CLARITY
  // ============================================

  let clarity = true;

  const clarityBtn = createButton("🎧 Clarity Boost ON");

  clarityBtn.onclick = () => {
    clarity = !clarity;

    eq.gain.value = clarity ? 5 : 0;

    clarityBtn.innerText =
      clarity
        ? "🎧 Clarity Boost ON"
        : "🎧 Clarity Boost OFF";

    status(
      clarity
        ? "Voice clarity enhanced"
        : "Voice clarity disabled"
    );
  };

  // ============================================
  // 🌙 DARK MODE
  // ============================================

  let dark = false;

  const darkBtn = createButton("🌙 Cinematic Mode");

  darkBtn.onclick = () => {
    dark = !dark;

    document.body.style.filter =
      dark
        ? "brightness(0.72) contrast(1.08)"
        : "";

    status(
      dark
        ? "Cinematic mode enabled"
        : "Cinematic mode disabled"
    );
  };

  // ============================================
  // 🔍 UI ZOOM
  // ============================================

  addLabel("🔍 UI Zoom");
  const zoom = createSlider(0.8, 1.5, 0.05, 1);

  zoom.oninput = () => {
    document.body.style.transform =
      `scale(${zoom.value})`;

    document.body.style.transformOrigin =
      "top right";

    status(`Zoom: ${zoom.value}x`);
  };

  // ============================================
  // 🎯 SIDEBAR
  // ============================================

  let hidden = false;

  const sideBtn = createButton("🎯 Toggle Sidebar");

  sideBtn.onclick = () => {
    hidden = !hidden;

    document
      .querySelectorAll('[class*="sidebar"]')
      .forEach(el => {
        el.style.display =
          hidden ? "none" : "";
      });

    status(
      hidden
        ? "Sidebar hidden"
        : "Sidebar restored"
    );
  };

  // ============================================
  // 🌈 RGB MODE
  // ============================================

  let rgb = false;

  const rgbBtn = createButton("🌈 RGB Mode");

  rgbBtn.onclick = () => {
    rgb = !rgb;

    panel.style.animation =
      rgb
        ? "omniGlow 1.5s infinite, gradientFlow 4s infinite"
        : "omniGlow 4s infinite, gradientFlow 8s infinite";

    status(
      rgb
        ? "RGB mode activated"
        : "RGB mode disabled"
    );
  };

  // ============================================
  // ⚡ FPS MODE
  // ============================================

  let fps = false;

  const fpsBtn = createButton("⚡ FPS Mode");

  fpsBtn.onclick = () => {
    fps = !fps;

    document.body.style.backdropFilter =
      fps ? "none" : "";

    status(
      fps
        ? "Performance mode enabled"
        : "Performance mode disabled"
    );
  };

  // ============================================
  // 📊 STATUS
  // ============================================

  const statusBox = document.createElement("div");
  statusBox.className = "omni-status";
  statusBox.innerText = "Nocturnal Omni Ready";
  panel.appendChild(statusBox);

  function status(text) {
    statusBox.innerText = text;
  }

  // ============================================
  // 🛠 HELPERS
  // ============================================

  function addLabel(text) {
    const label = document.createElement("div");
    label.className = "omni-label";
    label.innerText = text;
    panel.appendChild(label);
  }

  function createSlider(min, max, step, value) {
    const slider = document.createElement("input");

    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;

    slider.className = "omni-slider";

    panel.appendChild(slider);

    return slider;
  }

  function createButton(text) {
    const btn = document.createElement("button");

    btn.innerText = text;
    btn.className = "omni-btn";

    panel.appendChild(btn);

    return btn;
  }

  // ============================================
  // 🧲 DRAG PANEL
  // ============================================

  panel.onmousedown = e => {

    let shiftX =
      e.clientX - panel.getBoundingClientRect().left;

    let shiftY =
      e.clientY - panel.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
      panel.style.left = pageX - shiftX + "px";
      panel.style.top = pageY - shiftY + "px";
    }

    function onMouseMove(e) {
      moveAt(e.pageX, e.pageY);
    }

    document.addEventListener("mousemove", onMouseMove);

    document.onmouseup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.onmouseup = null;
    };
  };

})();
