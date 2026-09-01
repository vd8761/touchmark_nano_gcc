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
import { env } from "./env";
import { formatInr, gstBreakdown, type Plan } from "./pricing";

export type Rendered = { subject: string; html: string; text: string };

// Matches the site's actual custom properties in globals.css (--seed, --panel,
// --proven, etc.) so mail doesn't feel like a different product from the page
// that sent someone here.
const SEED = "#0F5E86"; // the starting unit - primary brand colour
const PANEL = "#0D364F"; // accent band / footer - deep navy
const PROVEN = "#9E480A"; // capability added once proven - warm accent
const INK = "#0D364F";
const INK_SOFT = "#4E6B7C";
const INK_FAINT = "#7C8F9B";
const RULE = "#DCE3E7";
const PAPER = "#F7F9FA";
const PAPER_2 = "#F8F4F0";

const FONT =
  "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO_FONT =
  "'Poppins', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

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
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;padding-right:12px;">
          <img src="${env.siteUrl}/brand/touchmark-logo.png" alt="Nano GCC" width="auto" height="36" style="display:block;height:36px;border-radius:8px;background:#FFFFFF;padding:4px;" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9FC4D8;">Nano GCC</div>
          <div style="font-size:17px;font-weight:600;color:#FFFFFF;margin-top:2px;">${escapeHtml(opts.title)}</div>
        </td>
      </tr></table>
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
// The "hero" shell - a warmer, more visual wrapper for the two moments that
// deserve to feel like an event rather than a routine notice: a new
// membership landing in the admin's inbox, and a buyer's own activation
// email. Everything else (enquiry acks, admin-notification pairs, the
// on-demand status lookup) stays on the plainer `layout()` above - reserving
// the heavier treatment for these two keeps it meaning something.
//
// Gradients are set as background-color *and* background-image separately
// (not the `background` shorthand) so Outlook's engine, which ignores
// background-image on table cells entirely, still renders the solid
// fallback colour rather than nothing.
// ---------------------------------------------------------------------------

function heroLayout(opts: {
  title: string;
  preheader: string;
  eyebrow: string;
  accent: string;
  body: string;
}): string {
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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(13,54,79,0.08);">
    <tr><td
      style="background-color:${PANEL};background-image:linear-gradient(135deg, ${PANEL} 0%, ${opts.accent} 160%);padding:42px 40px 34px;"
    >
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>
        <td style="vertical-align:middle;padding-right:14px;">
          <img src="${env.siteUrl}/brand/touchmark-logo.png" alt="Nano GCC" width="auto" height="44" style="display:block;height:44px;border-radius:10px;background:#FFFFFF;padding:5px;" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);font-weight:600;">Nano GCC</div>
        </td>
      </tr></table>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td
        style="background:rgba(255,255,255,0.14);border-radius:20px;padding:5px 14px;font-family:${MONO_FONT};font-weight:700;font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:#FFFFFF;"
      >${escapeHtml(opts.eyebrow)}</td></tr></table>
      <div style="font-family:${FONT};font-weight:600;font-size:26px;line-height:1.28;color:#FFFFFF;margin-top:16px;">${opts.title}</div>
    </td></tr>
    <tr><td style="padding:36px 40px 8px;">${opts.body}</td></tr>
    <tr><td style="padding:8px 40px 30px;">
      <div style="border-top:1px solid ${RULE};padding-top:22px;font-size:12px;line-height:1.6;color:${INK_FAINT};">
        ${escapeHtml(COMPANY.legalName)} &middot; ${escapeHtml(COMPANY.brand)}<br>
        ${COMPANY.addresses[0].lines.map(escapeHtml).join("<br>")}
      </div>
    </td></tr>
  </table>
  <div style="max-width:600px;margin:16px auto 0;font-size:11px;color:${INK_FAINT};text-align:center;">
    You&rsquo;re receiving this because of activity on ${escapeHtml(COMPANY.brand)}.
  </div>
