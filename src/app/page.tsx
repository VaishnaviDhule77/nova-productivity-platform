import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Starfield } from "@/components/starfield";
import { LiveBoard } from "@/components/live-board";
import { Tilt } from "@/components/tilt";
import { Magnetic } from "@/components/magnetic";
import { Reveal } from "@/components/reveal";

const WORDS = ["Plan", "Collaborate", "Deliver", "Constellations", "Deadlines", "Crew", "Progress", "Signals"];

const SPECS = [
  { n: "01", t: "Constellation map", d: "Projects, slips and people as one explorable graph. Hover to inspect — the sky dims around what matters." },
  { n: "02", t: "Command bar", d: "⌘K anywhere. Search projects and slips, jump straight to a task on the board. Fully keyboard-driven." },
  { n: "03", t: "Signals timeline", d: "Every creation and join, plotted on one connected line. Today pulses softly in amber." },
];

function Letters({ text, base = 0, className = "" }: { text: string; base?: number; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block animate-rise"
          style={{ animationDelay: `${base + i * 45}ms` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <main className="min-h-screen">
      <nav className="border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="f-display text-xl font-semibold tracking-tight">
            NOVA<span className="text-[#FFB454]">✦</span>
          </Link>
          <div className="flex items-center gap-6">
            {user ? (
              <Magnetic><Link href="/dashboard" className="btn-primary">Open dashboard</Link></Magnetic>
            ) : (
              <>
                <Link href="/login" className="link-u f-mono text-[11px] uppercase tracking-widest text-zinc-400">
                  Log in
                </Link>
                <Magnetic><Link href="/signup" className="btn-primary">Get started</Link></Magnetic>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        <Starfield density={150} />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <p className="meta animate-rise">
            <span className="mr-2 text-[#FFB454]">✦</span>Team productivity, quietly instrumented
          </p>
          <h1 className="f-display mt-6 text-[clamp(3.2rem,8vw,6.8rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
            <Letters text="Plan." base={150} />
            <br />
            <Letters text="Collaborate." base={450} />
            <br />
            <Letters text="Deliver." base={900} className="text-[#FFB454]" />
          </h1>
          <p className="mt-8 max-w-md animate-rise text-[15px] leading-relaxed text-zinc-400" style={{ animationDelay: "1.1s" }}>
            NOVA turns your team&apos;s work into a quiet cosmos — projects, tasks and
            people you can see, explore and move.
          </p>
          <div className="mt-9 flex animate-rise flex-wrap gap-4" style={{ animationDelay: "1.25s" }}>
            <Magnetic strength={0.28}>
              <Link href={user ? "/dashboard" : "/signup"} className="btn-primary px-7 py-3.5 text-sm">
                {user ? "Open your cosmos →" : "Start for free →"}
              </Link>
            </Magnetic>
            {!user && (
              <Link href="/login" className="btn-ghost px-7 py-3.5 text-sm">I have an account</Link>
            )}
          </div>
        </div>
        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center sm:flex">
          <span className="meta text-zinc-600">scroll</span>
          <span className="mt-2 block h-10 w-px overflow-hidden bg-white/10">
            <span className="animate-cue block h-3 w-px bg-[#FFB454]" />
          </span>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-white/[0.06] py-4" aria-hidden>
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {WORDS.map((w) => (
                <span key={`${dup}-${w}`} className="f-mono flex items-center text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
                  <span className="mx-7">{w}</span>
                  <span className="text-[#FFB454]">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCT PREVIEW */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="meta"><span className="mr-2 text-[#FFB454]">✦</span>The product</p>
          <h2 className="f-display mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            A board that<br />feels alive.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-zinc-400">
            This isn&apos;t a screenshot — it&apos;s NOVA. Drag a slip right now and
            watch the ring fill like a sunrise.
          </p>
          <ul className="mt-7 space-y-2.5">
            {["Drag slips between columns — live", "⌘K to jump anywhere, from anywhere", "Signals timeline keeps the crew aligned"].map((li) => (
              <li key={li} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="text-[#FFB454]">✳</span> {li}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={150} className="lg:col-span-7">
          <div className="relative">
            <div aria-hidden className="absolute -inset-8 rounded-[48px] bg-[#FFB454]/[0.04] blur-3xl" />
            <Tilt className="relative">
              <LiveBoard />
            </Tilt>
          </div>
        </Reveal>
      </section>

      {/* SPECS */}
      <Reveal>
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3">
            {SPECS.map((s, i) => (
              <div key={s.n} className={i === 1 ? "sm:mt-12" : ""}>
                <div className="border-t border-white/[0.12] pt-5">
                  <p className="f-mono text-[11px] font-semibold tracking-[0.25em] text-[#FFB454]">{s.n}</p>
                  <h3 className="f-display mt-3 text-2xl font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* STATEMENT */}
      <Reveal>
        <section className="relative overflow-hidden border-t border-white/[0.06] py-28 text-center">
          <Starfield density={60} />
          <div className="relative z-10 mx-auto max-w-3xl px-6">
            <p className="meta">The point</p>
            <p className="f-display mt-5 text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-snug tracking-tight">
              Calm enough to think in.
              <br />
              <span className="text-[#FFB454]">Precise enough to ship with.</span>
            </p>
            <Magnetic className="mt-10" strength={0.28}>
              <Link href={user ? "/dashboard" : "/signup"} className="btn-primary px-8 py-3.5 text-sm">
                {user ? "Open dashboard →" : "Claim your cosmos →"}
              </Link>
            </Magnetic>
          </div>
        </section>
      </Reveal>

      <footer className="relative overflow-hidden border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-10 sm:px-6">
          <p className="f-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            © 2025 NOVA — Plan · Collaborate · Deliver
          </p>
          <div className="f-mono flex items-center gap-5 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            <Link href="/login" className="link-u">Log in</Link>
            <Link href="/signup" className="link-u">Sign up</Link>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none mt-6 select-none overflow-hidden">
          <p className="f-display -mb-[0.14em] text-center text-[clamp(5rem,18vw,15rem)] font-semibold leading-[0.8] tracking-tight text-white/[0.03]">
            NOVA<span className="text-[#FFB454]/[0.05]">✦</span>
          </p>
        </div>
      </footer>
    </main>
  );
}