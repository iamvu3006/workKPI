"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/read-all", { method: "PATCH" });
      const json = await response.json();

      if (json.success) {
        startTransition(() => {
          router.refresh();
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="default" onClick={handleClick} disabled={loading || isPending}>
      {loading || isPending ? "Đang cập nhật..." : "Đánh dấu tất cả đã đọc"}
    </Button>
  );
}