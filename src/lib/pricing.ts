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
 * admin-configurable price (settings.ts's `getCurrentQuote`) lives
 * next to the database code that backs it instead, precisely so this file
 * can stay safe to import from the browser.
 */

export type PlanId = "institution-annual";

export type Plan = {
  id: PlanId;
  name: string;
  /** The listed price. Read together with `priceIncludesGst` below. */
  amountPaise: number;
  currency: "INR";
  /** GST rate applied to the listed price. */
  gstRate: number;
  /**
   * Whether `amountPaise` already contains the GST (inclusive) or GST is
   * added on top of it at checkout (exclusive). Admin-overridable - see
   * settings.ts's `getCurrentQuote`.
   */
  priceIncludesGst: boolean;
  /** Membership term, in months, from the activation date. */
  termMonths: number;
  includes: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  "institution-annual": {
    id: "institution-annual",
    name: "Nano GCC Institution Membership",
    amountPaise: 25_000_00, // ₹25,000 before GST
    currency: "INR",
    gstRate: 0.18,
    priceIncludesGst: false,
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

export type Quote = {
  /** The price as listed/configured - what marketing copy quotes. */
  listedPaise: number;
  /** Taxable value. */
  basePaise: number;
  /** The tax itself. */
  gstPaise: number;
  /** What the buyer is actually charged: base + GST. */
  totalPaise: number;
  gstRate: number;
  priceIncludesGst: boolean;
};

/**
 * Turns a listed price into the amounts a buyer is charged.
 *
 * Exclusive (the default): the listed price is the taxable value and GST is
 * added on top - ₹25,000 becomes ₹29,500 at checkout. Inclusive: the listed
 * price is the total and the tax is carved out of it - ₹25,000 stays
 * ₹25,000, of which ₹3,813.56 is GST. Either way base + GST is exactly the
 * total, because one side is derived from the other in paise.
 */
export function quotePrice(
  listedPaise: number,
  gstRate: number,
  priceIncludesGst: boolean,
): Quote {
  const basePaise = priceIncludesGst ? Math.round(listedPaise / (1 + gstRate)) : listedPaise;
  const totalPaise = priceIncludesGst ? listedPaise : basePaise + Math.round(basePaise * gstRate);

  return {
    listedPaise,
    basePaise,
    gstPaise: totalPaise - basePaise,
    totalPaise,
    gstRate,
    priceIncludesGst,
  };
}

/**
 * Splits an already-charged total into base and tax.
 *
 * For a *settled* order the mode no longer matters: whatever was listed, the
 * amount on the order row is the GST-inclusive total, so receipts, the
 * status page and the lookup all carve the tax back out of it the same way.
 * For ₹29,500 at 18%: base ₹25,000, GST ₹4,500.
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

/** The suffix that goes next to a listed price: "+ 18% GST" or "incl. GST". */
export function gstNote(gstRate: number, priceIncludesGst: boolean): string {
  return priceIncludesGst ? "incl. GST" : `+ ${Math.round(gstRate * 100)}% GST`;
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
