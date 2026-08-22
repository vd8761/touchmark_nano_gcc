"use client";

import { useState, type FormEvent } from "react";
import type { Settings } from "@/lib/settings";

/**
 * Mail-routing settings.
 *
 * One save posts the whole form as one `update-settings` action - there is no
 * per-field autosave, so a half-edited form can't leave the site sending from
 * a broken half-configured state.
 */
export default function SettingsForm({ initial }: { initial: Settings }) {
  const [adminNotifyEmails, setAdminNotifyEmails] = useState(initial.adminNotifyEmails.join("\n"));
  const [fromName, setFromName] = useState(initial.fromName ?? "");
  const [fromEmail, setFromEmail] = useState(initial.fromEmail ?? "");
  const [replyTo, setReplyTo] = useState(initial.replyTo ?? "");
  const [cc, setCc] = useState(initial.cc.join("\n"));
  const [bcc, setBcc] = useState(initial.bcc.join("\n"));
  const [notifyAdminEnquiry, setNotifyAdminEnquiry] = useState(initial.notifyAdminEnquiry);
  const [notifyAdminPayment, setNotifyAdminPayment] = useState(initial.notifyAdminPayment);
  const [sendUserCopy, setSendUserCopy] = useState(initial.sendUserCopy);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

  const call = async (
    action: "update-settings" | "send-test-notification",
    extra: Record<string, unknown> = {},
  ) => {
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Something went wrong.");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setNote(null);

    try {
      await call("update-settings", {
        adminNotifyEmails,
        fromName,
        fromEmail,
        replyTo,
        cc,
        bcc,
        notifyAdminEnquiry,
        notifyAdminPayment,
        sendUserCopy,
      });
      setNote({ text: "Saved.", tone: "ok" });
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : "Couldn't save.", tone: "err" });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setNote(null);

    try {
      await call("send-test-notification");
      setNote({ text: "Test notification sent - check the recipients above.", tone: "ok" });
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : "Couldn't send.", tone: "err" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="adm-settings" style={{ maxWidth: 640 }}>
      <Section
        title="Admin notifications"
        hint="Who hears about a new enquiry or a completed payment, and which of those two categories are on."
      >
        <div className="field">
          <label htmlFor="adminNotifyEmails">Notify these addresses</label>
          <textarea
            id="adminNotifyEmails"
            value={adminNotifyEmails}
            onChange={(e) => setAdminNotifyEmails(e.target.value)}
            placeholder="one@company.com, another@company.com"
            rows={3}
          />
        </div>

        <Toggle
          id="notifyAdminEnquiry"
          checked={notifyAdminEnquiry}
          onChange={setNotifyAdminEnquiry}
          label="Notify on new enquiries"
        />
        <Toggle
          id="notifyAdminPayment"
          checked={notifyAdminPayment}
          onChange={setNotifyAdminPayment}
          label="Notify on completed payments"
        />
      </Section>

      <Section
        title="Sender identity"
        hint="Applies to every outbound email - admin notifications and buyer/enquirer mail alike. The from address must be on a domain verified in Resend, or delivery bounces."
      >
        <div className="field-row">
          <div className="field">
            <label htmlFor="fromName">From name</label>
            <input id="fromName" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="DOS Club" />
          </div>
          <div className="field">
            <label htmlFor="fromEmail">From address</label>
            <input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="membership@touchmarkdes.com"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="replyTo">Reply-to</label>
          <input
            id="replyTo"
            type="email"
            value={replyTo}
            onChange={(e) => setReplyTo(e.target.value)}
            placeholder="Leave blank to reply to the from address"
          />
        </div>
      </Section>

      <Section
        title="CC / BCC"
        hint="Applied to admin notifications only - never to a buyer's or enquirer's own copy, so their address is never visible to anyone else on the thread."
      >
        <div className="field-row">
          <div className="field">
            <label htmlFor="cc">CC</label>
            <textarea id="cc" value={cc} onChange={(e) => setCc(e.target.value)} rows={2} />
          </div>
          <div className="field">
            <label htmlFor="bcc">BCC</label>
            <textarea id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} rows={2} />
          </div>
        </div>
      </Section>

      <Section
        title="Buyer &amp; enquirer copies"
        hint="Whether the person who submitted the form or paid also gets their own confirmation email. Turning this off does not affect admin notifications above."
      >
        <Toggle
          id="sendUserCopy"
          checked={sendUserCopy}
          onChange={setSendUserCopy}
          label="Send confirmation / receipt emails to the buyer or enquirer"
        />
        {!sendUserCopy && (
          <p className="form-note">
            <strong>Off:</strong> enquirers won&rsquo;t get an acknowledgement, and paid members
            won&rsquo;t get a receipt automatically. You can still send a receipt by hand from the{" "}
            Payments page. Turning this back on does not retroactively email anyone who missed one
            while it was off &mdash; the daily cron sweep only catches receipts, not enquiry
            acknowledgements.
          </p>
        )}
      </Section>

      {note && <p className={note.tone === "ok" ? "form-note ok" : "form-note"}>{note.text}</p>}

      <div className="acts" style={{ marginTop: 8 }}>
        <button className="adm-btn" type="submit" disabled={saving || testing}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button className="adm-btn ghost" type="button" onClick={sendTest} disabled={saving || testing}>
          {testing ? "Sending…" : "Send test notification"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="adm-settings-section">
      <legend>{title}</legend>
      <p className="adm-sub" style={{ margin: "0 0 16px", fontSize: "0.82rem" }}>
        {hint}
      </p>
      {children}
    </fieldset>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="adm-toggle">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
