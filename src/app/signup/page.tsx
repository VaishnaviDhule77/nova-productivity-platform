import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Starfield } from "@/components/starfield";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0E0E16] p-10 lg:flex">
        <Starfield density={110} />
        <Link href="/" className="f-display relative z-10 text-xl font-semibold tracking-tight">
          NOVA<span className="text-[#FFB454]">✦</span>
        </Link>
        <div className="relative z-10">
          <p className="meta">New member</p>
          <h1 className="f-display mt-4 max-w-md text-5xl font-semibold leading-[1.05] tracking-tight">
            Start something<br />worth <span className="text-[#FFB454]">finishing.</span>
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
          <h1 className="f-display mt-6 text-3xl font-semibold tracking-tight lg:mt-0">Create account</h1>
          <p className="f-mono mt-1.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Draft your first project in minutes
          </p>
          <div className="surface mt-6 p-6">
            <AuthForm mode="signup" />
          </div>
          <p className="mt-5 text-center text-sm text-zinc-400">
            Already registered?{" "}
            <Link href="/login" className="link-u font-semibold text-zinc-200">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}