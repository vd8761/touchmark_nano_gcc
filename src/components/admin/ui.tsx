/**
 * Small presentational bits shared by the admin tables.
 *
 * Kept out of the page files on purpose: Next reserves the export surface of
 * `page.tsx` for its own conventions, so shared helpers live here.
 */

const TONES: Record<string, string> = {
  paid: "ok",
  active: "ok",
  delivered: "ok",
  sent: "ok",
  won: "ok",
  qualified: "ok",
  failed: "warn",
  bounced: "warn",
  complained: "warn",
  abandoned: "mute",
  expired: "mute",
  cancelled: "mute",
  closed: "mute",
};

export function StatusPill({ status }: { status: string }) {
  const tone = TONES[status] ?? "";
  return <span className={tone ? `pill ${tone}` : "pill"}>{status}</span>;
}

/** All admin timestamps are shown in IST - the team reads them from Chennai. */
export function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-scroll">
      <p className="adm-empty">{children}</p>
    </div>
  );
}
