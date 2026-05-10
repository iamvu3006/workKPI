import type { Metadata } from "next";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password | WorkKPI",
  description: "Request a password reset email",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Recovery</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Reset your password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        We’ll send a secure reset link to your email so you can set a new password and sign in again.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}