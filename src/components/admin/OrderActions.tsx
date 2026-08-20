"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Per-order actions.
 *
 * Both of these are safe to press twice. "Re-check" re-asks Razorpay and
 * applies whatever it says through the same idempotent path the webhook uses;
 * "Resend receipt" re-sends an email that has already been sent once. Neither
 * can create or alter a payment, which is why neither needs a confirmation
 * dialog.
 */
export default function OrderActions({
  orderRef,
  hasMembership,
}: {
  orderRef: string;
  hasMembership: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"recheck" | "resend" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const call = async (action: "recheck-order" | "resend-receipt", kind: "recheck" | "resend") => {
    setBusy(kind);
    setNote(null);

    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ref: orderRef }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
      };

      if (!res.ok || data.ok !== true) {
        setNote(data.error ?? "Failed.");
        return;
      }

      setNote(kind === "recheck" ? `Razorpay says: ${data.status}` : "Receipt sent.");
      if (kind === "recheck") router.refresh();
    } catch {
      setNote("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 6, minWidth: 130 }}>
      <button
        className="adm-btn ghost"
        type="button"
        onClick={() => call("recheck-order", "recheck")}
        disabled={busy !== null}
      >
        {busy === "recheck" ? "Checking…" : "Re-check"}
      </button>

      {hasMembership && (
        <button
          className="adm-btn ghost"
          type="button"
          onClick={() => call("resend-receipt", "resend")}
          disabled={busy !== null}
        >
          {busy === "resend" ? "Sending…" : "Resend receipt"}
        </button>
      )}

      {note && (
        <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>{note}</span>
      )}
    </div>
  );
}
