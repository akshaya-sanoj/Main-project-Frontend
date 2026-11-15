import { useEffect, useRef } from 'react';

const rand = (a, b) => a + Math.random() * (b - a);

/*
 * SwarmCursor: a swarm of small particles that follows the mouse and bursts on click.
 * It draws behind its children, so put your page content inside it.
 *
 * Props
 * - count: number of particles (halved on small screens). Default 800
 * - size: particle radius in px. Default 2.6
 * - spread: how far from the cursor the swarm orbits, in px. Default 90
 * - swirl: how fast the swarm circles the cursor. Default 0.6
 * - clickEffect: 'burst' pushes particles outward on click, 'none' turns it off
 * - colors: list of particle colours
 * - className / style: for the wrapper (give it a background and `relative overflow-hidden`)
 *
 * The particles sit above the wrapper's own background but below children that
 * are `relative z-10`. People with "reduce motion" turned on get no particles.
 */
export default function SwarmCursor({
  count = 800,
  size = 2.6,
  spread = 90,
  swirl = 0.6,
  clickEffect = 'burst',
  colors = ['#F5A623', '#FFFFFF', '#D6336C'],
  className = '',
  style,
  children,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const colorsKey = colors.join('|');

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;
    let parts = [];
    let raf = 0;
    let visible = true;
    let t = 0;
    let last = 0;
    const pointer = { x: 0, y: 0, active: false };

    const init = () => {
      const n = Math.round(count * (w < 640 ? 0.5 : 1));
      parts = Array.from({ length: n }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x,
          y,
          vx: 0,
          vy: 0,
          hx: x,
          hy: y,
          a: Math.random() * Math.PI * 2,
          r: Math.sqrt(Math.random()) * spread,
          dir: Math.random() < 0.5 ? -1 : 1,
          w: rand(0.6, 1.4),
          c: colors[(Math.random() * colors.length) | 0],
          al: rand(0.35, 0.9),
          s: size * rand(0.6, 1.2),
        };
      });
    };

    const resize = () => {
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      init();
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const k = dt * 60;
      t += dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < parts.length; i += 1) {
        const p = parts[i];
        let tx;
        let ty;
        if (pointer.active) {
          const ang = p.a + t * swirl * 3 * p.dir * p.w;
          tx = pointer.x + Math.cos(ang) * p.r;
          ty = pointer.y + Math.sin(ang) * p.r;
        } else {
          tx = p.hx + Math.sin(t * 0.5 + p.a) * 12;
          ty = p.hy + Math.cos(t * 0.4 + p.a) * 12;
        }
        p.vx += (tx - p.x) * 0.012 * k;
        p.vy += (ty - p.y) * 0.012 * k;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx * k;
        p.y += p.vy * k;

        ctx.globalAlpha = p.al;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const localPoint = (e) => {
      const rect = wrap.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMove = (e) => {
      const p = localPoint(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e) => {
      if (clickEffect !== 'burst') return;
      const c = localPoint(e);
      const reach = 260;
      parts.forEach((p) => {
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < reach) {
          const f = (1 - d / reach) * 14;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(wrap);

    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('pointerdown', onDown);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('pointerdown', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, size, spread, swirl, clickEffect, colorsKey]);

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={style}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
      />
      {children}
    </div>
  );
}