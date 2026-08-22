# Cross-domain order-creation contract

Razorpay's live gateway is not approved for this domain, so Summit-2026
(`vd8761/Summit-2026`) creates the Razorpay order on our behalf. What changed
since this doc was first written: **the buyer no longer leaves this site.**
`/checkout` (`src/app/checkout/`) is a real page on this domain the whole way
through - the only cross-domain step left is one CORS-enabled `fetch()` call
to Summit-2026's order-creation API, invisible to the buyer. No redirect, no
iframe, no other domain ever shown. Real top-level navigation throughout is
what keeps UPI app-switching, netbanking redirects and OTP pages working
normally.

This document was originally written to match the architecture implemented
for `dosmembership`/originbi.com (see git history) - the JWT handoff shape,
signature verification and the dual-completion-path guarantee below are all
unchanged from that design, just now consumed by our own page instead of a
page on the other domain. The differences from `dosmembership` are listed in
[What differs from dosmembership](#what-differs-from-dosmembership).

---

## The flow

```
/contact (Institution tab)
  └─ POST /api/enquiry              → enquiry + order rows, amount from pricing.ts
     └─ browser navigates to  /checkout?token=<JWT>            (this domain)
        └─ /checkout POSTs the token to Summit-2026's create-order API (CORS, cross-origin)
           └─ Summit-2026 verifies the JWT, creates the Razorpay order, returns it
              └─ /checkout opens the Razorpay modal itself
                 ├─ POST /api/webhooks/originbi   ← fast path, same-origin now
                 ├─ POST /api/webhooks/razorpay   ← guarantee, server-to-server
                 └─ redirect → /membership/return/?ref=…&payment=success
```

Two independent paths report the payment. That redundancy is deliberate — see
[Why both](#why-both-completion-paths).

---

## 1. The handoff token

We redirect to `ORIGINBI_CHECKOUT_URL` with a single `token` query parameter: a
standard **HS256 JWT** signed with the shared `CROSS_DOMAIN_SECRET`.

Claims:

| Claim          | Example                                   | Notes |
|----------------|-------------------------------------------|-------|
| `ref`          | `DOS-A1B2C3D4E5F6`                        | Our order reference. **Echo it back.** |
| `amount`       | `2500000`                                 | Paise, GST-inclusive. Charge exactly this. |
| `currency`     | `INR`                                     | |
| `name`         | `A. Kumar`                                | |
| `email`        | `head@institution.edu`                    | Prefill the modal. |
| `phone`        | `+91 98400 12345`                         | Prefill the modal. |
| `organization` | `PSG College of Technology`               | |
| `tier`         | `institution-annual`                      | Plan identifier. |
| `callback`     | `https://<site>/membership/return/`       | Where to return the buyer. |
| `notify`       | `https://<site>/api/webhooks/originbi`    | Where to POST completion. |
| `iat` / `exp`  | standard                                  | 15-minute lifetime. |

`callback` and `notify` are carried in the token, but the current
`/nanogcc/checkout` implementation does not read them - it follows
dosmembership's pattern of one dedicated route/page per product, each
hardcoded to its own domain. They're kept in the JWT anyway: it costs
nothing, keeps this document accurate if a future dynamic-routing checkout
page is ever built, and a value that's wrong or stale is harmless since
nothing currently reads it.

Verification is ordinary `jsonwebtoken`:

```js
const jwt = require("jsonwebtoken");

let claims;
try {
  claims = jwt.verify(req.query.token, process.env.CROSS_DOMAIN_SECRET, {
    algorithms: ["HS256"],   // pin it — never accept alg from the token
  });
} catch {
  return res.status(401).json({ error: "Invalid or expired token" });
}
```

Pinning `algorithms` matters: without it a forged token can declare
`"alg":"none"` and arrive unsigned.

Our side is `signJwt()` in `src/lib/jwt.ts`. Standard wire format, so
`jsonwebtoken` reads it without any special handling.

---

## 2. Creating the Razorpay order

Two fields are load-bearing. Without them neither completion path can tell
which of our orders a payment belongs to:

```js
const order = await rzp.orders.create({
  amount: claims.amount,       // already paise — do not multiply
  currency: claims.currency,
  receipt: claims.ref,         // ← DOS-XXXXXXXXXXXX
  notes: {
    order_ref: claims.ref,     // ← same value
    site: "nanogcc",           // ← so we ignore originbi's other traffic
  },
});
```

`notes.site` is what lets one Razorpay account serve `dosmembership`,
originbi's own business, and this site. Our webhook drops any event whose
`notes.site` is anything other than `nanogcc`.

---

## 3. Reporting completion

In the Razorpay success handler, POST to the `notify` URL from the token:

```jsonc
{
  "ref": "DOS-A1B2C3D4E5F6",          // from the token
  "razorpay_order_id": "order_xxx",   // REQUIRED — see below
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "9f3c…",
  "method": "upi"                     // optional
}
```

> **`razorpay_order_id` is required.** The `dosmembership` doc lists only
> `razorpay_payment_id` and `razorpay_signature`, but the signature is
> `HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET)` — it cannot be verified
> without the order id. If that field is currently omitted, please add it.

We verify that signature with our own `RAZORPAY_KEY_SECRET` before writing
anything. **Nothing else in the body is trusted** — amount, plan and identity
all come from our own order row, looked up by `ref`. So a forged POST cannot
mint a membership, and a tampered amount cannot change what we recorded.

Responses:

| Status | Meaning |
|--------|---------|
| `200`  | Recorded. Body carries `orderRef`, `memberNo` and a ready-made `redirect` URL. |
| `401`  | Signature failed. Do **not** redirect as success. |
| `404`  | Unknown `ref`. |
| `5xx`  | Retry once or twice, then redirect anyway — the Razorpay webhook covers it. |

The endpoint is idempotent: posting the same payment twice returns the same
membership number and sends no second email. Retrying on a flaky mobile
connection is safe and encouraged.

CORS is configured for the origin of `ORIGINBI_CHECKOUT_URL`, and `OPTIONS`
preflight is handled.

---

## 4. Returning the buyer

Redirect to the `callback` from the token, with the reference:

```
https://<site>/membership/return/?ref=DOS-A1B2C3D4E5F6&payment=success
```

The 200 response from step 3 hands you this URL as `redirect`, already built —
easiest to use that verbatim.

Redirect on **every** outcome, including failure and cancellation. The page
reads the true state from our database and renders accordingly; it does not
trust `payment=success` for anything except tone of voice. Do not try to render
an outcome on originbi's side.

If the reference is ever dropped, a bare `?payment=success` on any page of our
site is caught and forwarded — the buyer sees a thank-you rather than the
homepage. It is a fallback, not a substitute for sending `ref`.

---

## Why both completion paths

The POST in step 3 originates **in the buyer's browser**. If the tab closes
between Razorpay returning success and that request landing — and that is
exactly the moment people close the tab, because they think they are done —
the money is captured and the request never arrives. A `fetch()` from a page
that no longer exists retries nothing.

So this site also registers a **server-side Razorpay webhook**. Razorpay signs
it and retries until it gets a 2xx, entirely independent of the browser.

| | Fast path (step 3) | Guarantee (Razorpay webhook) |
|---|---|---|
| Origin | buyer's browser | Razorpay's servers |
| Survives tab closing | no | yes |
| Retried | no | yes, for hours |
| Purpose | instant receipt on screen | never lose a payment |

Both call the same idempotent function, so whichever arrives first does the
work and the second is a no-op. Nothing is charged, emailed or created twice.
A daily cron sweep catches anything both somehow miss, by asking Razorpay's
API directly (Vercel's Hobby plan caps cron jobs to once a day).

**Recommended for `dosmembership` too.** The same hole exists there, and the
fix is one extra webhook URL in the dashboard.

---

## Razorpay dashboard setup

Add a webhook alongside any existing ones:

- **URL** — `https://<this-site>/api/webhooks/razorpay`
- **Events** — `payment.captured`, `payment.failed`, `order.paid`
- **Secret** — generate one, set it as `RAZORPAY_WEBHOOK_SECRET` here

Multiple webhooks on one account are independent: Razorpay delivers every event
to each URL with its own retry schedule. Adding this does not affect
`dosmembership`'s.

---

## What differs from dosmembership

| | dosmembership | This site |
|---|---|---|
| Checkout path | `/dosmembership/checkout` | **`/nanogcc/checkout`** - its own route, not a branch on a claim |
| Order-creation endpoint | `/api/razorpay/create-order.ts` | **`/api/razorpay/create-order-nanogcc.ts`** |
| Checkout page component | `Checkout.tsx` | **`CheckoutNanogcc.tsx`** |
| `amount` unit in the JWT | rupees (`* 100` on originbi's side) | **paise already** - do not multiply |
| `callback` / `notify` | hardcoded in `Checkout.tsx` | hardcoded in `CheckoutNanogcc.tsx` to this site's domain, per the same per-product-route pattern dosmembership uses (not read dynamically from the token, even though the token still carries them) |
| Razorpay order `receipt` / `notes` | timestamp receipt, `notes: {tier, email}` | **`receipt` = our `ref`, `notes: {order_ref, site: "nanogcc", ...}`** - required for our server-side webhook and cron to find the order |
| Completion endpoint | `/api/webhooks/originbi` on dosmembership's host | same path, this site's host |
| `ref` in the completion POST | not sent (no pre-payment order row on dosmembership's side) | **required** - this site looks the order up by it |
| `razorpay_order_id` in POST | sent (the doc text describing dosmembership omits it, but its actual `Checkout.tsx` does send it) | **required** - same reason |
| Server-side Razorpay webhook | none | yes, as the guarantee |
| Email | NodeMailer / AWS SES | Resend, with delivery tracking |
| Product | Fellowship, Standard/Premium tiers | flat ₹25,000 institution membership |

originbi's side of this is implemented as its own route + page + endpoint,
alongside (not replacing) dosmembership's - see `src/App.tsx`,
`src/pages/CheckoutNanogcc.tsx` and `api/razorpay/create-order-nanogcc.ts` in
`originbi_main_website`. Nothing about dosmembership's existing files changes.

---

## Shared secrets checklist

| Variable | Both sides must match |
|---|---|
| `CROSS_DOMAIN_SECRET` | ✅ exactly |
| `RAZORPAY_KEY_SECRET` | ✅ same Razorpay account |
| `RAZORPAY_WEBHOOK_SECRET` | per-webhook; ours is our own |

---

## Checking it works

1. Test card `4111 1111 1111 1111`, any future expiry, any CVV.
2. In the Razorpay dashboard, the order should show `receipt = DOS-…` and both
   `notes` keys.
3. The return URL should carry `?ref=DOS-…`.
4. `/admin/payments/` here should show **paid** with a member number.
5. **Tamper test:** hand-edit `amount` inside the token payload without
   re-signing. originbi must reject it — that is the whole point of the JWT.
6. **Closed-tab test:** pay, then kill the browser before the redirect. The
   membership must still appear, via the Razorpay webhook. If it does not, the
   webhook is not wired up.

If step 4 fails, check Razorpay's webhook delivery log for a non-2xx before
looking anywhere else.