</td></tr></table>
</body></html>`;
}

/** A row of one or two side-by-side call-to-action buttons. */
function buttonRow(actions: { href: string; label: string; primary?: boolean }[]): string {
  const cells = actions
    .map(
      (a) => `<td style="padding-right:12px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background-color:${a.primary === false ? "#FFFFFF" : SEED};${
            a.primary === false ? `border:1.5px solid ${SEED};` : ""
          }border-radius:8px;">
            <a href="${a.href}" style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:600;color:${
              a.primary === false ? SEED : "#FFFFFF"
            };text-decoration:none;">${escapeHtml(a.label)}</a>
          </td>
        </tr></table>
      </td>`,
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>${cells}</tr></table>`;
}

/** The bulleted "what you get" list, with a coloured checkmark instead of a plain bullet. */
function checklist(items: string[], accent: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
${items
  .map(
    (item) => `<tr>
      <td style="padding:7px 10px 7px 0;width:26px;vertical-align:top;">
        <div style="width:20px;height:20px;border-radius:50%;background:${accent}1a;color:${accent};font-size:12px;font-weight:700;text-align:center;line-height:20px;">&#10003;</div>
      </td>
      <td style="padding:7px 0;font-size:14.5px;line-height:1.55;color:${INK};">${escapeHtml(item)}</td>
    </tr>`,
  )
  .join("\n")}
</table>`;
}

/** A quoted callout box, for someone's own words (an enquiry message). */
function quoteBox(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:${PAPER_2};border-left:3px solid ${PROVEN};border-radius:0 8px 8px 0;">
    <tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:${INK};font-style:italic;">&ldquo;${escapeHtml(text)}&rdquo;</td></tr>
  </table>`;
}

