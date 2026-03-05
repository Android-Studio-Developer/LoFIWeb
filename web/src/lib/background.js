export function startBackground(canvas) {
  const ctx = canvas.getContext("2d");
  let w=0,h=0, raf=0;
  const blobs = new Array(6).fill(0).map((_,i)=>({
    x: Math.random(), y: Math.random(),
    r: 0.14 + Math.random()*0.18,
    vx: (Math.random()*2-1)*0.00035,
    vy: (Math.random()*2-1)*0.00035,
    phase: Math.random()*Math.PI*2
  }));

  function resize() {
    w = canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio);
    h = canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function draw(tms) {
    const t = tms * 0.001;
    ctx.clearRect(0,0,w,h);

    // base gradient
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "#0b1020");
    g.addColorStop(0.4, "#0f1b3d");
    g.addColorStop(1, "#070a14");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // soft blobs
    ctx.globalCompositeOperation = "screen";
    for (const b of blobs) {
      b.x += b.vx; b.y += b.vy;
      if (b.x < -0.2 || b.x > 1.2) b.vx *= -1;
      if (b.y < -0.2 || b.y > 1.2) b.vy *= -1;

      const x = b.x * w;
      const y = b.y * h;
      const r = b.r * Math.min(w,h) * (0.92 + 0.08*Math.sin(t + b.phase));

      const gg = ctx.createRadialGradient(x,y,0,x,y,r);
      gg.addColorStop(0, "rgba(139,92,246,0.32)");
      gg.addColorStop(0.6, "rgba(56,189,248,0.14)");
      gg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    // subtle grain
    ctx.globalAlpha = 0.06;
    for (let i=0;i<1400;i++){
      const x = Math.random()*w, y=Math.random()*h;
      ctx.fillStyle = "white";
      ctx.fillRect(x,y,1,1);
    }
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(draw);
  }

  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}
