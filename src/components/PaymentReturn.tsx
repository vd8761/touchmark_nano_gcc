"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { formatInr } from "@/lib/pricing";

/**
 * Where buyers land coming back from originbi.com.
 *
 * The whole design brief for this component is: *do not panic anyone*. A
 * payment that has been taken but not yet confirmed is the normal case for the
 * first few seconds, and it must never be styled or worded as a failure. The
 * only screen that says "didn't go through" is the one where Razorpay has told
 * us so - and it says "you have not been charged" in the same breath.
 *
 * State comes entirely from the server, keyed on the reference in the URL, so
 * refreshing, going back, or opening the link again next week all render the
 * truth rather than whatever this component last remembered.
 */

type Status = "loading" | "created" | "pending" | "paid" | "failed" | "abandoned" | "unknown";

type StatusPayload = {
  ok?: boolean;
  status?: Status;
  orderRef?: string;
  ageMs?: number;
  failureReason?: string | null;
  memberNo?: string | null;
  institution?: string | null;
  email?: string;
  transactionId?: string | null;
  bankReference?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  validUntil?: string | null;
  planName?: string;
  amountPaise?: number;
  basePaise?: number;
  gstPaise?: number;
  gstRate?: number;
};

/** Poll fast at first, then ease off; stop calling it "confirming" after this. */
const FAST_INTERVAL_MS = 2_000;
const SLOW_INTERVAL_MS = 5_000;
const FAST_PHASE_MS = 20_000;
const PATIENCE_MS = 90_000;

