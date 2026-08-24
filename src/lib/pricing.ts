/**
 * The price list.
 *
 * Single source of truth, server-side. The browser never sends an amount and
 * the server never reads one from a request - a form post only names a plan,
 * and the amount is looked up here. That closes the obvious "edit the hidden
 * field, pay ₹1" hole.
 *
 * Amounts are in paise because that is Razorpay's unit; storing rupees as a
 * float would be a rounding bug waiting to happen.
 *
 * Deliberately no imports here beyond the language itself: this file is
 * pulled into client components (MembershipEnquiry, MembershipStatus,
 * PaymentReturn) for `formatInr`/`PLANS`, so anything server-only - a
 * database call, an env var read - does not belong in this file. The live,
 * admin-configurable price (settings.ts's `getCurrentAmountPaise`) lives
 * next to the database code that backs it instead, precisely so this file
 * can stay safe to import from the browser.
 */

export type PlanId = "institution-annual";

export type Plan = {
  id: PlanId;
  name: string;
  /** Total charged, inclusive of GST. */
  amountPaise: number;
  currency: "INR";
  /** GST rate the inclusive total already contains. */
  gstRate: number;
  /** Membership term, in months, from the activation date. */
  termMonths: number;
  includes: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  "institution-annual": {
    id: "institution-annual",
    name: "Nano GCC Institution Membership",
    amountPaise: 25000, // ₹25,000 inclusive of GST
    currency: "INR",
    gstRate: 0.18,
    termMonths: 12,
    includes: [
      "One year of Nano GCC institution membership",
      "Access to the Nano GCC partner network and briefings",
      "Structured industry engagement for your departments",
      "Priority consideration for pilot and prototype programmes",
      "Named institutional listing in the partner ecosystem",
    ],
  },
};

export function getPlan(id: string): Plan | null {
  return (PLANS as Record<string, Plan>)[id] ?? null;
}

/**
 * Splits a GST-inclusive total into base and tax.
 *
 * For ₹25,000 at 18%: base ₹21,186.44, GST ₹3,813.56. Computed in paise and
 * rounded so the two parts always add back to exactly the total.
 */
export function gstBreakdown(amountPaise: number, gstRate: number) {
  const basePaise = Math.round(amountPaise / (1 + gstRate));
  return {
    totalPaise: amountPaise,
    basePaise,
    gstPaise: amountPaise - basePaise,
    gstRate,
  };
}

/** `2500000` -> `"₹25,000.00"`. */
export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

/** `2500000` -> `"₹25,000"`, for headline copy where paise are noise. */
export function formatInrShort(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
