"use client";

import { useEffect, useState } from "react";

export function Gauge({ value, color = "#FFB454", size = 128, caption }: {
  value: number; color?: string; size?: number; caption?: string;
}) {
  const [on, setOn] = useState(false);
  const [n, setN] = useState(0);
  const r = 50;
  const C = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => setOn(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 1100, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={on ? C * (1 - value / 100) : C}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="f-display text-2xl font-semibold leading-none">
          {n}<span className="text-sm">%</span>
        </p>
        {caption && <p className="f-mono mt-1.5 text-[7px] uppercase tracking-[0.22em] text-zinc-500">{caption}</p>}
      </div>
    </div>
  );
}