export default function PaymentReturn() {
  const [ref, setRef] = useState<string | null>(null);
  // originbi appends ?payment=success on the way back. Without a reference we
  // can't show a receipt, but we can still avoid implying something went wrong.
  const [claimedSuccess, setClaimedSuccess] = useState(false);
  const [data, setData] = useState<StatusPayload | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [waitedOut, setWaitedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const startedAt = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopped = useRef(false);

  const poll = useCallback(async (orderRef: string) => {
    if (stopped.current) return;

    try {
      const res = await fetch(`/api/order-status?ref=${encodeURIComponent(orderRef)}`, {
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as StatusPayload;

      if (res.status === 404) {
        setStatus("unknown");
        stopped.current = true;
        return;
      }

      if (payload.status) {
        setData(payload);
        setStatus(payload.status);

        // Terminal states: stop asking.
        if (payload.status === "paid" || payload.status === "failed" || payload.status === "abandoned") {
          stopped.current = true;
          return;
        }
      }
    } catch {
      // A dropped poll is not a failure - the payment is unaffected. Keep the
      // current screen and try again on the next tick.
    }

    const elapsed = Date.now() - startedAt.current;
    if (elapsed > PATIENCE_MS) {
      setWaitedOut(true);
      stopped.current = true;
      return;
    }

    timer.current = setTimeout(
      () => poll(orderRef),
      elapsed < FAST_PHASE_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS,
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderRef = params.get("ref");
    setClaimedSuccess(params.get("payment") === "success");

    if (!orderRef) {
      setStatus("unknown");
      return;
    }

    setRef(orderRef);
    void poll(orderRef);

    return () => {
      stopped.current = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [poll]);

  const retry = async () => {
    if (!ref || retrying) return;
    setRetrying(true);

    try {
      const res = await fetch("/api/order-retry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref }),
      });
      const payload = (await res.json()) as { checkoutUrl?: string; alreadyPaid?: boolean };

      if (payload.alreadyPaid) {
        // Paid after all - show the receipt instead of charging again.
        stopped.current = false;
        startedAt.current = Date.now();
        setWaitedOut(false);
        void poll(ref);
        return;
      }

      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }

      setRetrying(false);
    } catch {
      setRetrying(false);
    }
  };

  // --- Screens ------------------------------------------------------------

  if (status === "loading") {
    return (
      <Card tone="wait" badge="Checking" title={<>One moment&hellip;</>}>
        <p className="rc-lede">We&rsquo;re looking up your payment.</p>
      </Card>
    );
  }

  if (status === "unknown") {
    // Two quite different situations, and the wording has to match. If the
    // payment page said "success", lead with that - the missing reference is
    // our problem to solve, not something to worry the buyer with.
    return claimedSuccess ? (
      <Card badge="Payment successful" title={<>Thank you - your payment went through.</>}>
        <p className="rc-lede">
          We couldn&rsquo;t read the reference from the link you came back on, so we can&rsquo;t
          show the full receipt here. Your payment is recorded and your membership email is on its
          way - it carries the reference and the full details.
        </p>
        <p className="rc-lede" style={{ marginTop: 14 }}>
          You can also{" "}
          <Link href="/contact/?tab=status" style={{ borderBottom: "1px solid currentColor" }}>
            look your membership up
          </Link>{" "}
          with the email address you registered.
        </p>
      </Card>
    ) : (
      <Card tone="wait" badge="No reference" title={<>We can&rsquo;t identify this payment.</>}>
        <p className="rc-lede">
          This page needs the reference from your payment. If you&rsquo;ve just paid and landed
          here without one, don&rsquo;t worry - your payment is still recorded, and the
          receipt will reach your inbox. You can also{" "}
          <Link href="/contact/?tab=status" style={{ borderBottom: "1px solid currentColor" }}>
            check your membership status
          </Link>{" "}
          with your email address.
        </p>
      </Card>
    );
  }

  if (status === "paid") {
    return (
      <Card
        badge="Payment successful"
        title={
          data?.memberNo
            ? `Welcome to Nano GCC, ${data.institution ?? "member"}.`
            : "Payment received."
        }
      >
        <p className="rc-lede">
          Your membership is active and your receipt is on its way to{" "}
          <strong>{data?.email}</strong>. Keep the reference below - it&rsquo;s how you can
          look this up at any time.
        </p>

        <dl className="rc-rows">
          <Row k="Membership number" v={data?.memberNo} mono />
          <Row k="Plan" v={data?.planName} />
          <Row k="Institution" v={data?.institution} />
          <Row k="Reference ID" v={data?.orderRef} mono />
          <Row k="UPI / bank reference" v={data?.bankReference} mono />
          <Row k="Transaction ID" v={data?.transactionId} mono />
          <Row k="Payment method" v={data?.paymentMethod} />
          <Row k="Paid on" v={data?.paidAt ? formatDate(data.paidAt) : null} />
          <Row
            k="Amount paid"
            v={typeof data?.amountPaise === "number" ? `${formatInr(data.amountPaise)} (incl. GST)` : null}
          />
          <Row
            k="Taxable value"
            v={typeof data?.basePaise === "number" ? formatInr(data.basePaise) : null}
          />
          <Row
            k={`GST @ ${Math.round((data?.gstRate ?? 0.18) * 100)}%`}
            v={typeof data?.gstPaise === "number" ? formatInr(data.gstPaise) : null}
          />
          <Row k="Valid until" v={data?.validUntil ? formatDate(data.validUntil) : null} />
        </dl>

        <div className="acts">
          <Link className="act" href="/for-institutions/">
            What happens next <i aria-hidden="true">&rarr;</i>
          </Link>
        </div>
      </Card>
    );
  }

  if (status === "failed" || status === "abandoned") {
    return (
      <Card tone="stop" badge="Not completed" title={<>That payment didn&rsquo;t go through.</>}>
        <p className="rc-lede">
          <strong>You have not been charged.</strong>{" "}
          {status === "abandoned"
            ? "This attempt was left open too long, so we've closed it off."
            : "Your bank or card issuer declined the attempt."}{" "}
          Nothing is lost - your details are saved, and starting again takes a moment.
        </p>

        {data?.failureReason && (
          <dl className="rc-rows">
            <Row k="Reason given" v={data.failureReason} />
            <Row k="Reference ID" v={data.orderRef} mono />
          </dl>
        )}

        <div className="acts">
          <button className="act primary" type="button" onClick={retry} data-busy={retrying} disabled={retrying}>
            {retrying ? (
              <>
                <span className="spin" aria-hidden="true" /> Reopening payment
              </>
            ) : (
              <>Try the payment again</>
            )}
          </button>
          <Link className="act" href="/contact/?tab=institution">
            Back to the form <i aria-hidden="true">&rarr;</i>
          </Link>
        </div>
      </Card>
    );
  }

  // Still settling. Two wordings, neither of them alarming.
  if (waitedOut) {
    return (
      <Card tone="wait" badge="Confirming" title={<>This is taking longer than usual.</>}>
        <p className="rc-lede">
          Your payment is safe. Banks occasionally take a few minutes to confirm, and we&rsquo;ll
          email your receipt the moment it clears - there&rsquo;s nothing more for you to do,
          and no need to pay again.
        </p>

        <dl className="rc-rows">
          <Row k="Reference ID" v={ref} mono />
        </dl>

        <p className="rc-lede" style={{ marginTop: 20 }}>
          If you&rsquo;d rather check with us, email{" "}
          <a
            href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(`Nano GCC payment ${ref ?? ""}`)}`}
            style={{ borderBottom: "1px solid currentColor" }}
          >
            {COMPANY.email}
          </a>{" "}
          quoting that reference.
        </p>
      </Card>
    );
  }

  return (
    <Card tone="wait" badge="Confirming" title={<>Payment received - confirming it now.</>}>
      <p className="rc-lede">
        This usually takes a few seconds. Please keep this page open; it will update by itself. Your
        reference is <strong>{ref}</strong>.
      </p>
      <p className="rc-lede" style={{ marginTop: 14 }}>
        <span className="spin" aria-hidden="true" style={{ marginRight: 8, verticalAlign: "middle" }} />
        Waiting for confirmation&hellip;
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function Card({
  tone,
  badge,
  title,
  children,
}: {
  tone?: "wait" | "stop";
  badge: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={tone ? `rc ${tone}` : "rc"} role="status" aria-live="polite">
      <span className="rc-badge">{badge}</span>
      <h2 className="rc-title">{title}</h2>
      {children}
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
