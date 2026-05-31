"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { loginSchema } from "@/lib/auth/validation";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    // Validate input client-side
    const validationResult = loginSchema.safeParse({
      email,
      password,
      rememberDevice,
    });

    if (!validationResult.success) {
      const emailError = validationResult.error.flatten().fieldErrors.email?.[0];
      const passwordError = validationResult.error.flatten().fieldErrors.password?.[0];
      setErrorMessage(emailError || passwordError || "Nhập đúng định dạng email và mật khẩu công ty.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);

    const redirectTo = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(`Google sign-in failed: ${error.message}`);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSignIn} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-slate-300">
            Email công việc
          </label>
          <div className="relative group">
            {/* Inline Email Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors duration-200 group-focus-within:text-teal-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-teal-500/80 focus:ring-4 focus:ring-teal-500/10 focus:bg-slate-950/80"
              placeholder="ten.nhanvien@congty.com"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-slate-300">
            Mật khẩu
          </label>
          <div className="relative group">
            {/* Inline Lock Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors duration-200 group-focus-within:text-teal-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-teal-500/80 focus:ring-4 focus:ring-teal-500/10 focus:bg-slate-950/80"
              placeholder="••••••••"
              required
            />
            {/* Show/Hide Password Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-teal-400 outline-none transition-colors duration-150"
              title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4.5 w-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4.5 w-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error Message Box */}
        {errorMessage ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs leading-normal text-rose-400 animate-in fade-in slide-in-from-top-1 duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4.5 w-4.5 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1 select-none">
          <label className="inline-flex items-center gap-2.5 cursor-pointer group text-slate-400 hover:text-slate-300 transition-colors">
            {/* Hidden native checkbox */}
            <input
              type="checkbox"
              className="sr-only"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
            />
            {/* Custom styled checkbox */}
            <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
              rememberDevice 
                ? "border-teal-500 bg-teal-500 text-slate-950" 
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}>
              {rememberDevice && (
                <svg className="h-3 w-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span>Nhớ thiết bị này (30 ngày)</span>
          </label>

          <Link 
            href="/auth/forgot-password" 
            className="font-semibold text-teal-400 hover:text-teal-300 underline decoration-teal-400/20 underline-offset-4 transition"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-bold text-slate-950 hover:shadow-[0_0_20px_rgba(20,184,166,0.25)] transition duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
            disabled={isPending}
          >
            {isPending ? (
              <>
                {/* Spinner */}
                <svg className="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang xử lý...</span>
              </>
            ) : (
              "Đăng nhập hệ thống"
            )}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800/80"></div>
        </div>
        <span className="relative bg-[#0d1527] px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          Hoặc tiếp tục với
        </span>
      </div>

      {/* Google SSO Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 hover:border-slate-700 text-sm font-semibold text-slate-200 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group"
      >
        {/* Google Icon */}
        <svg className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 0, 0)">
            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1l3.12,2.42c1.85,-1.7 2.92,-4.2 2.92,-7.13c0,-0.74 -0.07,-1.4 -0.2,-2.09Z" fill="#4285F4" />
            <path d="M12,20.6c2.42,0 4.45,-0.8 5.93,-2.18l-3.12,-2.42c-0.87,0.59 -1.98,0.94 -2.81,0.94c-2.16,0 -4.01,-1.46 -4.66,-3.43L4.12,16.03c1.47,2.72 4.29,4.57 7.88,4.57Z" fill="#34A853" />
            <path d="M7.34,13.51c-0.17,-0.5 -0.27,-1.03 -0.27,-1.51c0,-0.48 0.1,-1.01 0.27,-1.51L4.22,8.07C3.52,9.39 3.12,10.9 3.12,12c0,1.1 0.4,2.61 1.1,3.93l3.12,-2.42Z" fill="#FBBC05" />
            <path d="M12,6.4c1.31,0 2.49,0.45 3.42,1.34l2.56,-2.56C16.42,3.74 14.39,3.1 12,3.1c-3.59,0 -6.41,1.85 -7.88,4.57l3.22,2.42c0.65,-1.97 2.5,-3.43 4.66,-3.43Z" fill="#EA4335" />
          </g>
        </svg>
        <span>Đăng nhập bằng Google</span>
      </Button>
    </div>
  );
}