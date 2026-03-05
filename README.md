<!-- manual.readme.html -->
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.55; color:#111; max-width:900px; margin:0 auto; padding:18px;">
  <div style="padding:18px 18px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
      <div style="font-size:28px; font-weight:900;">🌙🎧 LoFI Chilling v.(int) h3 — Manual</div>
      <div style="padding:6px 10px; border-radius:999px; background:#f3f4f6; border:1px solid #e5e7eb; font-size:12px;">
        Native MP3 • Rooms • Host controls
      </div>
    </div>

    <p style="margin:10px 0 0; color:#374151;">
      A chill, modern web app where people can <b>listen together without voice chat</b> — or study solo —
      with <b>native MP3 playback</b>, <b>ambient MP3 layers</b>, a <b>focus timer</b>, and a <b>GIF background</b>.
    </p>

    <div style="margin-top:12px; padding:12px 14px; border-left:4px solid #111827; background:#f9fafb; border-radius:12px;">
      <div style="font-size:13px; color:#111827;"><b>Credits</b></div>
      <div style="font-size:13px; color:#374151;">
        Not affiliated with any streaming service. Made by <b>Android_Studio_Developer</b>.
      </div>
    </div>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">✅ Quick Start (2 terminals)</h2>

  <div style="display:grid; gap:14px;">
    <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
      <div style="font-weight:800; font-size:15px;">1) Start the server (rooms + sync)</div>
      <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>cd server
npm i
npm run dev</code></pre>
      <div style="margin-top:10px; font-size:13px; color:#374151;">
        Server runs on <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">http://localhost:8787</code>
      </div>
      <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>curl http://localhost:8787/health</code></pre>
    </div>

    <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
      <div style="font-weight:800; font-size:15px;">2) Start the web app (Vite)</div>
      <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>cd web
npm i
npm run dev</code></pre>
      <div style="margin-top:10px; font-size:13px; color:#374151;">
        Open the <b>Local:</b> URL Vite prints (ex: <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">http://localhost:5174/</code>)
      </div>
      <div style="margin-top:8px; padding:10px 12px; background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; color:#9a3412; font-size:13px;">
        ⚠️ If port <b>5173</b> is in use, Vite will switch to <b>5174</b>. Always open the printed <b>Local</b> URL.
      </div>
    </div>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">🖼️ GIF Background</h2>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <div style="font-weight:800; font-size:15px;">Put your GIF here</div>
    <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>web/public/lofi.gif</code></pre>
    <div style="margin-top:10px; font-size:13px; color:#374151;">
      Quick test (port may differ):
      <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">http://localhost:5174/lofi.gif</code>
    </div>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">🎵 Main Music (MP3)</h2>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <div style="font-weight:800; font-size:15px;">Put your MP3 files here</div>
    <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>web/public/tracks/</code></pre>
    <ul style="margin:10px 0 0; color:#374151; font-size:13px;">
      <li>Example: <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">lofi-1.mp3</code>, <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">lofi-2.mp3</code> …</li>
      <li><b>Filenames must match exactly</b> (case-sensitive on deployment).</li>
    </ul>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">🌧️ Ambient Layers (MP3)</h2>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <div style="font-weight:800; font-size:15px;">Put ambience MP3 files here too</div>
    <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>web/public/tracks/</code></pre>
    <div style="margin-top:10px; font-size:13px; color:#374151;">
      🎛️ Slider controls <b>audio.volume</b> • If slider is <b>0</b> → <b>pause</b> • If &gt; 0 → <b>play + loop</b>
    </div>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">🧾 playlist.json</h2>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <div style="font-weight:800; font-size:15px;">Location</div>
    <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>web/public/playlist.json</code></pre>

    <div style="font-weight:800; font-size:15px; margin-top:12px;">Example</div>
    <pre style="margin:10px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>{
  "tracks": [
    { "id": "lofi-1", "title": "Lofi 1", "src": "/tracks/lofi-1.mp3" },
    { "id": "lofi-2", "title": "Lofi 2", "src": "/tracks/lofi-2.mp3" }
  ],
  "ambience": [
    { "id": "rain", "title": "Rain", "src": "/tracks/rain.mp3" },
    { "id": "campfire", "title": "Campfire", "src": "/tracks/Campfire.mp3" },
    { "id": "traffic", "title": "City Traffic", "src": "/tracks/City_Traffic.mp3" },
    { "id": "typing", "title": "Typing", "src": "/tracks/typing.mp3" }
  ]
}</code></pre>
    <ul style="margin:10px 0 0; color:#374151; font-size:13px;">
      <li><b>tracks</b> = main playlist (one at a time)</li>
      <li><b>ambience</b> = layered sounds (multiple at once)</li>
    </ul>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">🧑‍🤝‍🧑 Rooms (Host controls)</h2>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <ul style="margin:0; color:#374151; font-size:13px; padding-left:18px;">
      <li><b>Create Room</b> → share the code</li>
      <li><b>Join</b> → enter code</li>
      <li>👑 In rooms, <b>only the Host</b> can control:
        <ul style="margin:6px 0 0; padding-left:18px;">
          <li>▶️⏸️ Play/Stop</li>
          <li>⏭️⏮️ Next/Prev</li>
          <li>🎛️ Ambient sliders (0 = pause)</li>
        </ul>
      </li>
    </ul>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">🔧 Server Patch (Ambient Sync)</h2>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <p style="margin:0; color:#374151; font-size:13px;">
      To sync ambient sliders from Host → everyone, the server must accept and broadcast
      <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">ambienceVolumes</code>.
    </p>

    <div style="font-weight:800; margin-top:10px;">Add in <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">defaultState()</code>:</div>
    <pre style="margin:8px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>ambienceVolumes: {},</code></pre>

    <div style="font-weight:800; margin-top:10px;">Inside host-only <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">set_state</code> allowlist:</div>
    <pre style="margin:8px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>if (msg.ambienceVolumes && typeof msg.ambienceVolumes === "object") {
  next.ambienceVolumes = next.ambienceVolumes || {};
  for (const [k, v] of Object.entries(msg.ambienceVolumes)) {
    if (typeof v === "number") next.ambienceVolumes[k] = Math.max(0, Math.min(1, v));
  }
}</code></pre>

    <div style="margin-top:10px; font-size:13px; color:#374151;">
      Restart server after patch:
    </div>
    <pre style="margin:8px 0 0; padding:12px; background:#0b1020; color:#fff; border-radius:12px; overflow:auto;"><code>npm run dev</code></pre>
  </div>

  <h2 style="margin:22px 0 10px; font-size:20px;">🧯 Troubleshooting</h2>
  <div style="padding:16px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">
    <ul style="margin:0; color:#374151; font-size:13px; padding-left:18px;">
      <li><b>ENOENT package.json</b> → run npm inside <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">web/</code> or <code style="background:#f3f4f6; padding:2px 6px; border-radius:8px;">server/</code></li>
      <li><b>Port 5173 in use</b> → open the <b>Local:</b> URL Vite prints (often 5174)</li>
      <li><b>White screen</b> → check DevTools Console for red errors</li>
    </ul>
  </div>

  <div style="margin-top:22px; padding:14px; border:1px dashed #d1d5db; border-radius:16px; background:#fafafa; text-align:center; color:#374151;">
    ✅ Done. Enjoy studying.  
    <div style="margin-top:8px; font-size:12px; color:#6b7280;">
      GitHub: <a href="https://github.com/Android_Studio_Developer" style="color:#111827; text-decoration:underline;">Android_Studio_Developer</a>
    </div>
  </div>
</div>