/** A compact, de-emphasised record of the transaction - present for the buyer's own books, not the headline. */
function recordBox(pairs: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 4px;background:${PAPER_2};border-radius:8px;">
    <tr><td style="padding:16px 20px;">
      <div style="font-family:${MONO_FONT};font-weight:700;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${INK_FAINT};margin-bottom:8px;">For your records</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${pairs
          .map(
            ([k, v]) =>
              `<tr>
                <td style="padding:5px 0;font-size:12.5px;color:${INK_SOFT};border-top:1px solid ${RULE};">${escapeHtml(k)}</td>
                <td align="right" style="padding:5px 0;font-size:12.5px;color:${INK};font-weight:500;border-top:1px solid ${RULE};">${escapeHtml(v)}</td>
              </tr>`,
          )
          .join("")}
      </table>
    </td></tr>
  </table>`;
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
  /** UPI RRN / bank reference from Razorpay's acquirer_data - what shows up in the buyer's own statement. */
  bankReference?: string | null;
  amountPaise: number;
  paidAt: string;
  validUntil: string | null;
  plan: Plan;
  siteUrl: string;
  tempPassword?: string;
};

/**
 * Deliberately not shaped like a receipt: the emotional job of this email is
 * "welcome, this is real and it starts now", not "here is a document to
 * file". The transaction detail buyers actually need for their books is
 * still all here, just in `recordBox` near the bottom rather than leading -
 * see the celebratory framing throughout the visible body instead.
 */
export function membershipActivated(input: MembershipEmailInput): Rendered {
  const gst = gstBreakdown(input.amountPaise, input.plan.gstRate);
  const firstName = input.name?.trim().split(/\s+/)[0] ?? null;
  const institution = input.institution ?? "your institution";
  const phoneDigits = COMPANY.phones[0].replace(/[^\d+]/g, "");

  const pairs: [string, string][] = [
    ["Membership no.", input.memberNo],
    ["Reference ID", input.orderRef],
    ["UPI / bank reference", input.bankReference ?? "-"],
    ["Transaction ID", input.transactionId ?? "-"],
    ["Amount paid", `${formatInr(gst.totalPaise)} (incl. GST)`],
    ["Paid on", formatDate(input.paidAt)],
    ["Valid until", input.validUntil ? formatDate(input.validUntil) : "-"],
  ];

  const html = heroLayout({
    eyebrow: "Membership activated",
    title: `Congratulations${firstName ? `, ${escapeHtml(firstName)}` : ""} - you&rsquo;re in.`,
    preheader: `${institution}'s Nano GCC membership is active. Here's what happens next.`,
    accent: PROVEN,
    body: `
      ${paragraph(
        `<strong>${escapeHtml(institution)}</strong>&rsquo;s Nano GCC membership is now active. ` +
          `We&rsquo;re genuinely glad to have you - this is the start of a working relationship, not just a transaction.`,
      )}

      <div style="font-family:${MONO_FONT};font-weight:700;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${INK_FAINT};margin:26px 0 4px;">Your membership includes</div>
      ${checklist(input.plan.includes, PROVEN)}

      ${paragraph(
        `Our team will be in touch shortly to help you get the most out of it. In the meantime, reach us any time:`,
      )}
      ${buttonRow([
        { href: `tel:${phoneDigits}`, label: "Call us", primary: true },
        { href: `mailto:${COMPANY.email}`, label: "Email us", primary: false },
      ])}
      ${paragraph(
        `Thank you for being part of the Nano GCC ecosystem - we&rsquo;re looking forward to what ${escapeHtml(
          institution,
        )} builds with it.`,
      )}
      ${input.tempPassword ? `
        <div style="font-family:${MONO_FONT};font-weight:700;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${INK_FAINT};margin:26px 0 4px;">Portal Access</div>
        ${rows([
          ["Login Email", input.email],
          ["Temporary Password", input.tempPassword],
        ])}
      ` : ""}
      ${button(`${input.siteUrl}/portal/login`, "Log in to your portal")}
      ${recordBox(pairs)}
    `,
  });

  const text = [
    `Congratulations${firstName ? `, ${firstName}` : ""} - you're in.`,
    "",
    `${institution}'s Nano GCC membership is now active. We're genuinely glad to have you - this is the start of a working relationship, not just a transaction.`,
    "",
    "Your membership includes:",
    ...input.plan.includes.map((i) => `  - ${i}`),
    "",
    "Our team will be in touch shortly. In the meantime, reach us any time:",
    `  Call: ${COMPANY.phones[0]}`,
    `  Email: ${COMPANY.email}`,
    "",
    `Thank you for being part of the Nano GCC ecosystem.`,
    "",
    `Check your status: ${input.siteUrl}/contact/?tab=status&ref=${encodeURIComponent(input.orderRef)}`,
    "",
    "For your records:",
    textRows(pairs),
    "",
    `${COMPANY.legalName} - ${COMPANY.email}`,
  ].join("\n");

  return {
    subject: `You're in - ${institution}'s Nano GCC membership is active`,
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
    ["UPI / bank reference", input.bankReference ?? "-"],
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
        "If this wasn&rsquo;t you, no action is needed - these details were only sent to the address already on the membership.",
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

  return { subject: `Your Nano GCC membership details - ${input.memberNo}`, html, text };
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
    subject: `[Nano GCC] ${input.heading}`,
    html,
    text: `${input.heading}\n\n${textRows(input.pairs)}\n\n${input.adminUrl}`,
  };
}

// ---------------------------------------------------------------------------
// New membership - the admin's own celebratory copy of the moment above,
// built to make acting on it (reply, call) as close to zero-friction as the
// inbox allows.
// ---------------------------------------------------------------------------

