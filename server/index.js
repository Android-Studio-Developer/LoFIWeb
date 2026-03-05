import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });


const rooms = new Map();

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function now() {
  return Date.now();
}

function defaultState() {
  return {
    trackIndex: 0,
    trackStartedAtMs: now(),
    trackPositionSec: 0,
    mode: "room",
    playing: true,
    startedAtMs: now(), 
    bpm: 72,
    ambience: {
      rain: 0.25,
      cafe: 0.1,
      wind: 0.08,
      fireplace: 0.0,
      white: 0.0,
      keyboard: 0.0
    },
    timer: {
      mode: "focus",
      endsAtMs: null,
      focusMin: 25,
      breakMin: 5
    }
  };
}

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/room/create", (req, res) => {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const room = {
    code,
    hostClientId: null,
    state: defaultState(),
    createdAtMs: now()
  };
  rooms.set(code, room);

  res.json({ code, wsUrl: `ws://localhost:8787/ws` });
});

app.post("/room/join", (req, res) => {
  const { code } = req.body || {};
  const room = rooms.get(String(code || "").toUpperCase());
  if (!room) return res.status(404).json({ error: "ROOM_NOT_FOUND" });

  res.json({ code: room.code, wsUrl: `ws://localhost:8787/ws` });
});

function broadcast(roomCode, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    if (client._roomCode !== roomCode) continue;
    client.send(JSON.stringify(payload));
  }
}

function safeSend(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

wss.on("connection", (ws, req) => {
  ws._clientId = cryptoRandomId();
  ws._roomCode = null;

  safeSend(ws, { t: "hello", clientId: ws._clientId, serverNowMs: now() });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.t === "join") {
      const code = String(msg.code || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        return safeSend(ws, { t: "error", error: "ROOM_NOT_FOUND" });
      }
      ws._roomCode = code;

      
      if (!room.hostClientId) room.hostClientId = ws._clientId;

      const role = room.hostClientId === ws._clientId ? "host" : "listener";
      safeSend(ws, {
        t: "joined",
        code,
        role,
        state: room.state,
        serverNowMs: now()
      });

      broadcast(code, { t: "presence", count: countRoomClients(code) });
      return;
    }

    
    const code = ws._roomCode;
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    const isHost = room.hostClientId === ws._clientId;

  
    if (msg.t === "set_state" && isHost) {
      
      const next = structuredClone(room.state);

      if (typeof msg.trackIndex === "number") next.trackIndex = Math.max(0, Math.floor(msg.trackIndex));
      if (typeof msg.trackStartedAtMs === "number") next.trackStartedAtMs = msg.trackStartedAtMs;
      if (typeof msg.trackPositionSec === "number") next.trackPositionSec = Math.max(0, msg.trackPositionSec);

      if (typeof msg.playing === "boolean") {
        next.playing = msg.playing;
        if (msg.playing && typeof msg.startedAtMs === "number") next.startedAtMs = msg.startedAtMs;
      }
      if (typeof msg.bpm === "number") next.bpm = clamp(msg.bpm, 55, 95);

      if (msg.ambience && typeof msg.ambience === "object") {
        for (const k of Object.keys(next.ambience)) {
          if (typeof msg.ambience[k] === "number") next.ambience[k] = clamp(msg.ambience[k], 0, 1);
        }
      }

      if (msg.timer && typeof msg.timer === "object") {
        if (msg.timer.mode === "focus" || msg.timer.mode === "break") next.timer.mode = msg.timer.mode;
        if (typeof msg.timer.focusMin === "number") next.timer.focusMin = clamp(msg.timer.focusMin, 5, 90);
        if (typeof msg.timer.breakMin === "number") next.timer.breakMin = clamp(msg.timer.breakMin, 3, 30);
        if (msg.timer.endsAtMs === null || typeof msg.timer.endsAtMs === "number") next.timer.endsAtMs = msg.timer.endsAtMs;
      }

      room.state = next;
      broadcast(code, { t: "state", state: room.state, serverNowMs: now() });
      return;
    }

    
    if (msg.t === "ping") {
      safeSend(ws, { t: "pong", serverNowMs: now() });
      return;
    }
  });

  ws.on("close", () => {
    const code = ws._roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

   
    if (room.hostClientId === ws._clientId) {
      const nextHost = pickAnyClientIdInRoom(code);
      room.hostClientId = nextHost || null;
      broadcast(code, { t: "host_changed", hostClientId: room.hostClientId });
    }
    broadcast(code, { t: "presence", count: countRoomClients(code) });
  });
});

function countRoomClients(code) {
  let n = 0;
  for (const c of wss.clients) if (c.readyState === 1 && c._roomCode === code) n++;
  return n;
}

function pickAnyClientIdInRoom(code) {
  for (const c of wss.clients) {
    if (c.readyState === 1 && c._roomCode === code) return c._clientId;
  }
  return null;
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function cryptoRandomId() {

  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

const PORT = 8787;
server.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});
