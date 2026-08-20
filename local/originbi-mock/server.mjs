/**
 * originbi.com mock — and the reference implementation of the contract.
 *
 * This is deliberately written the way the real originbi route should be
 * written, so it can be read as a worked example alongside
 * ORIGINBI-INTEGRATION.md. The three things the real side needs to change are
 * all visible here:
 *
 *   1. `callback` and `notify` are read FROM THE TOKEN, not from constants,
 *      so one checkout page can serve more than one product.
 *   2. `razorpay_order_id` is included in the completion POST — without it the
 *      signature `HMAC(order_id|payment_id)` cannot be verified.
 *   3. The Razorpay order carries `receipt` and `notes.{order_ref,site}`.
 *
 * Only the Razorpay endpoints are mocked. The JWT verification and signature
 * handling are the real algorithms.
 */

import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

const PORT = Number(process.env.PORT ?? 4003);
const CROSS_DOMAIN_SECRET = process.env.CROSS_DOMAIN_SECRET ?? "";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "rzp_test_local000000";
const RAZORPAY_API_INTERNAL = process.env.RAZORPAY_API_INTERNAL ?? "http://razorpay-mock:4002/v1";
const RAZORPAY_API_PUBLIC = process.env.RAZORPAY_API_PUBLIC ?? "http://localhost:4002";

const log = (...args) => console.log("[originbi-mock]", ...args);

// ---------------------------------------------------------------------------
// JWT verification.
//
// The real service would use `jsonwebtoken.verify(token, secret, {
// algorithms: ["HS256"] })`. Hand-rolled here only to keep the container
// dependency-free — the algorithm is identical.
// ---------------------------------------------------------------------------

