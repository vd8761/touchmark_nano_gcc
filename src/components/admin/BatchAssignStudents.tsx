"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  batchId: string;
  studentId: string;
  action: "assign" | "remove";
  label: string;
}

export default function BatchAssignStudents({ batchId, studentId, action, label }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    const res = await fetch("/api/admin/batch-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        batchId: action === "assign" ? batchId : null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Failed. Please try again.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{
          padding: "4px 12px",
          borderRadius: 6,
          border: "none",
          cursor: isPending ? "wait" : "pointer",
          fontWeight: 600,
          fontSize: "0.8rem",
          fontFamily: "inherit",
          background: action === "assign" ? "#3B82F6" : "#FEE2E2",
          color: action === "assign" ? "#fff" : "#991B1B",
          opacity: isPending ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {isPending ? "..." : label}
      </button>
      {error && (
        <div style={{ color: "#DC2626", fontSize: "0.75rem", marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}
