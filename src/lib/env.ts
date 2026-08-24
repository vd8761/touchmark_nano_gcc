/**
 * Environment access.
 *
 * Reading `process.env` directly scatters typos and silent `undefined`s through
 * the payment path, which is the last place we want them. Everything goes
 * through `required()` instead, which throws loudly at the point of use.
 *
 * Deliberately *not* validated at module load: Next evaluates modules during
 * `next build`, where payment secrets are legitimately absent. Failing then
 * would break the build rather than the request.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env.local for development, or in the Vercel project settings.`,
    );
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },

  get resendApiKey() {
    return required("RESEND_API_KEY");
  },
  get resendWebhookSecret() {
    return required("RESEND_WEBHOOK_SECRET");
  },
  /** e.g. `Nano GCC <membership@touchmarkdes.com>` - must be a verified domain. */
  get resendFrom() {
    return optional("RESEND_FROM_EMAIL", "Nano GCC <onboarding@resend.dev>");
  },

  get razorpayKeyId() {
    return required("RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return required("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return required("RAZORPAY_WEBHOOK_SECRET");
  },

  /** The originbi.com checkout page we hand buyers off to. */
  get originbiCheckoutUrl() {
    return required("ORIGINBI_CHECKOUT_URL");
  },
  /**
   * Shared JWT secret. originbi verifies our handoff token with the identical
   * value, which is what proves the amount was set by our server.
   */
  get crossDomainSecret() {
    return required("CROSS_DOMAIN_SECRET");
  },

  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get cronSecret() {
    return required("CRON_SECRET");
  },

  get siteUrl() {
    return optional("SITE_URL", "https://nanogcc.touchmarkdes.com").replace(/\/$/, "");
  },
  /** Where internal "new enquiry / new payment" notifications land. */
  get adminNotifyEmail() {
    return optional("ADMIN_NOTIFY_EMAIL", "info@touchmarkdes.com");
  },

  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
} as const;

/** True when a variable is present, for features that degrade instead of failing. */
export function hasEnv(name: string): boolean {
  return Boolean(process.env[name]);
}
