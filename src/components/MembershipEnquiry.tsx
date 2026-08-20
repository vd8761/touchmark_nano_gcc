"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import MembershipStatus from "./MembershipStatus";
import { formatInrShort, PLANS } from "@/lib/pricing";
import {
  hasErrors,
  INSTITUTION_RULES,
  ORGANISATION_RULES,
  validate,
  type FieldErrors,
} from "@/lib/validate";

/**
 * The contact form, in three parts.
 *
 * Institutions buy a fixed package and are handed off to checkout;
 * organisations enquire and we call them back; and anyone who has already paid
 * can look their membership up without emailing us.
 *
 * The submit path is written defensively on purpose - this is the top of a
 * payment funnel, and the failure modes that matter are the boring ones: a
 * double-clicked button, a flaky network, a browser restored from bfcache.
 */

type Tab = "institution" | "organisation" | "status";

const PLAN = PLANS["institution-annual"];

const TABS: { id: Tab; label: string }[] = [
  { id: "institution", label: "Institution" },
  { id: "organisation", label: "Company" },
  { id: "status", label: "Already a member?" },
];

export default function MembershipEnquiry() {
  const [tab, setTab] = useState<Tab>("institution");

  // A layout effect, not a passive one: this runs before the browser paints
  // the hydrated page, so a deep link like /contact/?tab=status opens on the
  // right tab without visibly flicking through the default one. Reading the
  // tab here rather than from a server prop is what keeps /contact static.
  useLayoutEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    if (fromUrl) setTab(normalizeTab(fromUrl));
  }, []);

  return (
    <div>
      <div className="mtabs" role="tablist" aria-label="What would you like to do?">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="sim-preset"
            aria-pressed={tab === t.id}
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "institution" && <InstitutionForm />}
      {tab === "organisation" && <OrganisationForm />}
      {tab === "status" && <MembershipStatus />}
    </div>
  );
}

function normalizeTab(value: string | undefined): Tab {
  if (value === "organisation" || value === "company") return "organisation";
  if (value === "status" || value === "member") return "status";
  return "institution";
}

// ---------------------------------------------------------------------------
// Institution - the paid path
// ---------------------------------------------------------------------------

