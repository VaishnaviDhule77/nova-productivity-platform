import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project, Membership } from "@/lib/models";
import { Header } from "@/components/header";
import { ProjectSettings } from "@/components/project-settings";
import BoardBody from "./board-body";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  await connectDB();

  if (!mongoose.isValidObjectId(params.id)) notFound();

  const membership = await Membership.findOne({ userId: user.id, projectId: params.id });
  if (!membership) notFound();

  const project = await Project.findById(params.id);
  if (!project) notFound();

  const isOwner = membership.role === "OWNER";

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="f-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-[#FFB454]"
          >
            ← Cosmos
          </Link>
          {isOwner && (
            <ProjectSettings
              project={{ id: String(project._id), name: project.name, description: project.description ?? null }}
            />
          )}
        </div>

        <div className="mt-5 flex items-start gap-4">
          <span className="mt-3 h-3 w-3 shrink-0 rotate-45" style={{ backgroundColor: project.color }} />
          <div className="min-w-0">
            <p className="meta">Project file</p>
            <h1 className="f-display mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-tight tracking-[-0.02em]">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{project.description}</p>
            )}
          </div>
        </div>

        <Suspense fallback={<SectionSkeleton />}>
          <BoardBody projectId={params.id} isOwner={isOwner} ownerId={String(project.ownerId)} />
        </Suspense>
      </main>
    </>
  );
}

function SectionSkeleton() {
  return (
    <>
      <div className="mt-10 flex justify-end pr-6"><div className="skel h-[118px] w-[118px] rounded-full" /></div>
      <div className="skel mt-0 h-40 w-full" />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr]">
        <div className="skel h-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skel h-64" />)}
        </div>
      </div>
    </>
  );
}