import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Authenticated session</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Signed in as {user.email ?? "a verified user"}. This page is protected by Supabase SSR.
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Auth state", "Session is hydrated from secure cookies and refreshed by middleware."],
            ["Sprint 1 focus", "Login, logout, reset password, and session protection come first."],
            ["Next step", "Wire user identity, role redirect, and account security policies."],
          ].map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}