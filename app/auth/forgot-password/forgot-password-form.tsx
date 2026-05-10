"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setFeedback(error.message);
      return;
    }

    setFeedback("Check your inbox for the reset link.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="reset-email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          placeholder="you@company.com"
          required
        />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={isSubmitting}>
        {isSubmitting ? "Sending link..." : "Send reset link"}
      </Button>
      {feedback ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          {feedback}
        </div>
      ) : null}
    </form>
  );
}