export function newMembershipNotification(input: {
  name: string | null;
  institution: string | null;
  email: string;
  phone: string | null;
  /** Their designation, from the enquiry - not stored on the order itself. */
  role: string | null;
  city: string | null;
  /** The enquiry's "anything else we should know" field, if they wrote one. */
  message: string | null;
  memberNo: string;
  orderRef: string;
  transactionId: string | null;
  bankReference?: string | null;
  amountPaise: number;
  paidAt: string;
  adminUrl: string;
}): Rendered {
  const firstName = input.name?.trim().split(/\s+/)[0] ?? "them";
  const institution = input.institution ?? "An institution";
  const phoneDigits = input.phone ? input.phone.replace(/[^\d+]/g, "") : null;

  const who: [string, string][] = [
    ["Name", input.name ?? "-"],
    ["Designation", input.role ?? "-"],
    ["Institution", institution],
    ["Email", input.email],
    ["Phone", input.phone ?? "-"],
    ["City", input.city ?? "-"],
  ];

  const payment: [string, string][] = [
    ["Member no.", input.memberNo],
    ["Reference", input.orderRef],
    ["Bank / UPI ref", input.bankReference ?? "-"],
    ["Transaction", input.transactionId ?? "-"],
    ["Amount", formatInr(input.amountPaise)],
    ["Paid on", formatDate(input.paidAt)],
  ];

  const actions = [
    { href: `mailto:${input.email}?subject=${encodeURIComponent(`Welcome to Nano GCC, ${institution}`)}`, label: `Email ${firstName}`, primary: true },
    ...(phoneDigits ? [{ href: `tel:${phoneDigits}`, label: `Call ${firstName}`, primary: false }] : []),
  ];

  const html = heroLayout({
    eyebrow: "New membership",
    title: `${escapeHtml(institution)} just joined.`,
    preheader: `${input.name ?? "Someone"} from ${institution} activated a Nano GCC membership - ${formatInr(input.amountPaise)}.`,
    accent: SEED,
    body: `
      ${paragraph(`A new institution membership just went through. Here&rsquo;s everything you need to reach out.`)}

      <div style="font-family:${MONO_FONT};font-weight:700;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${INK_FAINT};margin:22px 0 4px;">Who joined</div>
      ${rows(who)}

      ${
        input.message
          ? `<div style="font-family:${MONO_FONT};font-weight:700;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${INK_FAINT};margin:22px 0 4px;">What they told us</div>${quoteBox(input.message)}`
          : ""
      }

      ${buttonRow(actions)}
      ${button(input.adminUrl, "Open in admin panel")}
      ${recordBox(payment)}
    `,
  });

  const text = [
    `${institution} just joined.`,
    "",
    "A new institution membership just went through.",
    "",
    "Who joined:",
    textRows(who),
    ...(input.message ? ["", `What they told us: "${input.message}"`] : []),
    "",
    `Email ${firstName}: ${input.email}`,
    ...(input.phone ? [`Call ${firstName}: ${input.phone}`] : []),
    "",
    "Payment:",
    textRows(payment),
    "",
    input.adminUrl,
  ].join("\n");

  return {
    subject: `New membership: ${institution}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Welcome email with credentials
// ---------------------------------------------------------------------------

export function welcomeEmail(input: {
  roleDisplay: string;
  name: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): Rendered {
  const html = layout({
    title: `Welcome to Nano GCC`,
    preheader: `Your ${input.roleDisplay} account has been created.`,
    body: `
      ${paragraph(`Hello ${escapeHtml(input.name)},`)}
      ${paragraph(`Your <strong>${escapeHtml(input.roleDisplay)}</strong> account for Nano GCC has been created.`)}
      ${paragraph(`You can log in to your portal using the credentials below:`)}
      ${rows([
        ["Login URL", input.loginUrl],
        ["Email", input.email],
        ["Temporary Password", input.tempPassword],
      ])}
      ${paragraph(`Please log in and change your password immediately.`)}
      ${button(input.loginUrl, "Log in to Portal")}
    `,
  });

  const text = [
    `Hello ${input.name},`,
    "",
    `Your ${input.roleDisplay} account for Nano GCC has been created.`,
    "",
    "You can log in to your portal using the credentials below:",
    `  Login URL: ${input.loginUrl}`,
    `  Email: ${input.email}`,
    `  Temporary Password: ${input.tempPassword}`,
    "",
    "Please log in and change your password immediately.",
    "",
    `${COMPANY.legalName} - ${COMPANY.email}`,
  ].join("\n");

  return { subject: `Welcome to Nano GCC - Your Account Details`, html, text };
}
