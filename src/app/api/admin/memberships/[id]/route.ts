import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isEmail } from "@/lib/validate";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const id = params.id;
    if (!id) return NextResponse.json({ ok: false, error: "Missing ID" }, { status: 400 });

    const formData = await request.formData();
    const institution = String(formData.get("institution") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!institution || !email || !isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid institution name or email." }, { status: 400 });
    }

    const feeStr = formData.get("membershipFee") as string;
    const membershipFee = feeStr ? parseInt(feeStr, 10) : 0;
    const amountPaise = isNaN(membershipFee) ? 0 : membershipFee * 100;

    const validUntilStr = formData.get("validUntil") as string;
    const validUntil = validUntilStr ? new Date(validUntilStr).toISOString() : null;

    // Optional fields mapping
    const getValue = (key: string) => String(formData.get(key) ?? "").trim();

    const profileData = {
      institutionType: getValue("institutionType"),
      affiliatingUniversity: getValue("affiliatingUniversity"),
      accreditation: getValue("accreditation"),
      country: getValue("country"),
      state: getValue("state"),
      campusAddress: getValue("campusAddress"),
      website: getValue("website"),
      yearEstablished: getValue("yearEstablished"),
      studentStrength: getValue("studentStrength"),
      designation: getValue("designation"),
      department: getValue("department"),
      facultyCoordinatorName: getValue("facultyCoordinatorName"),
      facultyCoordinatorEmail: getValue("facultyCoordinatorEmail"),
      facultyCoordinatorPhone: getValue("facultyCoordinatorPhone"),
      programsOffered: getValue("programsOffered"),
      keyTechDepartments: getValue("keyTechDepartments"),
      eligibleStudents: getValue("eligibleStudents"),
      academicCalendar: getValue("academicCalendar"),
      facultyStrength: getValue("facultyStrength"),
      rdLabs: getValue("rdLabs"),
      researchStrengths: getValue("researchStrengths"),
      industryPartnerships: getValue("industryPartnerships")
    };

    const q = sql();
    
    // Check if membership exists
    const membershipCheck = await q`
      select id, order_id from memberships
      where member_no = ${id} or id::text = ${id}
    `;

    if (membershipCheck.length === 0) {
      return NextResponse.json({ ok: false, error: "Membership not found." }, { status: 404 });
    }

    const orderId = membershipCheck[0].order_id;
    const membershipId = membershipCheck[0].id;

    // Make sure we're not duplicating email across memberships
    const existingEmailCheck = await q`
      select id from memberships 
      where lower(email) = ${email.toLowerCase()} and id != ${membershipId}
    `;

    if (existingEmailCheck.length > 0) {
      return NextResponse.json({ ok: false, error: "An institution with this email already exists." }, { status: 400 });
    }

    // Merge existing profile_data with the new data
    // We do this to not overwrite uploaded documents (docProfile, etc)
    const existingProfile = await q`
      select profile_data from memberships where id = ${membershipId}
    `;
    const existingDocs = existingProfile[0]?.profile_data?.documents || {};

    const fullProfileData = {
      ...profileData,
      documents: existingDocs // preserve existing documents for now, until file upload edit is implemented
    };

    // Update order amount
    await q`
      update orders 
      set amount_paise = ${amountPaise}, email = ${email}, name = ${name}, phone = ${phone}, organization = ${institution}
      where id = ${orderId}
    `;

    // Update membership
    await q`
      update memberships
      set email = ${email}, name = ${name}, institution = ${institution}, valid_until = ${validUntil}, profile_data = ${JSON.stringify(fullProfileData)}::jsonb, updated_at = now()
      where id = ${membershipId}
    `;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error updating membership:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
