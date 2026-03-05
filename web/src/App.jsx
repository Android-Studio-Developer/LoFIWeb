import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiCreateRoom, apiJoinRoom, connectWS } from "./lib/room.js";

const GITHUB_URL = "https://github.com/Android-Studio-Developer";

export default function App() {

  const BG_GIF_URL = "/lofi.gif";

  const musicRef = useRef(null);

  const ambienceRefs = useRef({}); 

  const [tracks, setTracks] = useState([]);
  const [ambienceList, setAmbienceList] = useState([]); 

  const [playlistLoaded, setPlaylistLoaded] = useState(false);

  const [screen, setScreen] = useState("home"); 

  const [codeInput, setCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState(null);
  const [role, setRole] = useState("solo"); 

  const [presence, setPresence] = useState(1);

  const [wsClient, setWsClient] = useState(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0); 

  const [state, setState] = useState(() => ({

    playing: false,
    trackIndex: 0,
    trackStartedAtMs: Date.now(),
    trackPositionSec: 0,

    ambienceVolumes: {},

    timer: { mode: "focus", endsAtMs: null, focusMin: 25, breakMin: 5 },
  }));

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/playlist.json", { cache: "no-store" });
        const j = await r.json();

        const t = Array.isArray(j.tracks) ? j.tracks : [];
        const a = Array.isArray(j.ambience) ? j.ambience : [];

        setTracks(t);
        setAmbienceList(a);

        setState((s) => {
          const next = { ...s };
          const av = { ...(s.ambienceVolumes || {}) };
          for (const item of a) {
            if (typeof av[item.id] !== "number") av[item.id] = 0;
          }
          next.ambienceVolumes = av;
          return next;
        });

        setPlaylistLoaded(true);
      } catch {
        setTracks([]);
        setAmbienceList([]);
        setPlaylistLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!wsClient) return;
    const off = wsClient.on((msg) => {
      if (msg.t === "hello") {
        setServerOffsetMs((msg.serverNowMs ?? Date.now()) - Date.now());
      }
      if (msg.t === "joined") {
        setRole(msg.role);
        setRoomCode(msg.code);
        setPresence(1);
        setServerOffsetMs((msg.serverNowMs ?? Date.now()) - Date.now());
        if (msg.state) setState(normalizeIncomingState(msg.state));
      }
      if (msg.t === "state") {
        setServerOffsetMs((msg.serverNowMs ?? Date.now()) - Date.now());
        if (msg.state) setState(normalizeIncomingState(msg.state));
      }
      if (msg.t === "presence") setPresence(msg.count ?? 1);
    });
    return off;
  }, [wsClient]);

  function setHostState(patch) {
    if (role !== "host") return;

    const next = {
      ...state,
      ...patch,
      timer: patch.timer ? { ...state.timer, ...patch.timer } : state.timer,
      ambienceVolumes: patch.ambienceVolumes
        ? { ...(state.ambienceVolumes || {}), ...patch.ambienceVolumes }
        : state.ambienceVolumes,
    };
    setState(next);

    const payload = { t: "set_state" };

    if ("playing" in patch) payload.playing = !!next.playing;
    if ("trackIndex" in patch) payload.trackIndex = next.trackIndex;
    if ("trackStartedAtMs" in patch) payload.trackStartedAtMs = next.trackStartedAtMs;
    if ("trackPositionSec" in patch) payload.trackPositionSec = next.trackPositionSec;

    if (patch.timer) payload.timer = next.timer;

    if (patch.ambienceVolumes) payload.ambienceVolumes = next.ambienceVolumes;

    wsClient?.send(payload);
  }

  async function ensureUserGesture() {

  }

  async function startSolo() {
    await ensureUserGesture();
    setRole("solo");
    setRoomCode(null);
    setWsClient(null);
    setScreen("room");
    setPresence(1);

    const nowMs = Date.now();
    setState((s) => ({
      ...s,
      playing: true,
      trackIndex: 0,
      trackStartedAtMs: nowMs,
      trackPositionSec: 0,
    }));
  }

  async function createRoom() {
    await ensureUserGesture();
    const r = await apiCreateRoom();
    const client = connectWS(r.wsUrl);
    setWsClient(client);
    setScreen("room");
    client.send({ t: "join", code: r.code });
  }

  async function joinRoom() {
    await ensureUserGesture();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    const r = await apiJoinRoom(code);
    const client = connectWS(r.wsUrl);
    setWsClient(client);
    setScreen("room");
    client.send({ t: "join", code: r.code });
  }

  function copyCode() {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode);
  }

  useEffect(() => {
    const a = musicRef.current;
    if (!a) return;
    if (!playlistLoaded) return;
    if (!tracks.length) return;

    const t = tracks[state.trackIndex % tracks.length];
    if (!t) return;

    const absolute = location.origin + t.src;
    if (a.src !== absolute) a.src = t.src;
  }, [tracks, playlistLoaded, state.trackIndex]);

  useEffect(() => {
    const a = musicRef.current;
    if (!a) return;
    if (!playlistLoaded) return;
    if (!tracks.length) return;

    const serverNow = Date.now() + serverOffsetMs;
    const basePos = state.trackPositionSec || 0;
    const elapsed = state.playing ? Math.max(0, (serverNow - state.trackStartedAtMs) / 1000) : 0;
    const desired = clamp(basePos + elapsed, 0, 60 * 60);

    if (Number.isFinite(a.currentTime) && Math.abs((a.currentTime || 0) - desired) > 0.75) {
      try {
        a.currentTime = desired;
      } catch {}
    }

    (async () => {
      try {
        if (state.playing) await a.play();
        else a.pause();
      } catch {

      }
    })();
  }, [state.playing, state.trackStartedAtMs, state.trackPositionSec, serverOffsetMs, tracks, playlistLoaded]);

  useEffect(() => {
    const a = musicRef.current;
    if (!a) return;

    const onEnded = () => {
      if (!tracks.length) return;
      if (role === "listener") return;

      const nextIndex = (state.trackIndex + 1) % tracks.length;
      const nowMs = Date.now() + serverOffsetMs;

      if (role === "host") {
        setHostState({
          trackIndex: nextIndex,
          trackStartedAtMs: nowMs,
          trackPositionSec: 0,
          playing: true,
        });
      } else if (role === "solo") {
        setState((s) => ({
          ...s,
          trackIndex: nextIndex,
          trackStartedAtMs: Date.now(),
          trackPositionSec: 0,
          playing: true,
        }));
      }
    };

    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [role, state.trackIndex, tracks, serverOffsetMs]);

  useEffect(() => {
    if (!playlistLoaded) return;

    const volumes = state.ambienceVolumes || {};
    for (const item of ambienceList) {
      const el = ambienceRefs.current[item.id];
      if (!el) continue;

      const v = clamp(Number(volumes[item.id] ?? 0), 0, 1);
      el.volume = v;

      if (v <= 0.0001) {

        try {
          el.pause();
        } catch {}
      } else {

        el.loop = true;
        (async () => {
          try {
            await el.play();
          } catch {

          }
        })();
      }
    }
  }, [playlistLoaded, ambienceList, state.ambienceVolumes]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1000000), 250);
    return () => clearInterval(id);
  }, []);

  function getTimerText(timer) {
    const ends = timer.endsAtMs;
    if (!ends) {
      const base = timer.mode === "focus" ? timer.focusMin * 60 : timer.breakMin * 60;
      return formatMMSS(base);
    }
    const left = Math.max(0, Math.floor((ends - (Date.now() + serverOffsetMs)) / 1000));
    return formatMMSS(left);
  }
  const timerText = getTimerText(state.timer);

  function toggleTimer() {
    const canControl = role === "host" || role === "solo";
    if (!canControl) return;

    const baseMin = state.timer.mode === "focus" ? state.timer.focusMin : state.timer.breakMin;
    const endsAtMs = state.timer.endsAtMs ? null : (Date.now() + serverOffsetMs) + baseMin * 60 * 1000;

    if (role === "host") setHostState({ timer: { endsAtMs } });
    else setState((s) => ({ ...s, timer: { ...s.timer, endsAtMs } }));
  }

  function switchTimerMode() {
    const canControl = role === "host" || role === "solo";
    if (!canControl) return;

    const nextMode = state.timer.mode === "focus" ? "break" : "focus";
    const patch = { mode: nextMode, endsAtMs: null };

    if (role === "host") setHostState({ timer: patch });
    else setState((s) => ({ ...s, timer: { ...s.timer, ...patch } }));
  }

  async function togglePlayStop() {
    await ensureUserGesture();
    const a = musicRef.current;
    if (!a) return;
    if (role === "listener") return;

    const serverNow = Date.now() + serverOffsetMs;

    if (role === "host") {
      const pos = a.currentTime || 0;
      if (!state.playing) {
        setHostState({ playing: true, trackStartedAtMs: serverNow, trackPositionSec: pos });
      } else {
        setHostState({ playing: false, trackPositionSec: pos });
      }
    } else if (role === "solo") {
      setState((s) => ({
        ...s,
        playing: !s.playing,
        trackStartedAtMs: Date.now(),
        trackPositionSec: a.currentTime || 0,
      }));
    }
  }

  function setMusicVolume(v) {
    const a = musicRef.current;
    if (!a) return;
    a.volume = clamp(v, 0, 1);
  }

  function prevTrack() {
    if (!tracks.length) return;
    if (role === "listener") return;

    const nextIndex = (state.trackIndex - 1 + tracks.length) % tracks.length;
    const nowMs = Date.now() + serverOffsetMs;

    if (role === "host") {
      setHostState({ trackIndex: nextIndex, trackStartedAtMs: nowMs, trackPositionSec: 0, playing: true });
    } else {
      setState((s) => ({
        ...s,
        trackIndex: nextIndex,
        trackStartedAtMs: Date.now(),
        trackPositionSec: 0,
        playing: true,
      }));
    }
  }

  function nextTrack() {
    if (!tracks.length) return;
    if (role === "listener") return;

    const nextIndex = (state.trackIndex + 1) % tracks.length;
    const nowMs = Date.now() + serverOffsetMs;

    if (role === "host") {
      setHostState({ trackIndex: nextIndex, trackStartedAtMs: nowMs, trackPositionSec: 0, playing: true });
    } else {
      setState((s) => ({
        ...s,
        trackIndex: nextIndex,
        trackStartedAtMs: Date.now(),
        trackPositionSec: 0,
        playing: true,
      }));
    }
  }

  const currentTrackTitle = useMemo(() => {
    if (!tracks.length) return playlistLoaded ? "No tracks found (playlist.json)" : "Loading playlist...";
    return tracks[state.trackIndex % tracks.length]?.title || "Track";
  }, [tracks, state.trackIndex, playlistLoaded]);

  const ambienceDisabled = role === "listener" || (roomCode && role !== "host"); 

  function setAmbienceVolume(ambId, v) {
    const vol = clamp(Number(v), 0, 1);

    if (roomCode) {

      if (role !== "host") return;
      setHostState({ ambienceVolumes: { [ambId]: vol } });
    } else {

      setState((s) => ({
        ...s,
        ambienceVolumes: { ...(s.ambienceVolumes || {}), [ambId]: vol },
      }));
    }
  }

  const CenterStageStyle = {
    position: "relative",
    minHeight: "calc(100vh - 120px)",
    display: "grid",
    placeItems: "center",
    padding: 24,
    zIndex: 1,
  };

  const CenterCardStyle = {
    width: "min(900px, 92vw)",
    borderRadius: 22,
    padding: 16,
  };

  const BoxStyle = {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.20)",
    borderRadius: 16,
    overflow: "hidden",
    padding: 14,
  };

  const BigClockStyle = {
    fontSize: 44,
    fontWeight: 900,
    letterSpacing: ".8px",
    lineHeight: 1,
  };

  const ClockSubStyle = {
    fontSize: 12,
    color: "rgba(255,255,255,.68)",
    textAlign: "center",
    marginTop: 6,
  };

  const CenterTopStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  };

  return (
    <div className="wrap">
      {}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${BG_GIF_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.78) contrast(1.02)",
          transform: "scale(1.02)",
        }}
      />
      {}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))",
        }}
      />

      <div className="ui" style={{ position: "relative", zIndex: 1 }}>
        <div className="topbar">
          <div className="brand">
            <div className="logo" />
            <div>
              <div className="title">LoFI Chilling</div>
              <div className="subtitle">native mp3 player • ambience mp3 layers • host controls in room</div>
            </div>
          </div>

          <div className="small">
            {screen === "room" ? (
              roomCode ? (
                <>
                  Code <span className="kbd">{roomCode}</span> • People <span className="kbd">{presence}</span> • Role{" "}
                  <span className="kbd">{role}</span>
                </>
              ) : (
                <>
                  Solo • People <span className="kbd">1</span>
                </>
              )
            ) : (
              <>Solo or Room</>
            )}
          </div>
        </div>

        <div style={CenterStageStyle}>
          <div className="card" style={CenterCardStyle}>
            <div style={{ display: "grid", gap: 14 }}>
              {}
              <div style={{ textAlign: "center" }}>
                <div style={BigClockStyle}>{timerText}</div>
                <div style={ClockSubStyle}>{state.timer.mode.toUpperCase()}</div>
                <div className="row" style={{ justifyContent: "center", marginTop: 10 }}>
                  <button className="btn" onClick={toggleTimer}>
                    ⏯ Timer
                  </button>
                  <button className="btn" onClick={switchTimerMode}>
                    ⇄ Mode
                  </button>
                  {screen === "room" && roomCode && (
                    <button className="btn" onClick={copyCode}>
                      Copy Code
                    </button>
                  )}
                  {screen === "room" && (
                    <button className="btn" onClick={() => location.reload()}>
                      Exit
                    </button>
                  )}
                </div>
              </div>

              {}
              <div style={BoxStyle}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{currentTrackTitle}</div>
                    <div className="small">Main music • Host controls play/skip in room</div>
                  </div>
                  <div className="kbd">
                    {tracks.length ? `${(state.trackIndex % tracks.length) + 1}/${tracks.length}` : "--/--"}
                  </div>
                </div>

                <div style={{ ...CenterTopStyle, marginTop: 12 }}>
                  <button className="btn" onClick={prevTrack} disabled={role === "listener" || (roomCode && role !== "host")}>
                    ⟵ Prev
                  </button>

                  <button
                    className={"btn " + (state.playing ? "primary" : "")}
                    onClick={togglePlayStop}
                    disabled={role === "listener" || (roomCode && role !== "host")}
                  >
                    {state.playing ? "Stop" : "Play"}
                  </button>

                  <button className="btn" onClick={nextTrack} disabled={role === "listener" || (roomCode && role !== "host")}>
                    Next ⟶
                  </button>

                  <div className="small">Volume</div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={0.85}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    style={{ width: 220 }}
                  />
                  <span className="kbd">music</span>
                </div>

                <audio ref={musicRef} preload="auto" />
              </div>

              {}
              <div style={BoxStyle}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>Ambient Layers</div>
                    <div className="small">
                      {roomCode
                        ? "Only host can control in rooms. (0 = pause)"
                        : "Solo mode: you control. (0 = pause)"}
                    </div>
                  </div>
                  <div className="kbd">{ambienceList.length ? `${ambienceList.length} layers` : "0 layers"}</div>
                </div>

                {ambienceList.length === 0 ? (
                  <div className="small" style={{ marginTop: 10, textAlign: "center" }}>
                    Add `ambience` array in playlist.json (rain, campfire, traffic, typing...)
                  </div>
                ) : (
                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {ambienceList.map((item) => {
                      const v = clamp(Number(state.ambienceVolumes?.[item.id] ?? 0), 0, 1);
                      return (
                        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 260px 64px", gap: 10, alignItems: "center", opacity: ambienceDisabled ? 0.6 : 1 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.title || item.id}</div>
                            <div className="small">{item.src}</div>
                          </div>

                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={v}
                            disabled={ambienceDisabled}
                            onChange={(e) => setAmbienceVolume(item.id, e.target.value)}
                          />

                          <div className="kbd" style={{ textAlign: "right" }}>
                            {v.toFixed(2)}
                          </div>

                          {}
                          <audio
                            ref={(el) => {
                              if (!el) return;
                              ambienceRefs.current[item.id] = el;
                              if (!el.src) el.src = item.src; 

                              el.loop = true;
                              el.preload = "auto";
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {}
              {screen === "home" ? (
                <div className="row" style={{ justifyContent: "center" }}>
                  <button className="btn primary" onClick={startSolo}>
                    Start Solo
                  </button>
                  <button className="btn" onClick={createRoom}>
                    Create Room
                  </button>
                  <input
                    className="input"
                    placeholder="CODE"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    maxLength={6}
                    style={{ width: 130 }}
                  />
                  <button className="btn" onClick={joinRoom}>
                    Join
                  </button>
                </div>
              ) : (
                <div className="row" style={{ justifyContent: "center" }}>
                  <div className="small">
                    Room is live. Share code, and host controls music + ambience.
                  </div>
                </div>
              )}

              <div className="small" style={{ textAlign: "center", lineHeight: 1.5 }}>
                {tracks.length
                  ? "Files are served from web/public. Update playlist.json to add/remove tracks/layers."
                  : "No tracks yet. Add mp3 files + playlist.json."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div
        className="footer"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          padding: "10px 14px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div className="footerInner">
          <span>LoFI Chilling <v className="1 0 1">1.0.1</v> — not affiliated with any streaming. made by Android_Studio_Developer</span>
          <span style={{ opacity: 0.8 }}>•</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
          >
            <span className="ghIcon" aria-hidden="true" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function normalizeIncomingState(s) {
  const copy = { ...s };

  if (!copy.ambienceVolumes || typeof copy.ambienceVolumes !== "object") copy.ambienceVolumes = {};

  if ("ambience" in copy) delete copy.ambience;
  return copy;
}

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
