"use client";

import { useEffect, useRef } from "react";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");

    let x = -100, y = -100, rx = -100, ry = -100, s = 1, targetScale = 1, raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      targetScale = t && t.closest("a, button, [role='button'], input, select, textarea, label, summary, [data-cursor]") ? 1.7 : 1;
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      s += (targetScale - s) * 0.18;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-8 w-8 rounded-full border border-[#FFB454]/60"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-[#FFB454]"
      />
    </>
  );
}