function verifyJwt(token, secret) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) return null;

  const [head, payload, provided] = parts;

  let header;
  try {
    header = JSON.parse(Buffer.from(head, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // Pinning the algorithm matters: without this check a forged token can
  // declare "alg":"none" and arrive unsigned.
  if (header.alg !== "HS256") return null;

  const expected = createHmac("sha256", secret).update(`${head}.${payload}`).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) return null;

  return claims;
}

// Docker networking note: `notify` and `callback` are used by the BROWSER, not
// by this container, so they stay as the host-visible URLs the token carries.
// Only this server's own call to the Razorpay mock needs a container-internal
// address, and that is RAZORPAY_API_INTERNAL.

const escape = (value) =>
  String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------

function page({ claims, order }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Checkout - originbi.com (mock)</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
         background:#F8F4F0; color:#0D364F; padding:24px; }
  .card { background:#fff; border:1px solid rgba(13,54,79,.14); border-radius:8px;
          padding:32px; max-width:440px; width:100%; }
  .tag { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#8a99a3; }
  h1 { font-size:20px; margin:8px 0 22px; }
  dl { margin:0 0 24px; }
  .row { display:flex; justify-content:space-between; gap:16px; padding:9px 0;
         border-top:1px solid rgba(13,54,79,.1); font-size:14px; }
  .row dt { color:#5A6B75; } .row dd { margin:0; font-weight:500; text-align:right; word-break:break-all; }
  button { width:100%; padding:14px; border:0; border-radius:5px; background:#0F5E86;
           color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  .note { font-size:12px; line-height:1.6; color:#8a99a3; margin-top:18px; }
</style>
</head><body>
<div class="card">
  <div class="tag">originbi.com &middot; mock gateway</div>
  <h1>Complete your DOS Club payment</h1>

  <dl>
    <div class="row"><dt>Reference</dt><dd>${escape(claims.ref)}</dd></div>
    <div class="row"><dt>Name</dt><dd>${escape(claims.name)}</dd></div>
    <div class="row"><dt>Email</dt><dd>${escape(claims.email)}</dd></div>
    <div class="row"><dt>Amount</dt><dd>&#8377;${(claims.amount / 100).toLocaleString("en-IN")}</dd></div>
    <div class="row"><dt>Razorpay order</dt><dd>${escape(order.id)}</dd></div>
  </dl>

  <button id="pay">Pay &#8377;${(claims.amount / 100).toLocaleString("en-IN")}</button>
  <p class="note">Token verified against CROSS_DOMAIN_SECRET. The amount above came
     from inside the signed token, not from the URL &mdash; editing the address bar
     cannot change it.</p>
</div>

<script src="${RAZORPAY_API_PUBLIC}/checkout.js"></script>
<script>
  var CLAIMS = ${JSON.stringify({
    ref: claims.ref,
    amount: claims.amount,
    currency: claims.currency,
    name: claims.name,
    email: claims.email,
    phone: claims.phone,
    callback: claims.callback,
    notify: claims.notify,
  })};
  var ORDER_ID = ${JSON.stringify(order.id)};

  function goHome(extra) {
    var url = new URL(CLAIMS.callback);
    url.searchParams.set("ref", CLAIMS.ref);
    Object.keys(extra || {}).forEach(function (k) { url.searchParams.set(k, extra[k]); });
    window.location.replace(url.toString());
  }

  var rzp = new Razorpay({
    key: ${JSON.stringify(RAZORPAY_KEY_ID)},
    order_id: ORDER_ID,
    amount: CLAIMS.amount,
    currency: CLAIMS.currency,
    name: "DOS Club",
    prefill: { name: CLAIMS.name, email: CLAIMS.email, contact: CLAIMS.phone },

    handler: function (response) {
      // Step 6: report completion. Note razorpay_order_id is included - the
      // signature cannot be verified without it.
      fetch(CLAIMS.notify, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ref: CLAIMS.ref,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          method: "upi"
        })
      })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        // The endpoint hands back a ready-built redirect URL.
        if (data && data.redirect) { window.location.replace(data.redirect); return; }
        goHome({ payment: "success" });
      })
      .catch(function () {
        // Even if this POST fails, the payment happened. Send them to the
        // receipt anyway - the Razorpay webhook is what guarantees the record.
        goHome({ payment: "success" });
      });
    },

    modal: { ondismiss: function () { goHome({ payment: "cancelled" }); } }
  });

  // Redirect on failure too, so the buyer always lands back on our page.
  rzp.on("payment.failed", function () { goHome({ payment: "failed" }); });

  document.getElementById("pay").onclick = function () { rzp.open(); };
  rzp.open();
</script>
</body></html>`;
}

// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  const fail = (status, message) => {
    res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
    res.end(
      `<body style="font-family:system-ui;max-width:520px;margin:80px auto;color:#9E480A">
         <h1 style="font-size:19px">Checkout error</h1><p>${escape(message)}</p></body>`,
    );
  };

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  // The real route is /dosmembership/checkout; accept any *. /checkout so this
  // mock also demonstrates serving a second product from one page.
  if (!url.pathname.endsWith("/checkout")) return fail(404, "Not found.");

  // --- Step 3: verify the handoff token ------------------------------------
  const claims = verifyJwt(url.searchParams.get("token"), CROSS_DOMAIN_SECRET);
  if (!claims) {
    return fail(
      401,
      "Invalid or expired token. Most often this means CROSS_DOMAIN_SECRET differs " +
        "between the two sides, or the 15-minute lifetime elapsed.",
    );
  }

  log(`checkout ${claims.ref} amount=${claims.amount}`);

  // --- Step 4: create the Razorpay order -----------------------------------
  let order;
  try {
    const response = await fetch(`${RAZORPAY_API_INTERNAL}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: claims.amount, // already paise - do not multiply
        currency: claims.currency,
        receipt: claims.ref, // ← required
        notes: {
          order_ref: claims.ref, // ← required
          site: "nanogcc", // ← so the other side ignores unrelated traffic
        },
      }),
    });
    order = await response.json();
  } catch (err) {
    return fail(502, `Could not reach the payment gateway: ${err.message}`);
  }

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page({ claims, order }));
});

server.listen(PORT, () => log(`listening on ${PORT}`));
