"use client";

import { useState } from "react";
import { StatusPill } from "./ui";

/**
 * One enquiry, expandable.
 *
 * The row shows what you scan by; the expanded panel holds the message and the
 * two fields the team can actually change - triage status and internal notes.
 * Nothing the enquirer submitted is editable here; if their details are wrong,
 * that is a conversation, not a silent correction to the record.
 */

export type EnquiryView = {
  id: string;
  kind: string;
  name: string;
  email: string;
  organization: string;
  phone: string | null;
  role: string | null;
  city: string | null;
  teamSize: string | null;
  interest: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

const STATUSES = ["new", "contacted", "qualified", "won", "closed"];

export default function EnquiryRow({ enquiry }: { enquiry: EnquiryView }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(enquiry.status);
  const [notes, setNotes] = useState(enquiry.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "update-enquiry", id: enquiry.id, status, notes }),
      });

      if (!res.ok) {
        setError("Couldn't save. Try again.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <tr onClick={() => setOpen((v) => !v)} style={{ cursor: "pointer" }}>
        <td className="mono">{enquiry.createdAt}</td>
        <td>
          <span className="pill">{enquiry.kind === "institution" ? "Institution" : "Company"}</span>
        </td>
        <td className="wrap">{enquiry.name}</td>
        <td className="wrap">{enquiry.organization}</td>
        <td className="wrap">
          <a href={`mailto:${enquiry.email}`} onClick={(e) => e.stopPropagation()}>
            {enquiry.email}
          </a>
          {enquiry.phone && (
            <>
              <br />
              <span style={{ color: "var(--ink-faint)" }}>{enquiry.phone}</span>
            </>
          )}
        </td>
        <td className="wrap">{enquiry.interest ?? "-"}</td>
        <td>
          <StatusPill status={status} />
        </td>
        <td className="wrap" style={{ color: "var(--ink-faint)" }}>
          {notes ? `${notes.slice(0, 40)}${notes.length > 40 ? "…" : ""}` : "—"}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={8} style={{ background: "var(--paper-2)" }}>
            <div style={{ display: "grid", gap: 18, maxWidth: 880 }}>
              <dl className="rc-rows" style={{ margin: 0 }}>
                <Row k="Role" v={enquiry.role} />
                <Row k="City" v={enquiry.city} />
                <Row k="Team size" v={enquiry.teamSize} />
                <Row k="Message" v={enquiry.message} />
              </dl>

              <div className="adm-tools" style={{ margin: 0, alignItems: "flex-end" }}>
                <div className="field">
                  <label htmlFor={`s-${enquiry.id}`}>Status</label>
                  <select
                    id={`s-${enquiry.id}`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ flex: 1, minWidth: 260 }}>
                  <label htmlFor={`n-${enquiry.id}`}>Internal notes</label>
                  <input
                    id={`n-${enquiry.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What happened on the call, next step, owner…"
                  />
                </div>

                <button className="adm-btn" type="button" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>

                {saved && <span style={{ color: "var(--seed)", fontSize: "0.82rem" }}>Saved</span>}
                {error && <span style={{ color: "var(--proven)", fontSize: "0.82rem" }}>{error}</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  if (!v) return null;
  return (
    <div className="rc-row">
      <dt>{k}</dt>
      <dd style={{ whiteSpace: "pre-wrap" }}>{v}</dd>
    </div>
  );
}
