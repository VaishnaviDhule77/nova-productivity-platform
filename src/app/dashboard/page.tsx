import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Header } from "@/components/header";
import DashboardBody from "./dashboard-body";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header user={user} />
      <Suspense fallback={<BodySkeleton />}>
        <DashboardBody user={user} />
      </Suspense>
    </>
  );
}

function BodySkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="skel h-3 w-40" />
      <div className="skel mt-4 h-14 w-80 max-w-full" />
      <div className="skel mt-3 h-11 max-w-sm" />
      <div className="skel mt-10 h-[420px] w-full" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skel h-16" />)}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <div className="skel h-44" />
          <div className="skel h-64" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skel h-16" />)}
        </div>
      </div>
    </main>
  );
}