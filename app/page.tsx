import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)] px-6 py-12 text-slate-950 sm:px-10 lg:px-12">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <section className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Sprint 1 auth foundation
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Secure access first, so every later feature inherits the right guardrails.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            WorkKPI is being wired with Supabase Auth, protected routes, session safety, and a
            clean recovery flow before any broader product surface lands.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6 shadow-lg shadow-slate-900/10">
              <Link href="/auth/login">Open sign in</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            {[
              ["Email + password", "Primary auth flow for sprint 1"],
              ["Session guard", "Protected dashboard entry point"],
              ["Recovery path", "Password reset and relogin"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div>
              </div>
            ))}
          </div>
        </section>
        <aside className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">What lands in sprint 1</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <li>• Email/password login and logout</li>
                <li>• Session-aware redirect to protected dashboard</li>
                <li>• Password reset entry point</li>
                <li>• Clear failure states for disabled or locked accounts</li>
              </ul>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              This shell is intentionally small so Sprint 1 can focus on the authentication spine before
              user management and audit flows are layered in.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
