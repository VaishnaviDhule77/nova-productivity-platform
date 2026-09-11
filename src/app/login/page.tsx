import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Starfield } from "@/components/starfield";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0E0E16] p-10 lg:flex">
        <Starfield density={110} />
        <Link href="/" className="f-display relative z-10 text-xl font-semibold tracking-tight">
          NOVA<span className="text-[#FFB454]">✦</span>
        </Link>
        <div className="relative z-10">
          <p className="meta">Member access</p>
          <h1 className="f-display mt-4 max-w-md text-5xl font-semibold leading-[1.05] tracking-tight">
            Your cosmos<br />is <span className="text-[#FFB454]">waiting.</span>
          </h1>
        </div>
        <p className="f-mono relative z-10 text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          NOVA — Plan · Collaborate · Deliver
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="f-display text-xl font-semibold tracking-tight lg:hidden">
            NOVA<span className="text-[#FFB454]">✦</span>
          </Link>
          <h1 className="f-display mt-6 text-3xl font-semibold tracking-tight lg:mt-0">Log in</h1>
          <p className="f-mono mt-1.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Resume where your team left off
          </p>
          <div className="surface mt-6 p-6">
            <AuthForm mode="login" />
            <p className="f-mono mt-4 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] p-2 text-center text-[10px] uppercase tracking-wider text-zinc-500">
              Demo — alice@nova.app / password123
            </p>
          </div>
          <p className="mt-5 text-center text-sm text-zinc-400">
            New here?{" "}
            <Link href="/signup" className="link-u font-semibold text-zinc-200">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}