function InstitutionForm() {
  const { state, errors, error, submit } = useSubmitter();
  const mountedAt = useRef(Date.now());

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = readForm(e.currentTarget, mountedAt.current);

    submit({
      values: { ...values, kind: "institution" },
      rules: INSTITUTION_RULES,
      onSuccess: (data) => {
        // Hand off to checkout. `location.assign` (not `replace`) keeps this
        // page in history, so Back from the payment page returns here with the
        // form intact rather than dumping the buyer somewhere unexpected.
        if (typeof data.checkoutUrl === "string") window.location.assign(data.checkoutUrl);
      },
    });
  };

  // Once we have started navigating to originbi, keep the button locked. If
  // that navigation is slow, a second click must not open a second order.
  const busy = state === "submitting" || state === "redirecting";

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="pkg">
        <div className="pkg-top">
          <span className="pkg-name">DOS Club &mdash; Institution membership</span>
          <span className="pkg-price">
            {formatInrShort(PLAN.amountPaise)}
            <small>incl. GST &middot; 12 months</small>
          </span>
        </div>
        <ul className="pkg-list">
          {PLAN.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="form-note" role="alert">
          {error}
        </div>
      )}

      <p className="form-hint">All fields marked with an asterisk are required</p>

      <div className="form-grid">
        <Field name="name" label="Your name" errors={errors} required placeholder="Full name" autoComplete="name" />
        <Field name="organization" label="Institution" errors={errors} required placeholder="College or university" autoComplete="organization" />
        <Field name="email" label="Official email" errors={errors} required type="email" placeholder="you@institution.edu" autoComplete="email" />
        <Field name="phone" label="Phone" errors={errors} required type="tel" placeholder="+91 " autoComplete="tel" />
        <Field name="role" label="Designation" errors={errors} required placeholder="e.g. Head of Department" autoComplete="organization-title" />
        <Field name="city" label="City" errors={errors} placeholder="Where you're based" autoComplete="address-level2" />
        <Field name="message" label="Anything we should know" errors={errors} textarea placeholder="Your departments, current industry engagement, what you'd like from membership." />
        <Honeypot />
      </div>

      <p className="form-hint" style={{ marginTop: 22, marginBottom: 0 }}>
        Payment is taken securely on our payment page at originbi.com. You&rsquo;ll come straight
        back here once it&rsquo;s done.
      </p>

      <div className="acts">
        <button className="act primary" type="submit" data-busy={busy} disabled={busy}>
          {busy ? (
            <>
              <span className="spin" aria-hidden="true" /> Opening secure payment
            </>
          ) : (
            <>Proceed to secure payment</>
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Organisation - enquiry only
// ---------------------------------------------------------------------------

const CAPABILITY_AREAS = [
  "AI deployment & engineering",
  "Product engineering & R&D",
  "Deep-tech development",
  "Rapid prototyping & validation",
  "Technology support functions",
  "Other",
];

const TEAM_SIZES = ["1 - 5", "6 - 15", "16 - 40", "40+", "Not sure yet"];

function OrganisationForm() {
  const { state, errors, error, submit } = useSubmitter();
  const mountedAt = useRef(Date.now());
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const values = readForm(form, mountedAt.current);

    submit({
      values: { ...values, kind: "organisation" },
      rules: ORGANISATION_RULES,
      onSuccess: () => {
        setDone(true);
        form.reset();
      },
    });
  };

  if (done) {
    return (
      <div className="rc">
        <span className="rc-badge">Received</span>
        <h3 className="rc-title">Thank you &mdash; we have your enquiry.</h3>
        <p className="rc-lede">
          Corporate engagements are scoped individually, so commercials are discussed on a call
          rather than published. One of our team will be in touch within two working days to
          arrange a time. We&rsquo;ve sent a confirmation to your inbox.
        </p>
      </div>
    );
  }

  const busy = state === "submitting";

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="form-hint">
        For companies &middot; no payment now &mdash; commercials are agreed on a call
      </p>

      {error && (
        <div className="form-note" role="alert">
          {error}
        </div>
      )}

      <div className="form-grid">
        <Field name="name" label="Your name" errors={errors} required placeholder="Full name" autoComplete="name" />
        <Field name="organization" label="Company" errors={errors} required placeholder="Company name" autoComplete="organization" />
        <Field name="email" label="Work email" errors={errors} required type="email" placeholder="you@company.com" autoComplete="email" />
        <Field name="phone" label="Phone" errors={errors} required type="tel" placeholder="+91 " autoComplete="tel" />
        <Field name="role" label="Your role" errors={errors} placeholder="e.g. VP Engineering" autoComplete="organization-title" />
        <Select name="interest" label="Capability area" errors={errors} required options={CAPABILITY_AREAS} />
        <Select name="team_size" label="Team size you're considering" errors={errors} options={TEAM_SIZES} />
        <Field name="message" label="What are you trying to build?" errors={errors} textarea placeholder="The capability goal you'd like to test, and what you'd like to find out." />
        <Honeypot />
      </div>

      <div className="acts">
        <button className="act primary" type="submit" data-busy={busy} disabled={busy}>
          {busy ? (
            <>
              <span className="spin" aria-hidden="true" /> Sending
            </>
          ) : (
            <>Submit &amp; request a call</>
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Submit plumbing, shared by both forms
// ---------------------------------------------------------------------------

type SubmitState = "idle" | "submitting" | "redirecting";

function useSubmitter() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  // A browser restored from bfcache (Back from the payment page) replays the
  // component with `redirecting` still set, which would leave the button dead.
  // Reset it when the page is shown again.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        inFlight.current = false;
        setState("idle");
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const submit = useCallback(
    async ({
      values,
      rules,
      onSuccess,
    }: {
      values: Record<string, string>;
      rules: Parameters<typeof validate>[1];
      onSuccess: (data: Record<string, unknown>) => void;
    }) => {
      // Guard against double submits at the source, not just via `disabled` -
      // a fast double-click can land two events before React re-renders.
      if (inFlight.current) return;

      const clientErrors = validate(values, rules);
      if (hasErrors(clientErrors)) {
        setErrors(clientErrors);
        setError(null);
        focusFirstError(clientErrors);
        return;
      }

      inFlight.current = true;
      setState("submitting");
      setErrors({});
      setError(null);

      try {
        const res = await fetch("/api/enquiry", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

        if (!res.ok || data.ok !== true) {
          if (data.errors && typeof data.errors === "object") {
            setErrors(data.errors as FieldErrors);
            focusFirstError(data.errors as FieldErrors);
          }
          setError(
            typeof data.error === "string"
              ? data.error
              : "Something went wrong at our end. Nothing has been charged - please try again in a moment.",
          );
          inFlight.current = false;
          setState("idle");
          return;
        }

        if (typeof data.checkoutUrl === "string") setState("redirecting");
        onSuccess(data);

        // Stay locked while the browser navigates away.
        if (typeof data.checkoutUrl !== "string") {
          inFlight.current = false;
          setState("idle");
        }
      } catch {
        setError(
          "We couldn't reach our server. Nothing has been charged - please check your connection and try again.",
        );
        inFlight.current = false;
        setState("idle");
      }
    },
    [],
  );

  return { state, errors, error, submit };
}

/** Collects the form into a plain object, plus the bot-heuristic inputs. */
function readForm(form: HTMLFormElement, mountedAt: number): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (typeof value === "string") values[key] = value;
  }
  values.elapsed = String(Date.now() - mountedAt);
  values.referrer = document.referrer.slice(0, 500);

  // Carry any campaign parameters through from the landing URL.
  const params = new URLSearchParams(window.location.search);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const found = params.get(key);
    if (found) values[key] = found;
  }

  return values;
}

function focusFirstError(errors: FieldErrors) {
  const first = Object.keys(errors)[0];
  if (!first) return;
  requestAnimationFrame(() => {
    document.getElementById(`f-${first}`)?.focus();
  });
}

// ---------------------------------------------------------------------------
// Field primitives - thin wrappers over the existing .field styles
// ---------------------------------------------------------------------------

type FieldProps = {
  name: string;
  label: string;
  errors: FieldErrors;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  textarea?: boolean;
};

function Field({ name, label, errors, required, type = "text", placeholder, autoComplete, textarea }: FieldProps) {
  const id = `f-${name}`;
  const error = errors[name];
  const describedBy = error ? `${id}-err` : undefined;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span style={{ color: "var(--seed)" }}> *</span>}
      </label>

      {textarea ? (
        <textarea id={id} name={name} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={describedBy} />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
      )}

      {error && (
        <span className="field-error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

function Select({
  name,
  label,
  errors,
  required,
  options,
}: {
  name: string;
  label: string;
  errors: FieldErrors;
  required?: boolean;
  options: string[];
}) {
  const id = `f-${name}`;
  const error = errors[name];

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span style={{ color: "var(--seed)" }}> *</span>}
      </label>

      <select
        id={id}
        name={name}
        defaultValue=""
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>

      {error && (
        <span className="field-error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

/** Bait for form-filling bots. Never shown, never announced. */
function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label htmlFor="f-website">Website</label>
      <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
