export function apiCreateRoom() {
  return fetch("/api/room/create", { method: "POST" }).then(r => r.json());
}

export function apiJoinRoom(code) {
  return fetch("/api/room/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  }).then(async r => {
    if (!r.ok) throw new Error((await r.json()).error || "JOIN_FAILED");
    return r.json();
  });
}

export function connectWS(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const listeners = new Set();

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      for (const fn of listeners) fn(msg);
    } catch {}
  };

  return {
    ws,
    on(fn){ listeners.add(fn); return () => listeners.delete(fn); },
    send(obj){
      if (ws.readyState === 1) ws.send(JSON.stringify(obj));
    }
  };
}
