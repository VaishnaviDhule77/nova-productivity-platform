"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={logout} disabled={loading} className="btn-ghost px-3.5 py-1.5 text-xs">
      {loading ? "…" : "Log out"}
    </button>
  );
}