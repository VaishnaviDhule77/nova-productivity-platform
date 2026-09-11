"use client";

import { useRef, useState } from "react";

export function Magnetic({ children, className = "", strength = 0.22 }: {
  children: React.ReactNode; className?: string; strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  }
  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseMove={onMove}
      onMouseLeave={() => { onLeave(); setHover(false); }}
      className={`inline-block will-change-transform ${className}`}
      style={{
        transition: hover
          ? "transform 0.12s ease-out"
          : "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {children}
    </div>
  );
}