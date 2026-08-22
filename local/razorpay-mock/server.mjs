/**
 * Razorpay mock.
 *
 * Covers the surface this project actually uses:
 *
 *   POST /v1/orders                  create an order
 *   GET  /v1/orders?receipt=…        lookup by receipt   (reconciliation)
 *   GET  /v1/orders/:id/payments     payments on an order (reconciliation)
 *   GET  /checkout.js                a window.Razorpay with the real shape
 *
 * Signatures are computed exactly as Razorpay computes them, so nothing in the
 * application is relaxed or bypassed for local use:
 *
 *   razorpay_signature  = HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET)
 *   x-razorpay-signature = HMAC_SHA256(raw webhook body, WEBHOOK_SECRET)
 *
 * State is in memory: restarting the container clears it, which is usually
 * what you want between test runs.
 */

import { createServer } from "node:http";
import { createHmac, randomBytes } from "node:crypto";

const PORT = Number(process.env.PORT ?? 4002);
const KEY_SECRET = process.env.KEY_SECRET ?? "localrazorpaykeysecret";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "localrazorpaywebhooksecret";
const APP_URL = process.env.APP_URL ?? "http://host.docker.internal:3000";

const log = (...args) => console.log("[razorpay-mock]", ...args);

/** @type {Map<string, object>} */
const orders = new Map();
/** @type {Map<string, object[]>} */
const paymentsByOrder = new Map();

const id = (prefix) => `${prefix}_${randomBytes(9).toString("hex")}`;

// ---------------------------------------------------------------------------

function paymentSignature(orderId, paymentId) {
  return createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
}

