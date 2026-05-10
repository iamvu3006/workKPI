import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | WorkKPI",
  description: "Sign in to WorkKPI",
};

export default function LoginPage() {
  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden bg-slate-950 px-8 py-10 text-white sm:px-10 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.28),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_26%)]" />
        <div className="relative">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">WorkKPI</p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
            Sign in with a controlled auth flow, not a loose form.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
            Sprint 1 focuses on secure login, session handling, and clear error states so the rest of
            the app can build on a stable identity layer.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Email/password and Google entry points</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Protected route redirect after sign in</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Password reset recovery path</div>
          </div>
          <div className="mt-8 text-sm text-slate-300">
            Need to go back? <Link href="/" className="font-medium text-white underline decoration-white/40 underline-offset-4">Return to landing</Link>
          </div>
        </div>
      </section>
      <section className="bg-white px-6 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto flex h-full max-w-md flex-col justify-center">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Log in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your company email to access the authenticated WorkKPI shell.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}