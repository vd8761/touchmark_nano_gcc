"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * The actual checkout UI - see app/checkout/page.tsx for why this exists as
 * a real page here rather than a redirect to Summit-2026's own domain.
 *
 * Order creation is the one cross-origin call in this flow (Summit-2026's
 * `/api/create-order-nanogcc`, CORS-enabled for exactly this). Everything
 * else - the completion webhook, the return redirect - is same-origin,
 * simpler than when this lived on a different domain entirely.
 */

const RAZORPAY_CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

// Where the order actually gets created. Not a secret - just which account
// creates it - so NEXT_PUBLIC_ (client-exposed) is fine here.
const SUMMIT_ORDER_URL =
  process.env.NEXT_PUBLIC_SUMMIT_GATEWAY_API_URL ||
  "https://summitawards2026.executivescollaboration.com/api/create-order-nanogcc";

type Status = "initializing" | "processing" | "success" | "error" | "cancelled";

type OrderData = {
  orderId: string;
  ref: string;
  amount: number;
  currency: string;
  name?: string;
  email?: string;
  phone?: string;
};

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("initializing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    const initPayment = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("No payment token provided. Please go back and try again.");
        return;
      }

      const loaded = await loadScript(RAZORPAY_CHECKOUT_JS);
      if (!loaded || !(window as any).Razorpay) {
        setStatus("error");
        setErrorMessage("Payment SDK failed to load. Please check your connection and try again.");
        return;
      }

      let orderData: OrderData;
      try {
        const orderResponse = await fetch(SUMMIT_ORDER_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = (await orderResponse.json().catch(() => ({}))) as OrderData & { error?: string };

        if (!orderResponse.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Failed to start payment. Please go back and try again.");
          return;
        }

        orderData = data;
      } catch {
        setStatus("error");
        setErrorMessage("Couldn't reach the payment gateway. Please check your connection and try again.");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DOS Club - Institution Membership",
        description: "Nano GCC institution membership payment",
        order_id: orderData.orderId,
        prefill: {
          name: orderData.name,
          email: orderData.email,
          contact: orderData.phone,
        },
        theme: { color: "#0F5E86" },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          setStatus("success");

          const returnUrl = `/membership/return/?ref=${encodeURIComponent(orderData.ref)}&payment=success`;
          let redirectTo = returnUrl;

          // Retry the fast-path notification a couple of times on a flaky
          // connection, then redirect anyway - the server-side Razorpay
          // webhook is the actual guarantee, not this call.
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const webhookResponse = await fetch("/api/webhooks/originbi", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  ref: orderData.ref,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (webhookResponse.ok) {
                const data = (await webhookResponse.json().catch(() => ({}))) as { redirect?: string };
                if (data.redirect) redirectTo = data.redirect;
                break;
              }

              // Signature/reference rejected - retrying won't help, and the
              // Razorpay webhook will settle it regardless.
              if (webhookResponse.status === 401 || webhookResponse.status === 404) break;
            } catch {
              // Network error - fall through to retry.
            }
          }

          window.location.href = redirectTo;
        },
        modal: {
          ondismiss: function () {
            setStatus("cancelled");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: { error?: { description?: string } }) {
        setStatus("error");
        setErrorMessage(response.error?.description || "Payment failed. Please try again.");
      });

      setStatus("processing");
      rzp.open();
    };

    initPayment();
    // Runs once per page load, reading the token straight from the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        {status === "initializing" && (
          <>
            <div className="checkout-spin" aria-hidden="true" />
            <h1>Initializing secure checkout&hellip;</h1>
            <p>Please wait while we connect to the payment gateway.</p>
          </>
        )}

        {status === "processing" && (
          <>
            <div className="checkout-spin" aria-hidden="true" />
            <h1>Processing payment&hellip;</h1>
            <p>Please complete the payment in the window that opened.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="checkout-badge ok" aria-hidden="true">&#10003;</div>
            <h1>Payment successful!</h1>
            <p>Redirecting you back&hellip;</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="checkout-badge err" aria-hidden="true">&#33;</div>
            <h1>We hit a snag</h1>
            <p>{errorMessage}</p>
            <div className="checkout-acts">
              <button type="button" className="act primary" onClick={() => window.history.back()}>
                Go back
              </button>
            </div>
          </>
        )}

        {status === "cancelled" && (
          <>
            <div className="checkout-badge wait" aria-hidden="true">&#8226;</div>
            <h1>Payment cancelled</h1>
            <p>You closed the payment window. Nothing was charged.</p>
            <div className="checkout-acts">
              <button type="button" className="act primary" onClick={() => window.location.assign("/")}>
                Return to homepage
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
