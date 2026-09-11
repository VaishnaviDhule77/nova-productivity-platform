"use client";

import { useEffect, useRef, useState } from "react";

export function Delivered({ pct }: { pct: number }) {
  const prev = useRef<number | null>(null);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (prev.current !== null && prev.current < 100 && pct === 100) setBurst((b) => b + 1);
    prev.current = pct;
  }, [pct]);

  if (pct < 100) return null;

  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFB454]/50 bg-[#FFB454]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-[#FFB454] shadow-[0_0_28px_rgba(255,180,84,0.3)]">
        ✳ Delivered
      </span>
      <ConfettiBurst trigger={burst} />
    </>
  );
}

function ConfettiBurst({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const maybeCanvas = ref.current;
    if (maybeCanvas === null) return;
    const maybeCtx = maybeCanvas.getContext("2d");
    if (maybeCtx === null) return;

    // Non-null aliases — safe inside the animation function below
    const canvasEl: HTMLCanvasElement = maybeCanvas;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvasEl.width = W * dpr;
    canvasEl.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#FFB454", "#FFE3B3", "#5BC98F", "#EDEDF7"];
    const parts = Array.from({ length: 110 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 160,
      y: H * 0.32,
      vx: (Math.random() - 0.5) * 10,
      vy: -(4 + Math.random() * 8),
      g: 0.16 + Math.random() * 0.08,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      w: 4 + Math.random() * 5,
      h: 3 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));

    const t0 = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const life = Math.max(0, 1 - (t - t0) / 1500);
      ctx.clearRect(0, 0, W, H);
      if (life <= 0) return;
      for (const p of parts) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />;
}