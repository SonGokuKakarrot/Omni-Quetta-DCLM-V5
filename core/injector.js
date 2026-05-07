(() => {
  if (window.__micMaxInjectorReady) return;
  window.__micMaxInjectorReady = true;

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
  const state = {
    config: { ...DEFAULTS },
    origMD: null,
    origLegacy: null,
    pipelines: new Set(),
    trackMap: new WeakMap(),
    processedTracks: new WeakSet()
  };

  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(v)) ? Number(v) : min));
  const dbToLinear = (db) => Math.pow(10, db / 20);

  function cfg(input = state.config) {
    const merged = { ...DEFAULTS, ...(input || {}) };
    merged.maxBoost = clamp(merged.maxBoost, 1, 50);
    merged.loudness = clamp(merged.loudness, 0.5, merged.maxBoost);
    merged.gainDb = clamp(merged.gainDb, 0, 48);
    merged.drive = clamp(merged.drive, 0, 0.9);
    merged.thresholdDb = clamp(merged.thresholdDb, -55, -6);
    merged.ratio = clamp(merged.ratio, 1, 20);
    merged.lowShelfDb = clamp(merged.lowShelfDb, -12, 8);
    merged.presenceDb = clamp(merged.presenceDb, -6, 10);
    merged.highShelfDb = clamp(merged.highShelfDb, -6, 10);
    merged.limiterDb = clamp(merged.limiterDb, -12, -0.5);
    return merged;
  }

  function makeSaturationCurve(amount = 0.18) {
    const k = Math.max(1, amount * 80);
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = i * 2 / n - 1;
      curve[i] = Math.tanh(k * x) / Math.tanh(k);
    }
    return curve;
  }

  function setParam(param, value, ctx) {
    if (!param) return;
    const now = ctx?.currentTime || 0;
    if (typeof param.setTargetAtTime === "function") param.setTargetAtTime(value, now, 0.015);
    else param.value = value;
  }

  function applyPipeline(pipeline, inputConfig = state.config) {
    const raw = cfg(inputConfig);
    const c = raw.enabled ? raw : {
      ...raw,
      lowShelfDb: 0,
      presenceDb: 0,
      highShelfDb: 0,
      thresholdDb: -6,
      knee: 0,
      ratio: 1,
      loudness: 1,
      gainDb: 0,
      drive: 0,
      limiterDb: -0.5
    };
    const { ctx, nodes } = pipeline;
    setParam(nodes.low.gain, c.lowShelfDb, ctx);
    setParam(nodes.pres.gain, c.presenceDb, ctx);
    setParam(nodes.high.gain, c.highShelfDb, ctx);
    setParam(nodes.comp1.threshold, c.thresholdDb, ctx);
    setParam(nodes.comp1.knee, c.knee, ctx);
    setParam(nodes.comp1.ratio, c.ratio, ctx);
    setParam(nodes.comp1.attack, c.attack, ctx);
    setParam(nodes.comp1.release, c.release, ctx);
    setParam(nodes.loudness.gain, c.loudness, ctx);
    setParam(nodes.gain.gain, dbToLinear(c.gainDb), ctx);
    nodes.saturator.curve = makeSaturationCurve(c.drive);
    setParam(nodes.limiter.threshold, c.limiterDb, ctx);
  }

  function updateAllPipelines(inputConfig = state.config) {
    for (const pipeline of state.pipelines) applyPipeline(pipeline, inputConfig);
  }

  function createAudioContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { return new AC({ latencyHint: "interactive", sampleRate: 48000 }); }
    catch (_) { return new AC({ latencyHint: "interactive" }); }
  }

  function build(stream, inputConfig) {
    const ctx = createAudioContext();
    if (!ctx || !stream.getAudioTracks().length) return stream;

    const source = ctx.createMediaStreamSource(stream);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 85; hp.Q.value = 0.8;
    const low = ctx.createBiquadFilter(); low.type = "lowshelf"; low.frequency.value = 150;
    const pres = ctx.createBiquadFilter(); pres.type = "peaking"; pres.frequency.value = 2900; pres.Q.value = 1.2;
    const high = ctx.createBiquadFilter(); high.type = "highshelf"; high.frequency.value = 4500;

    const comp1 = ctx.createDynamicsCompressor();
    const comp2 = ctx.createDynamicsCompressor();
    comp2.threshold.value = -16; comp2.knee.value = 8; comp2.ratio.value = 5; comp2.attack.value = 0.002; comp2.release.value = 0.08;

    const loudness = ctx.createGain();
    const gain = ctx.createGain();
    const saturator = ctx.createWaveShaper(); saturator.oversample = "4x";
    const limiter = ctx.createDynamicsCompressor();
    limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.04;

    const dst = ctx.createMediaStreamDestination();
    source.connect(hp); hp.connect(low); low.connect(pres); pres.connect(high);
    high.connect(comp1); comp1.connect(comp2); comp2.connect(loudness); loudness.connect(gain);
    gain.connect(saturator); saturator.connect(limiter); limiter.connect(dst);

    const pipeline = { ctx, nodes: { low, pres, high, comp1, loudness, gain, saturator, limiter } };
    applyPipeline(pipeline, inputConfig);
    state.pipelines.add(pipeline);

    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const outAudioTracks = dst.stream.getAudioTracks();
    outAudioTracks.forEach((track) => state.processedTracks.add(track));

    const out = new MediaStream([
      ...outAudioTracks,
      ...stream.getTracks().filter((track) => track.kind !== "audio")
    ]);

    const stop = () => {
      state.pipelines.delete(pipeline);
      try { ctx.close(); } catch (_) {}
    };
    stream.getTracks().forEach((t) => t.addEventListener("ended", stop, { once: true }));
    out.getTracks().forEach((t) => t.addEventListener("ended", stop, { once: true }));
    return out;
  }

  function normalizeConstraints(constraints) {
    if (constraints === true) constraints = { audio: true };
    if (!constraints || typeof constraints !== "object") return constraints;
    const next = { ...constraints };
    if (next.audio === true) next.audio = {};
    if (typeof next.audio === "object") {
      next.audio = {
        ...next.audio,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: { ideal: 48000 },
        sampleSize: { ideal: 16 }
      };
    }
    return next;
  }

  function wantsAudio(constraints) {
    if (constraints === true) return true;
    if (!constraints || typeof constraints !== "object") return false;
    return "audio" in constraints ? Boolean(constraints.audio) : true;
  }



  function processedStreamFor(originalStream, rawTrack, processedTrack) {
    if (!originalStream || typeof originalStream.getTracks !== "function") return new MediaStream([processedTrack]);
    return new MediaStream(originalStream.getTracks().map((track) => track === rawTrack ? processedTrack : track));
  }

  function processAudioTrack(track) {
    if (!track || track.kind !== "audio" || state.processedTracks.has(track)) return track;
    const existing = state.trackMap.get(track);
    if (existing && existing.readyState !== "ended") return existing;

    const processedStream = build(new MediaStream([track]), state.config);
    const processedTrack = processedStream.getAudioTracks()[0] || track;
    if (processedTrack !== track) {
      state.processedTracks.add(processedTrack);
      state.trackMap.set(track, processedTrack);
      track.addEventListener("ended", () => {
        try { processedTrack.stop(); } catch (_) {}
      }, { once: true });
    }
    return processedTrack;
  }

  function patchPeerConnectionPaths() {
    const PC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    if (PC?.prototype && !PC.prototype.__micMaxPcPatched) {
      const originalAddTrack = PC.prototype.addTrack;
      if (typeof originalAddTrack === "function") {
        PC.prototype.addTrack = function(track, ...streams) {
          if (cfg().enabled && track?.kind === "audio") {
            const processedTrack = processAudioTrack(track);
            const patchedStreams = streams.length
              ? streams.map((stream) => processedStreamFor(stream, track, processedTrack))
              : [new MediaStream([processedTrack])];
            return originalAddTrack.call(this, processedTrack, ...patchedStreams);
          }
          return originalAddTrack.call(this, track, ...streams);
        };
      }

      const originalAddTransceiver = PC.prototype.addTransceiver;
      if (typeof originalAddTransceiver === "function") {
        PC.prototype.addTransceiver = function(trackOrKind, init = undefined) {
          if (cfg().enabled && trackOrKind?.kind === "audio") {
            const processedTrack = processAudioTrack(trackOrKind);
            const patchedInit = init?.streams
              ? { ...init, streams: init.streams.map((stream) => processedStreamFor(stream, trackOrKind, processedTrack)) }
              : init;
            return originalAddTransceiver.call(this, processedTrack, patchedInit);
          }
          return originalAddTransceiver.call(this, trackOrKind, init);
        };
      }

      PC.prototype.__micMaxPcPatched = true;
    }

    const Sender = window.RTCRtpSender;
    if (Sender?.prototype && !Sender.prototype.__micMaxSenderPatched) {
      const originalReplaceTrack = Sender.prototype.replaceTrack;
      if (typeof originalReplaceTrack === "function") {
        Sender.prototype.replaceTrack = function(track) {
          const nextTrack = cfg().enabled && track?.kind === "audio" ? processAudioTrack(track) : track;
          return originalReplaceTrack.call(this, nextTrack);
        };
      }
      Sender.prototype.__micMaxSenderPatched = true;
    }
  }

  async function getStreamWithFallback(orig, constraints, ctx) {
    try { return await orig.call(ctx, normalizeConstraints(constraints)); }
    catch (_) { return orig.call(ctx, constraints); }
  }

  async function wrapped(orig, constraints, ctx) {
    const s = await getStreamWithFallback(orig, constraints, ctx);
    if (!cfg().enabled || !wantsAudio(constraints)) return s;
    try { return build(s, state.config); }
    catch (_) { return s; }
  }

  patchPeerConnectionPaths();

  if (navigator.mediaDevices?.getUserMedia) {
    state.origMD = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = (constraints) => wrapped(state.origMD, constraints, navigator.mediaDevices);
  }
  if (navigator.getUserMedia) {
    state.origLegacy = navigator.getUserMedia.bind(navigator);
    navigator.getUserMedia = (constraints, ok, fail) => wrapped(state.origLegacy, constraints, navigator).then(ok).catch((e) => fail && fail(e));
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.type !== MSG_CFG) return;
    state.config = cfg(e.data.payload);
    updateAllPipelines(state.config);
  });

  window.postMessage({ type: "MIC_MAXIMIZER_READY" }, "*");
})();
