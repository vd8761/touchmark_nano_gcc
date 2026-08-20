/**
 * Transactional email bodies.
 *
 * Plain functions returning `{ subject, html, text }` - no react-email, no
 * build step. Table-based layout with inline styles because that is still what
 * Outlook and Gmail agree on, and the palette matches the site (`--seed`
 * #0F5E86, `--panel` #0D364F).
 *
 * Every template ships a text part too: HTML-only mail scores badly with spam
 * filters, which matters when the message is a payment receipt.
 */

import { COMPANY } from "./company";
import { formatInr, gstBreakdown, type Plan } from "./pricing";

export type Rendered = { subject: string; html: string; text: string };

const SEED = "#0F5E86";
const PANEL = "#0D364F";
const INK = "#16232B";
const INK_SOFT = "#5A6B75";
const RULE = "#DCE3E7";
const PAPER = "#F7F9FA";

const FONT =
  "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

/** Shell shared by every message: header bar, body slot, legal footer. */
function layout(opts: { title: string; preheader: string; body: string }): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:${FONT};color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${RULE};border-radius:6px;overflow:hidden;">
    <tr><td style="background:${PANEL};padding:22px 28px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9FC4D8;">DOS Club</div>
      <div style="font-size:17px;font-weight:600;color:#FFFFFF;margin-top:4px;">${escapeHtml(opts.title)}</div>
    </td></tr>
    <tr><td style="padding:28px;">${opts.body}</td></tr>
    <tr><td style="border-top:1px solid ${RULE};padding:20px 28px;font-size:12px;line-height:1.6;color:${INK_SOFT};">
      ${escapeHtml(COMPANY.legalName)} &middot; ${escapeHtml(COMPANY.brand)}<br>
      ${COMPANY.addresses[0].lines.map(escapeHtml).join("<br>")}<br>
      <a href="mailto:${COMPANY.email}" style="color:${SEED};">${COMPANY.email}</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** Key/value receipt rows. */
