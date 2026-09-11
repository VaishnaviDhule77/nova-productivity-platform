"use client";

import { useEffect, useRef } from "react";

export function Starfield({ density = 130, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const maybeCanvas = ref.current;
    if (maybeCanvas === null) return;
    const maybeCtx = maybeCanvas.getContext("2d");
    if (maybeCtx === null) return;

    // Non-null aliases — safe to use inside every function below
    const canvasEl: HTMLCanvasElement = maybeCanvas;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    const mouse = { x: 0, y: 0 };

    type Star = { x: number; y: number; z: number; r: number; base: number; ph: number; sp: number; vy: number; amber: boolean };
    const stars: Star[] = [];

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvasEl.width = w * dpr; canvasEl.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars.length = 0;
      for (let i = 0; i < density; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          z: 0.3 + Math.random() * 0.7,
          r: 0.4 + Math.random() * 1.1,
          base: 0.25 + Math.random() * 0.55,
          ph: Math.random() * Math.PI * 2,
          sp: 0.4 + Math.random() * 1.2,
          vy: 0.02 + Math.random() * 0.05,
          amber: Math.random() < 0.08,
        });
      }
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvasEl);

    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += s.vy;
        if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
        const tw = reduced ? 1 : 0.7 + 0.3 * Math.sin(t / 1000 * s.sp + s.ph);
        ctx.globalAlpha = s.base * tw;
        ctx.fillStyle = s.amber ? "#FFB454" : "#EDEDF7";
        ctx.beginPath();
        ctx.arc(s.x + mouse.x * 18 * s.z, s.y + mouse.y * 12 * s.z, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (reduced) {
      draw(0);
    } else {
      const loop = (t: number) => { draw(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouse);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}