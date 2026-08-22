/**
 * POST /api/enquiry
 *
 * The single entry point for both audiences.
 *
 *  - `institution` -> stores the enquiry, opens an order, returns the signed
 *    originbi.com checkout URL for the browser to follow.
 *  - `organisation` -> stores the enquiry and acknowledges. No payment.
 *
 * Responds with JSON rather than a redirect so the form can keep control of
 * the button state and show a real error instead of dumping the buyer on a
 * broken page.
 */

import type { NextRequest } from "next/server";
import { sql, type Enquiry, type EnquiryKind } from "@/lib/db";
import { env } from "@/lib/env";
import {
  clean,
  cleanMultiline,
  hasErrors,
  INSTITUTION_RULES,
  looksAutomated,
  normalizeEmail,
  ORGANISATION_RULES,
  validate,
  LIMITS,
} from "@/lib/validate";
import { buildCheckoutUrl, createOrReuseOrder } from "@/lib/payments";
import { badRequest, clientIpHash, json, rateLimit, sameOrigin, userAgent } from "@/lib/request";
import { notifyTeam, send } from "@/lib/email";
import { enquiryReceived, internalNotification } from "@/lib/email-templates";
import { formatInrShort, PLANS } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Malformed request.");
  }

  const kind: EnquiryKind = body.kind === "institution" ? "institution" : "organisation";

  // Bots get a success-shaped response. Telling them they were caught only
  // helps them tune, and a real user can never reach this branch.
  if (looksAutomated(body)) {
    return json({ ok: true, kind, acknowledged: true });
  }

  const ipHash = clientIpHash(req);
  const limit = await rateLimit(`enquiry:${kind}`, ipHash, { max: 8, windowMinutes: 30 });
  if (!limit.allowed) {
    return json(
      { ok: false, error: "Too many submissions from this connection. Please try again shortly." },
      429,
    );
  }

  const rules = kind === "institution" ? INSTITUTION_RULES : ORGANISATION_RULES;
  const errors = validate(body, rules);
  if (hasErrors(errors)) return json({ ok: false, error: "Please check the form.", errors }, 422);

  const email = normalizeEmail(String(body.email));
  const name = clean(body.name, LIMITS.name)!;
  const organization = clean(body.organization, LIMITS.organization)!;

  const enquiries = (await sql()`
    insert into enquiries (
      kind, name, email, organization, phone, role, city, team_size, interest, message,
      referrer, utm, ip_hash, user_agent
    ) values (
      ${kind}, ${name}, ${email}, ${organization},
      ${clean(body.phone, LIMITS.phone)}, ${clean(body.role, LIMITS.role)},
      ${clean(body.city, LIMITS.city)}, ${clean(body.team_size, LIMITS.generic)},
      ${clean(body.interest, LIMITS.generic)}, ${cleanMultiline(body.message, LIMITS.message)},
      ${clean(body.referrer, 500)}, ${JSON.stringify(collectUtm(body))},
      ${ipHash}, ${userAgent(req)}
    )
    returning *
  `) as Enquiry[];

  const enquiry = enquiries[0]!;

  // --- Organisation: acknowledge and stop here. ---------------------------
  if (kind === "organisation") {
    const settings = await getSettings();

    await Promise.allSettled([
      settings.sendUserCopy
        ? send({
            to: email,
            template: "enquiry-received",
            message: enquiryReceived({ name, kind, organization }),
          })
        : Promise.resolve(),
      notifyTeam(
        internalNotification({
          heading: "New company enquiry",
          pairs: [
            ["Name", name],
            ["Company", organization],
            ["Email", email],
            ["Phone", clean(body.phone, LIMITS.phone) ?? "-"],
            ["Capability area", clean(body.interest, LIMITS.generic) ?? "-"],
            ["Team size", clean(body.team_size, LIMITS.generic) ?? "-"],
          ],
          adminUrl: `${env.siteUrl}/admin/enquiries/`,
        }),
        "enquiry",
      ),
    ]);

    return json({ ok: true, kind, acknowledged: true });
  }

  // --- Institution: open an order and hand off to checkout. ---------------
  try {
    const order = await createOrReuseOrder({
      enquiryId: enquiry.id,
      email,
      name,
      phone: clean(body.phone, LIMITS.phone),
      organization,
      // Never taken from the request body - the amount lives only in pricing.ts.
      plan: "institution-annual",
    });

    // Deliberately not awaited into the response path: a slow mail API must
    // not delay the redirect to checkout.
    void notifyTeam(
      internalNotification({
        heading: "Institution membership started",
        pairs: [
          ["Institution", organization],
          ["Contact", `${name} <${email}>`],
          ["Reference", order.order_ref],
          ["Amount", formatInrShort(order.amount_paise)],
        ],
        adminUrl: `${env.siteUrl}/admin/payments/`,
      }),
      "enquiry",
    );

    return json({
      ok: true,
      kind,
      orderRef: order.order_ref,
      checkoutUrl: buildCheckoutUrl(order),
      amountPaise: order.amount_paise,
      planName: PLANS["institution-annual"].name,
    });
  } catch {
    // The enquiry is safely stored either way, so say so - the buyer has not
    // lost anything and nobody has been charged.
    return json(
      {
        ok: false,
        savedEnquiry: true,
        error:
          "We've saved your details, but couldn't open the payment page just now. " +
          "Nothing has been charged. Please try again in a moment, or reply to our email and we'll send you a payment link.",
      },
      503,
    );
  }
}

/** Campaign parameters, if the form passed any along. */
function collectUtm(body: Record<string, unknown>): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = clean(body[key], 200);
    if (value) utm[key] = value;
  }
  return utm;
}