function rows(pairs: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
${pairs
  .map(
    ([k, v]) =>
      `<tr><td style="padding:9px 0;border-bottom:1px solid ${RULE};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${INK_SOFT};width:44%;">${escapeHtml(
        k,
      )}</td><td style="padding:9px 0;border-bottom:1px solid ${RULE};font-size:14px;color:${INK};font-weight:500;">${escapeHtml(
        v,
      )}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${INK};">${text}</p>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr>
    <td style="background:${SEED};border-radius:4px;">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${escapeHtml(label)}</a>
    </td></tr></table>`;
}

function textRows(pairs: [string, string][]): string {
  return pairs.map(([k, v]) => `  ${k}: ${v}`).join("\n");
}

// ---------------------------------------------------------------------------
// Membership activated - the receipt
// ---------------------------------------------------------------------------

export type MembershipEmailInput = {
  name: string | null;
  memberNo: string;
  institution: string | null;
  email: string;
  orderRef: string;
  transactionId: string | null;
  amountPaise: number;
  paidAt: string;
  validUntil: string | null;
  plan: Plan;
  siteUrl: string;
};

export function membershipActivated(input: MembershipEmailInput): Rendered {
  const gst = gstBreakdown(input.amountPaise, input.plan.gstRate);
  const greeting = input.name ? `Hello ${input.name},` : "Hello,";

  const pairs: [string, string][] = [
    ["Membership number", input.memberNo],
    ["Institution", input.institution ?? "-"],
    ["Registered email", input.email],
    ["Reference ID", input.orderRef],
    ["Transaction ID", input.transactionId ?? "-"],
    ["Amount paid", `${formatInr(gst.totalPaise)} (incl. GST)`],
    ["Taxable value", formatInr(gst.basePaise)],
    [`GST @ ${Math.round(gst.gstRate * 100)}%`, formatInr(gst.gstPaise)],
    ["Paid on", formatDate(input.paidAt)],
    ["Valid until", input.validUntil ? formatDate(input.validUntil) : "-"],
  ];

  const includes = input.plan.includes
    .map(
      (item) =>
        `<li style="margin-bottom:7px;font-size:14px;line-height:1.6;color:${INK};">${escapeHtml(item)}</li>`,
    )
    .join("");

  const html = layout({
    title: "Your membership is active",
    preheader: `${input.memberNo} - payment of ${formatInr(input.amountPaise)} received.`,
    body: `
      ${paragraph(escapeHtml(greeting))}
      ${paragraph(
        `Your <strong>DOS Club</strong> membership has been activated. Payment was received in full and this email is your receipt &mdash; please keep it for your records.`,
      )}
      ${rows(pairs)}
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${INK_SOFT};margin-top:24px;">What your membership includes</div>
      <ul style="margin:12px 0 0;padding-left:18px;">${includes}</ul>
      ${button(`${input.siteUrl}/contact/?tab=status&ref=${encodeURIComponent(input.orderRef)}`, "View membership status")}
      ${paragraph(
        `Quote your reference ID <strong>${escapeHtml(
          input.orderRef,
        )}</strong> in any correspondence. If anything here looks wrong, reply to this email and we&rsquo;ll sort it out.`,
      )}
    `,
  });

  const text = [
    greeting,
    "",
    "Your DOS Club membership has been activated. Payment was received in full and this email is your receipt.",
    "",
    textRows(pairs),
    "",
    "What your membership includes:",
    ...input.plan.includes.map((i) => `  - ${i}`),
    "",
    `Check your status: ${input.siteUrl}/contact/?tab=status&ref=${encodeURIComponent(input.orderRef)}`,
    "",
    `${COMPANY.legalName} - ${COMPANY.email}`,
  ].join("\n");

  return {
    subject: `DOS Club membership activated - ${input.memberNo}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Enquiry acknowledgement
// ---------------------------------------------------------------------------

export function enquiryReceived(input: {
  name: string;
  kind: "institution" | "organisation";
  organization: string;
}): Rendered {
  const isOrg = input.kind === "organisation";

  const html = layout({
    title: "We've received your enquiry",
    preheader: "Thanks for getting in touch - here's what happens next.",
    body: `
      ${paragraph(`Hello ${escapeHtml(input.name)},`)}
      ${paragraph(
        `Thank you for your enquiry on behalf of <strong>${escapeHtml(
          input.organization,
        )}</strong>. It has reached the right team.`,
      )}
      ${paragraph(
        isOrg
          ? "Because every corporate engagement is scoped differently, commercials are discussed on a call rather than published. One of our team will be in touch within two working days to arrange a time."
          : "We&rsquo;ll review the details you shared and come back to you within two working days.",
      )}
      ${paragraph("There&rsquo;s nothing you need to do in the meantime.")}
    `,
  });

  const text = [
    `Hello ${input.name},`,
    "",
    `Thank you for your enquiry on behalf of ${input.organization}. It has reached the right team.`,
    "",
    isOrg
      ? "Because every corporate engagement is scoped differently, commercials are discussed on a call rather than published. One of our team will be in touch within two working days to arrange a time."
      : "We'll review the details you shared and come back to you within two working days.",
    "",
    `${COMPANY.legalName} - ${COMPANY.email}`,
  ].join("\n");

  return { subject: "We've received your enquiry - Touchmark Nano GCC Hub", html, text };
}

// ---------------------------------------------------------------------------
// Membership details, sent by the status lookup
// ---------------------------------------------------------------------------

export function membershipDetails(input: MembershipEmailInput & { status: string }): Rendered {
  const gst = gstBreakdown(input.amountPaise, input.plan.gstRate);

  const pairs: [string, string][] = [
    ["Membership number", input.memberNo],
    ["Status", input.status],
    ["Institution", input.institution ?? "-"],
    ["Reference ID", input.orderRef],
    ["Transaction ID", input.transactionId ?? "-"],
    ["Amount paid", `${formatInr(gst.totalPaise)} (incl. GST)`],
    ["Paid on", formatDate(input.paidAt)],
    ["Valid until", input.validUntil ? formatDate(input.validUntil) : "-"],
  ];

  const html = layout({
    title: "Your membership details",
    preheader: `Details for ${input.memberNo}.`,
    body: `
      ${paragraph("You (or someone) asked for these membership details on our website.")}
      ${rows(pairs)}
      ${paragraph(
        "If this wasn&rsquo;t you, no action is needed &mdash; these details were only sent to the address already on the membership.",
      )}
    `,
  });

  const text = [
    "You (or someone) asked for these membership details on our website.",
    "",
    textRows(pairs),
    "",
    "If this wasn't you, no action is needed - these details were only sent to the address already on the membership.",
  ].join("\n");

  return { subject: `Your DOS Club membership details - ${input.memberNo}`, html, text };
}

// ---------------------------------------------------------------------------
// Internal notifications
// ---------------------------------------------------------------------------

export function internalNotification(input: {
  heading: string;
  pairs: [string, string][];
  adminUrl: string;
}): Rendered {
  const html = layout({
    title: input.heading,
    preheader: input.pairs.map(([k, v]) => `${k}: ${v}`).join(" | ").slice(0, 120),
    body: `${rows(input.pairs)}${button(input.adminUrl, "Open the admin panel")}`,
  });

  return {
    subject: `[DOS Club] ${input.heading}`,
    html,
    text: `${input.heading}\n\n${textRows(input.pairs)}\n\n${input.adminUrl}`,
  };
}
