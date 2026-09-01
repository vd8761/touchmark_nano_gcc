import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const params = await props.params;
    const id = params.id;
    if (!id) return NextResponse.json({ ok: false, error: "Missing ID" }, { status: 400 });

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });

    const rawPartnerId = formData.get("ecosystemPartnerId");
    const partnerId = typeof rawPartnerId === "string" && rawPartnerId.trim().length > 0 
      ? rawPartnerId.trim() 
      : null;

    const commissionType = formData.get("commissionType") === "FIXED" ? "FIXED" : "PERCENTAGE";
    const commissionValue = Number(formData.get("commissionValue")) || 0;

    const turnoverCurrent = Number(formData.get("turnoverCurrent")) || 0;
    const turnoverProjected = Number(formData.get("turnoverProjected")) || 0;

    // Fetch existing contact_details
    const existing = await sql()`select contact_details from companies where id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    }

    const currentDetails = existing[0].contact_details || {};

    const updatedDetails = {
      ...currentDetails,
      tradingName: String(formData.get("tradingName") ?? "").trim(),
      companyType: String(formData.get("companyType") ?? "").trim(),
      industrySector: String(formData.get("industrySector") ?? "").trim(),
      companyNumber: String(formData.get("companyNumber") ?? "").trim(),
      yearEstablished: String(formData.get("yearEstablished") ?? "").trim(),
      companySize: String(formData.get("companySize") ?? "").trim(),
      website: String(formData.get("website") ?? "").trim(),
      linkedinUrl: String(formData.get("linkedinUrl") ?? "").trim(),
      country: String(formData.get("country") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      registeredAddress: String(formData.get("registeredAddress") ?? "").trim(),
      operatingAddress: String(formData.get("operatingAddress") ?? "").trim(),
      contactPerson: String(formData.get("contactPerson") ?? "").trim(),
      designation: String(formData.get("designation") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      altContactName: String(formData.get("altContactName") ?? "").trim(),
      altContactEmail: String(formData.get("altContactEmail") ?? "").trim(),
      altContactPhone: String(formData.get("altContactPhone") ?? "").trim(),
      introducedBy: String(formData.get("introducedBy") ?? "").trim(),
      engagementTypes: String(formData.get("engagementTypes") ?? "").trim(),
      techDomains: String(formData.get("techDomains") ?? "").trim(),
      estimatedInterns: String(formData.get("estimatedInterns") ?? "").trim(),
      engagementMode: String(formData.get("engagementMode") ?? "").trim(),
      preferredLocation: String(formData.get("preferredLocation") ?? "").trim(),
      targetStartDate: String(formData.get("targetStartDate") ?? "").trim(),
      budgetRange: String(formData.get("budgetRange") ?? "").trim(),
      nanoGccObjective: String(formData.get("nanoGccObjective") ?? "").trim(),
      additionalInfo: String(formData.get("additionalInfo") ?? "").trim(),
    };

    await sql()`
      update companies 
      set 
        name = ${name},
        ecosystem_partner_id = ${partnerId as any},
        commission_type = ${commissionType},
        commission_value = ${commissionValue},
        turnover_current = ${turnoverCurrent},
        turnover_projected = ${turnoverProjected},
        contact_details = ${JSON.stringify(updatedDetails)},
        updated_at = now()
      where id = ${id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Failed to update company:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