async function fireWebhook(event, order, payment) {
  const body = JSON.stringify({
    entity: "event",
    event,
    payload: {
      payment: { entity: payment },
      order: { entity: order },
    },
    created_at: Math.floor(Date.now() / 1000),
  });

  const signature = createHmac("sha256", WEBHOOK_SECRET).update(body, "utf8").digest("hex");

  try {
    const res = await fetch(`${APP_URL}/api/webhooks/razorpay`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signature,
        "x-razorpay-event-id": id("evt"),
      },
      body,
    });
    log(`webhook ${event} -> ${res.status}`);
  } catch (err) {
    log(`webhook ${event} failed:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// The stand-in checkout script.
//
// Exposes enough of window.Razorpay that originbi's page can be written the
// same way it is against the real library - `new Razorpay(opts).open()`, with
// `handler` and `modal.ondismiss` callbacks.
// ---------------------------------------------------------------------------

const CHECKOUT_JS = `
(function () {
  function Razorpay(options) { this.options = options; }

  Razorpay.prototype.open = function () {
    var o = this.options;
    var rupees = (o.amount / 100).toLocaleString("en-IN", {
      style: "currency", currency: o.currency || "INR"
    });

    var wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;background:rgba(13,54,79,.72);display:grid;place-items:center;z-index:99999;font-family:system-ui,sans-serif";
    wrap.innerHTML =
      '<div style="background:#fff;max-width:380px;width:92%;border-radius:8px;padding:26px;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
        '<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a99a3">Mock gateway - no money moves</div>' +
        '<div style="font-size:26px;font-weight:600;color:#0D364F;margin:10px 0 2px">' + rupees + '</div>' +
        '<div style="font-size:13px;color:#5A6B75">' + (o.prefill && o.prefill.email || "") + '</div>' +
        '<div style="font-size:11px;color:#8a99a3;margin-top:12px;font-family:ui-monospace,monospace;word-break:break-all">' + o.order_id + '</div>' +
        '<button id="rzp-ok"     style="width:100%;margin-top:20px;padding:13px;border:0;border-radius:5px;background:#0F5E86;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Pay successfully</button>' +
        '<button id="rzp-fail"   style="width:100%;margin-top:9px;padding:13px;border:1px solid #9E480A;border-radius:5px;background:#fff;color:#9E480A;font-size:14px;cursor:pointer">Simulate failure</button>' +
        '<button id="rzp-close"  style="width:100%;margin-top:9px;padding:10px;border:0;background:none;color:#5A6B75;font-size:13px;cursor:pointer">Abandon (close the tab-like dismiss)</button>' +
        '<p style="font-size:11px;line-height:1.5;color:#8a99a3;margin:16px 0 0">Tip: to test the closed-tab case, pay successfully then kill this tab before it redirects. The membership must still appear.</p>' +
      '</div>';
    document.body.appendChild(wrap);

    function post(outcome) {
      return fetch("${"$"}{BASE}/v1/mock/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: o.order_id, outcome: outcome })
      }).then(function (r) { return r.json(); });
    }

    wrap.querySelector("#rzp-ok").onclick = function () {
      this.textContent = "Processing...";
      post("success").then(function (res) {
        wrap.remove();
        if (o.handler) o.handler(res);
      });
    };

    wrap.querySelector("#rzp-fail").onclick = function () {
      post("failed").then(function (res) {
        wrap.remove();
        var cb = Razorpay._failCb;
        if (cb) cb({ error: { description: res.error_description, metadata: { order_id: o.order_id } } });
      });
    };

    wrap.querySelector("#rzp-close").onclick = function () {
      wrap.remove();
      if (o.modal && o.modal.ondismiss) o.modal.ondismiss();
    };
  };

  // The real library uses .on("payment.failed", cb); keep the same call shape.
  Razorpay.prototype.on = function (evt, cb) {
    if (evt === "payment.failed") Razorpay._failCb = cb;
  };

  window.Razorpay = Razorpay;
})();
`;

// ---------------------------------------------------------------------------

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") return json(res, 204, {});

  // --- the checkout script -------------------------------------------------
  if (url.pathname === "/checkout.js") {
    res.writeHead(200, {
      "content-type": "application/javascript",
      "access-control-allow-origin": "*",
    });
    // The browser talks to this mock directly, so bake in a host-visible base.
    return res.end(CHECKOUT_JS.replace("${BASE}", `http://localhost:${PORT}`));
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  const parsed = body ? JSON.parse(body) : {};

  // --- create an order -----------------------------------------------------
  if (req.method === "POST" && url.pathname === "/v1/orders") {
    const order = {
      id: id("order"),
      entity: "order",
      amount: parsed.amount,
      amount_paid: 0,
      amount_due: parsed.amount,
      currency: parsed.currency ?? "INR",
      receipt: parsed.receipt ?? null,
      notes: parsed.notes ?? {},
      status: "created",
      created_at: Math.floor(Date.now() / 1000),
    };

    orders.set(order.id, order);
    paymentsByOrder.set(order.id, []);
    log(`order ${order.id} receipt=${order.receipt} amount=${order.amount}`);

    return json(res, 200, order);
  }

  // --- lookup by receipt, used by reconciliation ---------------------------
  if (req.method === "GET" && url.pathname === "/v1/orders") {
    const receipt = url.searchParams.get("receipt");
    const items = [...orders.values()].filter((o) => !receipt || o.receipt === receipt);
    return json(res, 200, { entity: "collection", count: items.length, items });
  }

  // --- payments on an order, used by reconciliation ------------------------
  const paymentsMatch = url.pathname.match(/^\/v1\/orders\/([^/]+)\/payments$/);
  if (req.method === "GET" && paymentsMatch) {
    const items = paymentsByOrder.get(paymentsMatch[1]) ?? [];
    return json(res, 200, { entity: "collection", count: items.length, items });
  }

  // --- single payment lookup, used to fetch the bank/UPI reference ---------
  // Real Razorpay carries this in payment.acquirer_data; a fake but
  // realistic-looking RRN is enough to prove the fetch-and-store path works.
  const paymentMatch = url.pathname.match(/^\/v1\/payments\/([^/]+)$/);
  if (req.method === "GET" && paymentMatch) {
    const paymentId = paymentMatch[1];
    const payment = [...paymentsByOrder.values()].flat().find((p) => p.id === paymentId);
    if (!payment) return json(res, 404, { error: { description: "No such payment" } });

    return json(res, 200, {
      ...payment,
      acquirer_data: { rrn: String(100000000000 + Math.floor(Math.random() * 899999999999)) },
    });
  }

  // --- the checkout UI reporting an outcome --------------------------------
  if (req.method === "POST" && url.pathname === "/v1/mock/pay") {
    const order = orders.get(parsed.order_id);
    if (!order) return json(res, 404, { error: { description: "Unknown order" } });

    const succeeded = parsed.outcome === "success";

    const payment = {
      id: id("pay"),
      entity: "payment",
      amount: order.amount,
      currency: order.currency,
      status: succeeded ? "captured" : "failed",
      order_id: order.id,
      method: "upi",
      notes: order.notes,
      created_at: Math.floor(Date.now() / 1000),
      ...(succeeded ? {} : { error_description: "Payment declined by the issuing bank (simulated)" }),
    };

    paymentsByOrder.get(order.id).push(payment);
    if (succeeded) {
      order.status = "paid";
      order.amount_paid = order.amount;
      order.amount_due = 0;
    }

    log(`payment ${payment.id} ${payment.status} on ${order.id}`);

    // Real Razorpay fires the webhook independently of the browser, and so
    // does this - on a short delay, so you can watch the return page sit in
    // its "confirming" state before it resolves. That delay is what makes the
    // closed-tab test meaningful.
    //
    // `webhook: false` deliberately drops the delivery, to prove the
    // reconciliation path can recover a payment on its own. There is no way to
    // test that honestly if the webhook always lands.
    if (parsed.webhook === false) {
      log(`webhook SUPPRESSED for ${payment.id} (testing reconciliation)`);
    } else {
      setTimeout(
        () => fireWebhook(succeeded ? "payment.captured" : "payment.failed", order, payment),
        succeeded ? 2500 : 800,
      );
    }

    return json(
      res,
      200,
      succeeded
        ? {
            razorpay_payment_id: payment.id,
            razorpay_order_id: order.id,
            razorpay_signature: paymentSignature(order.id, payment.id),
          }
        : { error_description: payment.error_description, razorpay_order_id: order.id },
    );
  }

  if (url.pathname === "/health") return json(res, 200, { ok: true, orders: orders.size });

  return json(res, 404, { error: { description: `No mock route for ${req.method} ${url.pathname}` } });
});

server.listen(PORT, () => log(`listening on ${PORT}`));
