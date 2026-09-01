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
};

type Ripple = {
  kind: ActionKind;
  intensity: number;
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
  const lastRippleId = useRef<number>(-1);
  const zoomRef = useRef(zoomLevel);
  zoomRef.current = zoomLevel;

  useEffect(() => {
    if (!ripple || ripple.id === lastRippleId.current) return;
    lastRippleId.current = ripple.id;
    if (ripple.id === 0) {
      // reset signal
      ripplesRef.current = [];
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
      // Zoom out: more divisions (denser grid) at higher influence
      const divisions = 12 + z * 38; // 12 at tier 0 → 50 at top tier
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
          nodes.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, charge: 0 });
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
      // Dots shrink as we zoom out (wider view of society)
      const baseSize = 2.6 - z * 1.9; // 2.6 at tier 0 → 0.7 at top tier

      // prune finished ripples
      ripplesRef.current = ripples.filter((r) => now - r.start < 2600 + r.intensity * 1800);

      for (const r of ripplesRef.current) {
        const life = (now - r.start) / (1800 + r.intensity * 1600);
        const radius = life * maxR * (0.55 + r.intensity * 0.75);
        const fade = Math.max(0, 1 - life);
        const strength = 0.25 + r.intensity * 1.6;
        const color = r.kind === "virtue" ? mix(VIRTUE, GOLD, r.intensity) : VICE;

        // ripple ring — always visible, thicker at high intensity
        ctx.lineWidth = Math.max(1.5, 1.5 + r.intensity * 8);
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${fade * (0.55 + r.intensity * 0.45)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
        ctx.stroke();

        // trailing inner ring for dramatic effect at all intensities
        if (radius > 20) {
          const innerR = radius * 0.72;
          ctx.lineWidth = Math.max(1, 1 + r.intensity * 4);
          ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${fade * 0.3 * (0.4 + r.intensity * 0.6)})`;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, innerR), 0, Math.PI * 2);
          ctx.stroke();
        }

        if (r.intensity > 0.5) {
          const g = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius);
          g.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0)`);
          g.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},${fade * 0.3 * r.intensity})`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // push nodes at the wavefront
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
        const size = Math.max(0.5, baseSize + Math.abs(c) * 2.2);
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
