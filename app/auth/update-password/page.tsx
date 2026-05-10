import type { Metadata } from "next";

import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = {
  title: "Set new password | WorkKPI",
  description: "Complete password reset",
};

export default function UpdatePasswordPage() {
  return (
    <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Recovery</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Set a new password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Choose a new password to finish the reset flow and return to the dashboard.
      </p>
      <div className="mt-8">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}