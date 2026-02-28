(() => {
  const roomKey = "lofiweb-room";
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("lofiweb-sync") : null;

  const $ = (id) => document.getElementById(id);
  const els = {
    clock: $("clock"),
    createRoomBtn: $("createRoomBtn"),
    joinRoomBtn: $("joinRoomBtn"),
    roomCodeInput: $("roomCodeInput"),
    roomStateText: $("roomStateText"),
    playBtn: $("playBtn"),
    pauseBtn: $("pauseBtn"),
    musicVolume: $("musicVolume"),
    tempoSelect: $("tempoSelect"),
    rainToggle: $("rainToggle"),
    cafeToggle: $("cafeToggle"),
    rainVolume: $("rainVolume"),
    cafeVolume: $("cafeVolume")
  };

  const state = {
    roomCode: null,
    host: false,
    playing: false,
    tempo: 65,
    musicVol: 0.55,
    rainOn: true,
    cafeOn: false,
    rainVol: 0.35,
    cafeVol: 0.2
  };

  const audio = {
    ctx: null,
    master: null,
    musicGain: null,
    rainGain: null,
    cafeGain: null,
    chordTimer: null,
    noteIndex: 0,
    rainNoise: null,
    cafeNoise: null,
    started: false
  };

  const safe = (fn) => (...args) => {
    try {
      fn(...args);
    } catch (err) {
      console.error("LoFIWeb error:", err);
      els.roomStateText.textContent = "오류가 발생했지만 앱은 안전 모드로 동작 중";
    }
  };

  function updateClock() {
    const now = new Date();
    els.clock.textContent = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function randomCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function initAudio() {
    if (audio.started) return;
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.8;

    audio.musicGain = audio.ctx.createGain();
    audio.musicGain.gain.value = state.musicVol;

    audio.rainGain = audio.ctx.createGain();
    audio.rainGain.gain.value = state.rainOn ? state.rainVol : 0;

    audio.cafeGain = audio.ctx.createGain();
    audio.cafeGain.gain.value = state.cafeOn ? state.cafeVol : 0;

    const musicFilter = audio.ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 1400;

    audio.musicGain.connect(musicFilter);
    musicFilter.connect(audio.master);
    audio.rainGain.connect(audio.master);
    audio.cafeGain.connect(audio.master);
    audio.master.connect(audio.ctx.destination);

    const makeNoise = () => {
      const buffer = audio.ctx.createBuffer(1, audio.ctx.sampleRate * 2, audio.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = audio.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      return source;
    };

    audio.rainNoise = makeNoise();
    const rainFilter = audio.ctx.createBiquadFilter();
    rainFilter.type = "bandpass";
    rainFilter.frequency.value = 900;
    rainFilter.Q.value = 0.7;
    audio.rainNoise.connect(rainFilter);
    rainFilter.connect(audio.rainGain);

    audio.cafeNoise = makeNoise();
    const cafeFilter = audio.ctx.createBiquadFilter();
    cafeFilter.type = "lowpass";
    cafeFilter.frequency.value = 450;
    audio.cafeNoise.connect(cafeFilter);
    cafeFilter.connect(audio.cafeGain);

    audio.rainNoise.start();
    audio.cafeNoise.start();
    audio.started = true;
  }

  function playChord(freqA, freqB, lengthSec) {
    const now = audio.ctx.currentTime;
    const mkOsc = (freq, type, gainAmount) => {
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainAmount, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + lengthSec);
      osc.connect(gain);
      gain.connect(audio.musicGain);
      osc.start(now);
      osc.stop(now + lengthSec + 0.05);
    };

    mkOsc(freqA, "triangle", 0.12);
    mkOsc(freqB, "sine", 0.08);
  }

  function startMusic() {
    if (!audio.started) initAudio();
    if (audio.ctx.state === "suspended") {
      audio.ctx.resume().catch(() => {
        els.roomStateText.textContent = "브라우저 정책으로 자동 재생이 제한되었습니다.";
      });
    }
    if (audio.chordTimer) clearInterval(audio.chordTimer);

    const progression = [
      [220, 277.18],
      [174.61, 261.63],
      [196.0, 246.94],
      [164.81, 246.94]
    ];

    const beatMs = Math.round((60_000 / state.tempo) * 2);
    state.playing = true;
    audio.chordTimer = setInterval(() => {
      const chord = progression[audio.noteIndex % progression.length];
      playChord(chord[0], chord[1], Math.max(0.9, beatMs / 1300));
      audio.noteIndex += 1;
    }, beatMs);
  }

  function pauseMusic() {
    state.playing = false;
    if (audio.chordTimer) {
      clearInterval(audio.chordTimer);
      audio.chordTimer = null;
    }
  }

  function updateRoleUI() {
    const locked = state.roomCode && !state.host;
    [els.rainToggle, els.cafeToggle, els.rainVolume, els.cafeVolume].forEach((el) => {
      el.disabled = !!locked;
    });
  }

  function setRoomText() {
    if (!state.roomCode) {
      els.roomStateText.textContent = "Solo 모드";
      return;
    }
    els.roomStateText.textContent = state.host
      ? `Host 모드 · 코드 ${state.roomCode}`
      : `참여중 · 코드 ${state.roomCode}`;
  }

  function persistAndBroadcast(type) {
    const payload = { ...state, type };
    localStorage.setItem(roomKey, JSON.stringify(payload));
    if (channel) channel.postMessage(payload);
  }

  function applySharedState(payload) {
    if (!payload || payload.roomCode !== state.roomCode || state.host) return;
    state.playing = !!payload.playing;
    state.tempo = Number(payload.tempo) || state.tempo;
    state.musicVol = Number(payload.musicVol) || state.musicVol;
    state.rainOn = !!payload.rainOn;
    state.cafeOn = !!payload.cafeOn;
    state.rainVol = Number(payload.rainVol) || state.rainVol;
    state.cafeVol = Number(payload.cafeVol) || state.cafeVol;
    syncUIFromState();
    applyAudioValues();
    if (state.playing) startMusic();
    else pauseMusic();
  }

  function applyAudioValues() {
    if (!audio.started) return;
    audio.musicGain.gain.value = state.musicVol;
    audio.rainGain.gain.value = state.rainOn ? state.rainVol : 0;
    audio.cafeGain.gain.value = state.cafeOn ? state.cafeVol : 0;
  }

  function syncUIFromState() {
    els.musicVolume.value = Math.round(state.musicVol * 100);
    els.tempoSelect.value = String(state.tempo);
    els.rainToggle.checked = state.rainOn;
    els.cafeToggle.checked = state.cafeOn;
    els.rainVolume.value = Math.round(state.rainVol * 100);
    els.cafeVolume.value = Math.round(state.cafeVol * 100);
  }

  els.createRoomBtn.addEventListener("click", safe(() => {
    state.roomCode = randomCode();
    state.host = true;
    setRoomText();
    updateRoleUI();
    persistAndBroadcast("room-created");
  }));

  els.joinRoomBtn.addEventListener("click", safe(() => {
    const code = (els.roomCodeInput.value || "").trim().toUpperCase();
    if (code.length !== 6) {
      els.roomStateText.textContent = "6자리 코드를 입력해 주세요.";
      return;
    }
    state.roomCode = code;
    state.host = false;
    setRoomText();
    updateRoleUI();

    const cached = localStorage.getItem(roomKey);
    if (cached) {
      const payload = JSON.parse(cached);
      if (payload.roomCode === code) applySharedState(payload);
    }
  }));

  els.playBtn.addEventListener("click", safe(() => {
    startMusic();
    persistAndBroadcast("play");
  }));

  els.pauseBtn.addEventListener("click", safe(() => {
    pauseMusic();
    persistAndBroadcast("pause");
  }));

  els.musicVolume.addEventListener("input", safe((event) => {
    state.musicVol = Number(event.target.value) / 100;
    applyAudioValues();
    persistAndBroadcast("music-volume");
  }));

  els.tempoSelect.addEventListener("change", safe((event) => {
    state.tempo = Number(event.target.value) || 65;
    if (state.playing) startMusic();
    persistAndBroadcast("tempo");
  }));

  els.rainToggle.addEventListener("change", safe((event) => {
    state.rainOn = !!event.target.checked;
    applyAudioValues();
    persistAndBroadcast("rain-toggle");
  }));

  els.cafeToggle.addEventListener("change", safe((event) => {
    state.cafeOn = !!event.target.checked;
    applyAudioValues();
    persistAndBroadcast("cafe-toggle");
  }));

  els.rainVolume.addEventListener("input", safe((event) => {
    state.rainVol = Number(event.target.value) / 100;
    applyAudioValues();
    persistAndBroadcast("rain-volume");
  }));

  els.cafeVolume.addEventListener("input", safe((event) => {
    state.cafeVol = Number(event.target.value) / 100;
    applyAudioValues();
    persistAndBroadcast("cafe-volume");
  }));

  if (channel) {
    channel.addEventListener("message", safe((event) => {
      applySharedState(event.data);
    }));
  }

  window.addEventListener("storage", safe((event) => {
    if (event.key !== roomKey || !event.newValue) return;
    applySharedState(JSON.parse(event.newValue));
  }));

  setInterval(updateClock, 1000);
  updateClock();
  setRoomText();
  syncUIFromState();
  updateRoleUI();
})();
