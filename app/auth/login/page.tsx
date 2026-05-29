import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | WorkKPI",
  description: "Sign in to the WorkKPI enterprise platform",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-[380px] overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/60 backdrop-blur-3xl shadow-[0_32px_100px_-20px_rgba(0,0,0,0.8)]">
      {/* Login Interaction Form */}
      <section className="px-5 py-8 sm:px-7 sm:py-9">
        {/* Centered Welcome Header */}
        <div className="mb-6.5 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-400">
            Welcome back
          </span>
          <h2 className="mt-1.5 text-2.5xl font-extrabold tracking-tight text-white">
            Đăng nhập tài khoản
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-450">
            Sử dụng email doanh nghiệp được cấp để truy cập vào hệ thống làm việc.
          </p>
        </div>

        {/* Login Form component */}
        <LoginForm />

        {/* Back to landing link */}
        <div className="mt-5.5 text-center text-[11px] text-slate-500 border-t border-slate-800/50 pt-3.5">
          Quay lại trang chủ?{" "}
          <Link
            href="/"
            className="font-semibold text-teal-400 hover:text-teal-300 underline decoration-teal-400/20 underline-offset-4 transition"
          >
            Trở về Landing Page
          </Link>
        </div>
      </section>
    </div>
  );
}