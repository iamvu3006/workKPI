"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return;
    }

    startTransition(() => {
      router.replace("/auth/login");
      router.refresh();
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <span className="text-sm text-slate-600">Sign out now?</span>
        <Button type="button" size="sm" variant="destructive" className="rounded-full" onClick={handleSignOut} disabled={isPending}>
          {isPending ? "Signing out..." : "Yes, sign out"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setShowConfirm(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="lg" variant="outline" className="rounded-full px-6" onClick={() => setShowConfirm(true)}>
      Sign out
    </Button>
  );
}