"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatInr } from "@/lib/pricing";

/**
 * "Already a member? Check your membership status."
 *
 * Takes an email address *or* a reference ID. The two return different amounts
 * of detail on purpose - see the comment in
 * src/app/api/membership/lookup/route.ts. This component just renders whatever
 * the server decided it was safe to show.
 */

type Details = {
  memberNo: string;
  status: string;
  name?: string | null;
  institution: string | null;
  email: string;
  planName: string;
  orderRef: string | null;
  transactionId: string | null;
  paymentMethod?: string | null;
  purchasedAt: string;
  activatedAt?: string;
  validUntil: string | null;
  amountPaise: number;
  basePaise?: number;
  gstPaise?: number;
  gstRate?: number;
};

type Result = {
  found: boolean;
  mode: "ref" | "email";
  membership: Details | null;
  emailed?: boolean;
  orderStatus?: string;
  orderRef?: string;
};

export default function MembershipStatus() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  // Deep link from the receipt email: /contact/?tab=status&ref=DOS-...
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setQuery(ref);
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const value = query.trim();
    if (!value) {
      setError("Enter your email address or your reference ID.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    // One input, two meanings: anything shaped like our reference is treated
    // as one, everything else as an email. Saves the visitor a radio button.
    const isRef = /^dos-/i.test(value);

    try {
      const res = await fetch("/api/membership/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isRef ? { ref: value } : { email: value }),
      });

      const data = (await res.json().catch(() => ({}))) as Result & { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        setError(data.error ?? "We couldn't check that just now. Please try again in a moment.");
        return;
      }

      setResult(data);
    } catch {
      setError("We couldn't reach our server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="form-hint">
        Enter the email you registered with, or the reference ID from your receipt
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="f-lookup">Email address or reference ID</label>
            <input
              id="f-lookup"
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="you@institution.edu or DOS-XXXXXXXXXXXX"
              autoComplete="email"
              spellCheck={false}
            />
            {error && (
              <span className="field-error" role="alert">
                {error}
              </span>
            )}
          </div>
        </div>

        <div className="acts">
          <button className="act primary" type="submit" data-busy={busy} disabled={busy}>
            {busy ? (
              <>
                <span className="spin" aria-hidden="true" /> Checking
              </>
            ) : (
              <>Check membership status</>
            )}
          </button>
        </div>
      </form>

      {result && <Outcome result={result} />}
    </div>
  );
}

function Outcome({ result }: { result: Result }) {
  const { membership } = result;

  // Found, by reference: everything.
  if (membership && result.mode === "ref") {
    return (
      <div className="rc" style={{ marginTop: 30 }}>
        <span className="rc-badge">{membership.status === "active" ? "Active member" : membership.status}</span>
        <h3 className="rc-title">{membership.institution ?? membership.memberNo}</h3>
        <p className="rc-lede">Your DOS Club membership is on record. Here are the full details.</p>

        <dl className="rc-rows">
          <Row k="Membership number" v={membership.memberNo} mono />
          <Row k="Plan" v={membership.planName} />
          <Row k="Registered email" v={membership.email} />
          <Row k="Reference ID" v={membership.orderRef} mono />
          <Row k="Transaction ID" v={membership.transactionId} mono />
          <Row k="Payment method" v={membership.paymentMethod} />
          <Row k="Purchased" v={formatDate(membership.purchasedAt)} />
          <Row k="Amount paid" v={`${formatInr(membership.amountPaise)} (incl. GST)`} />
          {typeof membership.basePaise === "number" && (
            <Row k="Taxable value" v={formatInr(membership.basePaise)} />
          )}
          {typeof membership.gstPaise === "number" && (
            <Row
              k={`GST @ ${Math.round((membership.gstRate ?? 0.18) * 100)}%`}
              v={formatInr(membership.gstPaise)}
            />
          )}
          <Row k="Valid until" v={membership.validUntil ? formatDate(membership.validUntil) : null} />
        </dl>
      </div>
    );
  }

  // Found, by email: masked summary, full details sent to the inbox.
  if (membership && result.mode === "email") {
    return (
      <div className="rc" style={{ marginTop: 30 }}>
        <span className="rc-badge">{membership.status === "active" ? "Active member" : membership.status}</span>
        <h3 className="rc-title">{membership.institution ?? membership.memberNo}</h3>
        <p className="rc-lede">
          We&rsquo;ve emailed the full details &mdash; including your reference and transaction IDs
          &mdash; to the address on the membership. Here&rsquo;s the summary in the meantime.
        </p>

        <dl className="rc-rows">
          <Row k="Membership number" v={membership.memberNo} mono />
          <Row k="Plan" v={membership.planName} />
          <Row k="Registered email" v={membership.email} mono />
          <Row k="Reference ID" v={membership.orderRef} mono />
          <Row k="Transaction ID" v={membership.transactionId} mono />
          <Row k="Purchased" v={formatDate(membership.purchasedAt)} />
          <Row k="Amount paid" v={`${formatInr(membership.amountPaise)} (incl. GST)`} />
          <Row k="Valid until" v={membership.validUntil ? formatDate(membership.validUntil) : null} />
        </dl>
      </div>
    );
  }

  // A reference that exists but has no membership yet. Never "not found" -
  // their money may be mid-flight, and this is exactly the moment not to panic
  // someone.
  if (result.orderStatus) {
    const settling = result.orderStatus === "created" || result.orderStatus === "pending";

    return (
      <div className={settling ? "rc wait" : "rc stop"} style={{ marginTop: 30 }}>
        <span className="rc-badge">{settling ? "In progress" : "Not completed"}</span>
        <h3 className="rc-title">
          {settling ? "We're still confirming this payment." : "This payment wasn't completed."}
        </h3>
        <p className="rc-lede">
          {settling ? (
            <>
              We can see reference <strong>{result.orderRef}</strong>, and it hasn&rsquo;t settled
              yet. There&rsquo;s nothing you need to do &mdash; we&rsquo;ll email you the moment it
              clears.
            </>
          ) : (
            <>
              Reference <strong>{result.orderRef}</strong> didn&rsquo;t go through, and{" "}
              <strong>you have not been charged</strong> for it. You&rsquo;re welcome to start again
              from the Institution tab.
            </>
          )}
        </p>
      </div>
    );
  }

  // Genuinely nothing on record.
  return (
    <div className="rc wait" style={{ marginTop: 30 }}>
      <span className="rc-badge">No match</span>
      <h3 className="rc-title">We couldn&rsquo;t find a membership for that.</h3>
      <p className="rc-lede">
        Check for a typo, and try the other identifier &mdash; if the email doesn&rsquo;t match, the
        reference ID from your receipt will. If you&rsquo;ve paid and still can&rsquo;t find it,
        reply to your payment receipt and we&rsquo;ll trace it for you.
      </p>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string | null | undefined; mono?: boolean }) {
  if (!v) return null;
  return (
    <div className="rc-row">
      <dt>{k}</dt>
      <dd className={mono ? "mono" : undefined}>{v}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}
