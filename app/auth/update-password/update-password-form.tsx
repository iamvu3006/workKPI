"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (password !== confirmPassword) {
      setFeedback("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setFeedback(error.message);
      return;
    }

    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          placeholder="At least 8 characters"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          placeholder="Repeat the new password"
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
      {feedback ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          {feedback}
        </div>
      ) : null}
    </form>
  );
}