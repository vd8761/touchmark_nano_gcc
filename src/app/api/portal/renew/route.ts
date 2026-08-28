import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/request";
import { buildCheckoutUrl, createOrReuseOrder } from "@/lib/payments";
import { PLANS } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await currentAdmin();
    if (!user || user.role !== "COLLEGE") {
      return badRequest("Unauthorized");
    }

    const q = sql();
    const records = await q`
      select * from memberships where lower(email) = ${user.email.toLowerCase()} order by created_at desc limit 1
    `;
    const membership = records[0];

    if (!membership) {
      return badRequest("No active membership found to renew.");
    }

    const plan = "institution-annual";

    // Create a new order for the renewal
    const order = await createOrReuseOrder({
      enquiryId: null,
      email: membership.email,
      name: membership.name || "Administrator",
      phone: membership.profile_data?.facultyCoordinatorPhone || "0000000000",
      organization: membership.institution || "Institution",
      plan,
    });

    if (!order) {
      throw new Error("Could not initialize checkout order.");
    }

    const checkoutUrl = buildCheckoutUrl(order);

    // Redirect to checkout URL
    return new Response(null, {
      status: 303,
      headers: { Location: checkoutUrl },
    });

  } catch (err: any) {
    console.error("Renewal Error:", err);
    return badRequest(err.message || "Failed to process renewal");
  }
}
