"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@team.com" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
      </div>
      {error && (
        <p className="rounded-lg border border-[#FF7A6B]/30 bg-[#FF7A6B]/[0.07] px-3 py-2 text-sm font-medium text-[#FF7A6B]">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Please wait…" : mode === "login" ? "Log in →" : "Create account →"}
      </button>
    </form>
  );
}