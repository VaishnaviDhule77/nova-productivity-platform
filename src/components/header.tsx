"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { initials, avatarColor } from "@/lib/utils";

export function Header({ user }: { user: { name: string; email: string } }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#0B0B12]/75 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="f-display text-lg font-semibold tracking-tight">
          NOVA<span className="text-[#FFB454]">✦</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="f-mono hidden text-[10px] uppercase tracking-[0.18em] text-zinc-500 sm:block">
            {user.name}
          </span>
          <span className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold ${avatarColor(user.name)}`}>
            {initials(user.name)}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}