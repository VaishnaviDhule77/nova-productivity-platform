"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ to, suffix = "", duration = 1100, className = "" }: {
  to: number; suffix?: string; duration?: number; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          let raf = 0;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  return <span ref={ref} className={className}>{n}{suffix}</span>;
}