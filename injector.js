// ==========================
// NOCTURNAL OMNI (STYLISH V2)
// ==========================

(function () {
  console.log("[Nocturnal Omni] Loaded");

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const gainNode = audioCtx.createGain();
  const compressor = audioCtx.createDynamicsCompressor();
  const limiter = audioCtx.createDynamicsCompressor();
  const eq = audioCtx.createBiquadFilter();

  eq.type = "peaking";
  eq.frequency.value = 3000;
  eq.gain.value = 5;

  compressor.threshold.value = -24;
  compressor.ratio.value = 4;

  limiter.threshold.value = -1;
  limiter.ratio.value = 20;

  eq.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(limiter);
  limiter.connect(audioCtx.destination);

  // ==========================
  // 🌌 PANEL STYLE
  // ==========================
  const panel = document.createElement("div");
  panel.innerHTML = `
    <div style="font-weight:bold; font-size:16px; text-align:center; margin-bottom:10px;">
      🌙 Nocturnal Omni
    </div>
  `;

  Object.assign(panel.style, {
    position: "fixed",
    top: "100px",
    right: "20px",
    zIndex: "9999",
    width: "250px",
    padding: "15px",
    borderRadius: "16px",
    background: "rgba(20,20,30,0.6)",
    backdropFilter: "blur(15px)",
    color: "#fff",
    fontFamily: "sans-serif",
    boxShadow: "0 0 20px rgba(0,150,255,0.4)"
  });

  document.body.appendChild(panel);

  // ==========================
  // 🔊 VOLUME
  // ==========================
  const vol = document.createElement("input");
  vol.type = "range";
  vol.min = "1";
  vol.max = "5";
  vol.step = "0.1";
  vol.value = "1";

  styleInput(vol);
  addLabel("🔊 Volume Boost", panel);
  panel.appendChild(vol);

  vol.oninput = () => gainNode.gain.value = vol.value;

  // ==========================
  // 🎧 CLARITY
  // ==========================
  const clarityBtn = makeButton("🎧 Clarity Boost");
  let clarity = true;

  clarityBtn.onclick = () => {
    clarity = !clarity;
    eq.gain.value = clarity ? 5 : 0;
  };

  panel.appendChild(clarityBtn);

  // ==========================
  // 🌙 DARK MODE
  // ==========================
  const darkBtn = makeButton("🌙 Dark Mode");
  let dark = false;

  darkBtn.onclick = () => {
    dark = !dark;
    document.body.style.filter = dark ? "brightness(0.7)" : "";
  };

  panel.appendChild(darkBtn);

  // ==========================
  // 🔍 ZOOM
  // ==========================
  const zoom = document.createElement("input");
  zoom.type = "range";
  zoom.min = "0.8";
  zoom.max = "1.5";
  zoom.step = "0.05";
  zoom.value = "1";

  styleInput(zoom);
  addLabel("🔍 Zoom", panel);
  panel.appendChild(zoom);

  zoom.oninput = () => {
    document.body.style.transform = `scale(${zoom.value})`;
    document.body.style.transformOrigin = "top right";
  };

  // ==========================
  // 🎯 SIDEBAR
  // ==========================
  const sidebarBtn = makeButton("🎯 Toggle Sidebar");
  let hidden = false;

  sidebarBtn.onclick = () => {
    hidden = !hidden;
    document.querySelectorAll('[class*="sidebar"]').forEach(el => {
      el.style.display = hidden ? "none" : "";
    });
  };

  panel.appendChild(sidebarBtn);

  // ==========================
  // 🔊 HOOK AUDIO
  // ==========================
  function hookAudio() {
    document.querySelectorAll("audio").forEach(audio => {
      if (!audio._omni) {
        try {
          const src = audioCtx.createMediaElementSource(audio);
          src.connect(eq);
          audio._omni = true;
        } catch {}
      }
    });
  }

  setInterval(hookAudio, 2000);

  // ==========================
  // 🎨 HELPERS
  // ==========================
  function makeButton(text) {
    const btn = document.createElement("button");
    btn.innerText = text;

    Object.assign(btn.style, {
      width: "100%",
      marginTop: "8px",
      padding: "6px",
      borderRadius: "10px",
      border: "none",
      background: "linear-gradient(45deg, #00c6ff, #0072ff)",
      color: "#fff",
      cursor: "pointer",
      transition: "0.2s"
    });

    btn.onmouseenter = () => btn.style.transform = "scale(1.05)";
    btn.onmouseleave = () => btn.style.transform = "scale(1)";

    return btn;
  }

  function addLabel(text, parent) {
    const label = document.createElement("div");
    label.innerText = text;
    label.style.marginTop = "10px";
    parent.appendChild(label);
  }

  function styleInput(input) {
    Object.assign(input.style, {
      width: "100%",
      accentColor: "#00c6ff"
    });
  }

  // ==========================
  // 🧲 DRAG
  // ==========================
  panel.onmousedown = e => {
    let x = e.clientX - panel.offsetLeft;
    let y = e.clientY - panel.offsetTop;

    function move(e) {
      panel.style.left = e.pageX - x + "px";
      panel.style.top = e.pageY - y + "px";
    }

    document.addEventListener("mousemove", move);

    document.onmouseup = () => {
      document.removeEventListener("mousemove", move);
      document.onmouseup = null;
    };
  };

})();
