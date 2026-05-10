"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

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
      setErrorMessage(error.message);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          placeholder="you@company.com"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          placeholder="••••••••"
          required
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" className="h-11 flex-1 rounded-xl" disabled={isPending}>
          {isPending ? "Đang mở dashboard..." : "Đăng nhập"}
        </Button>
        <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={handleGoogleSignIn}>
          Đăng nhập bằng Google
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
          Nhớ thiết bị này
        </label>
        <Link href="/auth/forgot-password" className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-4">
          Quên mật khẩu?
        </Link>
      </div>
    </form>
  );
}