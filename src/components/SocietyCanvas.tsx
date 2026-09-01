import { useEffect, useRef } from "react";
import type { ActionKind } from "@/lib/simulation";

export type RippleEvent = {
  id: number;
  kind: ActionKind;
  /** 0..1 log-scaled power intensity */
  intensity: number;
};

type Node = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  charge: number; // -1 vice .. +1 virtue
  importance: number; // 0..1, affects base size
};

type Ripple = {
  kind: ActionKind;
  intensity: number;
  start: number;
};

type SecondaryRipple = {
  x: number;
  y: number;
  kind: ActionKind;
  start: number;
};

type RGB = [number, number, number];

const VIRTUE: RGB = [124, 245, 148];
const GOLD: RGB = [245, 205, 110];
const VICE: RGB = [235, 70, 60];

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function SocietyCanvas({
  ripple,
  zoomLevel = 0,
}: {
  ripple: RippleEvent | null;
  zoomLevel?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const secondaryRef = useRef<SecondaryRipple[]>([]);
  const lastRippleId = useRef<number>(-1);
  const zoomRef = useRef(zoomLevel);
  zoomRef.current = zoomLevel;

  useEffect(() => {
    if (!ripple || ripple.id === lastRippleId.current) return;
    lastRippleId.current = ripple.id;
    if (ripple.id === 0) {
      ripplesRef.current = [];
      secondaryRef.current = [];
      nodesRef.current.forEach((n) => {
        n.charge = 0;
        n.vx = 0;
        n.vy = 0;
        n.x = n.ox;
        n.y = n.oy;
      });
      return;
    }
    ripplesRef.current.push({
      kind: ripple.kind,
      intensity: ripple.intensity,
      start: performance.now(),
    });
  }, [ripple]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const z = zoomRef.current;
      const divisions = 12 + z * 38;
      const gap = Math.max(7, Math.min(w, h) / divisions);
      const cols = Math.floor(w / gap);
      const rows = Math.floor(h / gap);
      const offX = (w - (cols - 1) * gap) / 2;
      const offY = (h - (rows - 1) * gap) / 2;
      const nodes: Node[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offX + c * gap;
          const y = offY + r * gap;
          // Most nodes small, a few large — power distribution
          const importance = Math.pow(Math.random(), 3);
          nodes.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, charge: 0, importance });
        }
      }
      nodesRef.current = nodes;
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.hypot(w, h) / 2;
      const ripples = ripplesRef.current;
      const nodes = nodesRef.current;
      const z = zoomRef.current;
      const baseSize = 2.6 - z * 1.9;

      // prune finished ripples (shorter duration to avoid lag)
      ripplesRef.current = ripples.filter((r) => now - r.start < 1400 + r.intensity * 800);

      for (const r of ripplesRef.current) {
        const duration = 1400 + r.intensity * 800;
        const life = (now - r.start) / duration;
        // Cap radius so the ring stays visible on screen
        const radius = life * maxR * (0.45 + r.intensity * 0.5);
        const fade = Math.max(0, 1 - life);
        const strength = 0.25 + r.intensity * 1.6;
        // Shift towards gold at high intensity but keep it green-dominant
        const color = r.kind === "virtue" ? mix(VIRTUE, GOLD, r.intensity * 0.6) : VICE;

        // Main ring — the primary visual, always a ring not a filled circle
        ctx.lineWidth = Math.max(1.5, 2 + r.intensity * 6);
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${fade * (0.6 + r.intensity * 0.3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
        ctx.stroke();

        // Trailing ring 1
        if (radius > 15) {
          ctx.lineWidth = Math.max(1, 1 + r.intensity * 3);
          ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${fade * 0.35})`;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, radius * 0.82), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Trailing ring 2
        if (radius > 30) {
          ctx.lineWidth = Math.max(0.8, 0.8 + r.intensity * 2);
          ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${fade * 0.2})`;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, radius * 0.65), 0, Math.PI * 2);
          ctx.stroke();
        }

        // push nodes at the wavefront + spawn secondary ripples
        for (const n of nodes) {
          const dx = n.ox - cx;
          const dy = n.oy - cy;
          const d = Math.hypot(dx, dy) || 1;
          const band = Math.abs(d - radius);
          const width = 22 + r.intensity * 60;
          if (band < width) {
            const f = (1 - band / width) * strength * fade;
            const dir = r.kind === "virtue" ? 1 : -1;
            n.vx += (dx / d) * f * 0.9 * dir;
            n.vy += (dy / d) * f * 0.9 * dir;
            if (r.kind === "vice") {
              n.vx += (Math.random() - 0.5) * f * r.intensity * 10;
              n.vy += (Math.random() - 0.5) * f * r.intensity * 10;
            }
            const target = r.kind === "virtue" ? 1 : -1;
            n.charge += (target - n.charge) * Math.min(1, f * 0.5);

            // Spawn secondary ripple from important charged nodes (cascading effect)
            if (
              life < 0.7 &&
              secondaryRef.current.length < 25 &&
              n.importance > 0.4 &&
              Math.abs(n.charge) > 0.2 &&
              Math.random() < 0.004
            ) {
              secondaryRef.current.push({
                x: n.ox,
                y: n.oy,
                kind: r.kind,
                start: now + 80 + Math.random() * 250,
              });
            }
          }
        }
      }

      // Render secondary ripples (cascading effect — people affect others)
      const secondary = secondaryRef.current;
      secondaryRef.current = secondary.filter((r) => now < r.start + 700);
      for (const r of secondaryRef.current) {
        if (now < r.start) continue;
        const life = (now - r.start) / 700;
        if (life >= 1) continue;
        const radius = life * 35;
        const fade = Math.max(0, 1 - life);
        const color = r.kind === "virtue" ? VIRTUE : VICE;

        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${fade * 0.4})`;
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(1, radius), 0, Math.PI * 2);
        ctx.stroke();

        // Small node push for nearby nodes
        for (const n of nodes) {
          const dx = n.ox - r.x;
          const dy = n.oy - r.y;
          const d = Math.hypot(dx, dy);
          if (d > radius + 12 || d < 1) continue;
          const band = Math.abs(d - radius);
          if (band < 10) {
            const f = (1 - band / 10) * fade * 0.12;
            const dir = r.kind === "virtue" ? 1 : -1;
            n.vx += (dx / d) * f * dir;
            n.vy += (dy / d) * f * dir;
            const target = r.kind === "virtue" ? 1 : -1;
            n.charge += (target - n.charge) * Math.min(1, f * 0.3);
          }
        }
      }

      // integrate + render nodes
      for (const n of nodes) {
        n.vx += (n.ox - n.x) * 0.06;
        n.vy += (n.oy - n.y) * 0.06;
        n.vx *= 0.9;
        n.vy *= 0.9;
        n.x += n.vx;
        n.y += n.vy;
        n.charge *= 0.994;

        const c = n.charge;
        const base: RGB = [128, 148, 168];
        const col =
          c >= 0 ? mix(base, VIRTUE, Math.min(1, c)) : mix(base, VICE, Math.min(1, -c));
        const a = 0.45 + Math.min(0.55, Math.abs(c) * 0.55);
        // Important nodes are bigger
        const size = Math.max(0.5, baseSize * (0.4 + n.importance * 1.6) + Math.abs(c) * 2.2);
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fill();
        if (Math.abs(c) > 0.35) {
          ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${Math.abs(c) * 0.1})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // centre origin marker
      ctx.fillStyle = "rgba(220,230,240,0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(220,230,240,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + Math.sin(now / 700) * 2, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [zoomLevel]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
