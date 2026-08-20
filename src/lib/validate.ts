/**
 * Field validation shared by the browser and the API routes.
 *
 * The client copy exists to give fast, friendly errors; the server copy is the
 * one that actually decides. Same module, so the two cannot drift.
 */

export type FieldErrors = Record<string, string>;

/**
 * Pragmatic email check. Deliberately not RFC 5322 - that regex accepts things
 * no mail server does and rejects nothing useful. This catches typos; the
 * delivery webhook catches the rest.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@,]+\.[a-z]{2,}$/i;

/** Indian mobile / landline with optional country code and separators. */
const PHONE_RE = /^[+]?[\d][\d\s()-]{6,18}\d$/;

export const LIMITS = {
  name: 120,
  email: 200,
  organization: 200,
  phone: 24,
  role: 120,
  city: 120,
  message: 4000,
  generic: 200,
} as const;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim()) && value.trim().length <= LIMITS.email;
}

/** Lowercased and trimmed - the form used for every lookup and unique check. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Collapses whitespace and trims; `null` for anything empty. */
export function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

/** Same as `clean` but preserves line breaks, for message bodies. */
export function cleanMultiline(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

type Rule = {
  label: string;
  required?: boolean;
  max?: number;
  kind?: "email" | "phone";
};

/**
 * Validates a plain object of form values against a rule map.
 * Returns `{}` when everything passes.
 */
export function validate(
  values: Record<string, unknown>,
  rules: Record<string, Rule>,
): FieldErrors {
  const errors: FieldErrors = {};

  for (const [field, rule] of Object.entries(rules)) {
    const raw = values[field];
    const value = typeof raw === "string" ? raw.trim() : "";

    if (!value) {
      if (rule.required) errors[field] = `${rule.label} is required.`;
      continue;
    }

    if (rule.max && value.length > rule.max) {
      errors[field] = `${rule.label} must be ${rule.max} characters or fewer.`;
      continue;
    }

    if (rule.kind === "email" && !isEmail(value)) {
      errors[field] = "Enter a valid email address.";
      continue;
    }

    if (rule.kind === "phone" && !PHONE_RE.test(value)) {
      errors[field] = "Enter a valid phone number.";
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

// ---------------------------------------------------------------------------
// Rule sets, shared by the form component and the API route.
// ---------------------------------------------------------------------------

export const INSTITUTION_RULES: Record<string, Rule> = {
  name: { label: "Name", required: true, max: LIMITS.name },
  organization: { label: "Institution", required: true, max: LIMITS.organization },
  email: { label: "Email", required: true, max: LIMITS.email, kind: "email" },
  phone: { label: "Phone", required: true, max: LIMITS.phone, kind: "phone" },
  role: { label: "Designation", required: true, max: LIMITS.role },
  city: { label: "City", required: false, max: LIMITS.city },
  message: { label: "Message", required: false, max: LIMITS.message },
};

export const ORGANISATION_RULES: Record<string, Rule> = {
  name: { label: "Name", required: true, max: LIMITS.name },
  organization: { label: "Company", required: true, max: LIMITS.organization },
  email: { label: "Work email", required: true, max: LIMITS.email, kind: "email" },
  phone: { label: "Phone", required: true, max: LIMITS.phone, kind: "phone" },
  role: { label: "Role", required: false, max: LIMITS.role },
  team_size: { label: "Team size", required: false, max: LIMITS.generic },
  interest: { label: "Capability area", required: true, max: LIMITS.generic },
  message: { label: "Message", required: false, max: LIMITS.message },
};

/**
 * Bot heuristics. `website` is a honeypot input hidden from real users, and
 * `elapsed` is how long the form was on screen - humans take more than a couple
 * of seconds to fill one in.
 */
export function looksAutomated(values: { website?: unknown; elapsed?: unknown }): boolean {
  if (typeof values.website === "string" && values.website.trim().length > 0) return true;
  const elapsed = Number(values.elapsed);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 2500;
}
