import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { badRequest, json, sameOrigin } from "@/lib/request";
import { clean, isEmail, LIMITS } from "@/lib/validate";
import { generateOrderRef, hashPassword } from "@/lib/crypto";
import { uploadToR2 } from "@/lib/r2";
import { send } from "@/lib/email";
import { membershipActivated, newMembershipNotification, welcomeEmail } from "@/lib/email-templates";
import { PLANS } from "@/lib/pricing";
import { env } from "@/lib/env";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  const admin = await currentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown> = {};
  
  const contentType = req.headers.get("content-type") || "";
  
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          if (body[key]) {
            if (Array.isArray(body[key])) {
              (body[key] as File[]).push(value);
            } else {
              body[key] = [body[key], value];
            }
          } else {
            body[key] = value;
          }
        } else {
          body[key] = value;
        }
      }
    } catch {
      return badRequest("Malformed form data.");
    }
  } else {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Malformed request.");
    }
  }

  if (body.action === "create-manual-membership") {
    return createManualMembership(body);
  }

  return badRequest("Unknown action.");
}

async function handleFileUploads(files: File | File[] | unknown, prefix: string): Promise<string[]> {
  if (!files) return [];
  const fileArray = Array.isArray(files) ? files : [files];
  const uploadedUrls: string[] = [];
  
  for (const file of fileArray) {
    if (file instanceof File && file.size > 0 && file.size <= 10 * 1024 * 1024) { // Max 10MB
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop() || 'dat';
      const key = `${prefix}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const url = await uploadToR2(key, buffer, file.type);
      uploadedUrls.push(url);
    }
  }
  return uploadedUrls;
}

async function createManualMembership(body: Record<string, unknown>) {
  const institution = clean(body.institution as string, LIMITS.name);
  const email = clean(body.email as string, LIMITS.email);
  const name = clean(body.name as string, LIMITS.name);
  const phone = clean(body.phone as string, LIMITS.phone);
  const validUntilStr = clean(body.validUntil as string, 50);

  const designation = clean(body.designation as string, LIMITS.name);
  const location = clean(body.location as string, LIMITS.city);
  const country = clean(body.country as string, LIMITS.city);
  const campusAddress = clean(body.campusAddress as string, 500);
  const keyTechDepartments = clean(body.keyTechDepartments as string, 200);
  const rdLabs = clean(body.rdLabs as string, 500);

  const institutionType = clean(body.institutionType as string, 100);
  const affiliatingUniversity = clean(body.affiliatingUniversity as string, 200);
  const accreditation = clean(body.accreditation as string, 200);
  const state = clean(body.state as string, 100);
  const website = clean(body.website as string, 200);
  const yearEstablished = clean(body.yearEstablished as string, 10);
  const studentStrength = clean(body.studentStrength as string, 50);

  const department = clean(body.department as string, 100);
  const facultyCoordinatorName = clean(body.facultyCoordinatorName as string, LIMITS.name);
  const facultyCoordinatorEmail = clean(body.facultyCoordinatorEmail as string, LIMITS.email);
  const facultyCoordinatorPhone = clean(body.facultyCoordinatorPhone as string, LIMITS.phone);
  
  const programsOffered = clean(body.programsOffered as string, 1000);
  const eligibleStudents = clean(body.eligibleStudents as string, 50);
  const academicCalendar = clean(body.academicCalendar as string, 200);
  const facultyStrength = clean(body.facultyStrength as string, 50);
  const researchStrengths = clean(body.researchStrengths as string, 1000);
  const industryPartnerships = clean(body.industryPartnerships as string, 1000);

  if (!institution || !email || !isEmail(email)) {
    return badRequest("Invalid institution name or email.");
  }

  const additionalDocs = await handleFileUploads(body.documents, 'institutions/docs');
  const docProfile = await handleFileUploads(body.docProfile, 'institutions/docs');
  const docAffiliation = await handleFileUploads(body.docAffiliation, 'institutions/docs');
  const docAccreditation = await handleFileUploads(body.docAccreditation, 'institutions/docs');
  const docAuthSignatoryId = await handleFileUploads(body.docAuthSignatoryId, 'institutions/docs');
  const docLogo = await handleFileUploads(body.docLogo, 'institutions/docs');

  const profileData = JSON.stringify({
    institutionType, affiliatingUniversity, accreditation, state, website, yearEstablished, studentStrength,
    designation, department, facultyCoordinatorName, facultyCoordinatorEmail, facultyCoordinatorPhone,
    location, country, campusAddress,
    programsOffered, keyTechDepartments, eligibleStudents, academicCalendar, facultyStrength, rdLabs, researchStrengths, industryPartnerships,
    documents: {
      docProfile, docAffiliation, docAccreditation, docAuthSignatoryId, docLogo,
      additional: additionalDocs
    }
  });

  const q = sql();

  try {
    // 0. Prevent duplicate registrations
    const existing = await q`
      select id from memberships 
      where lower(email) = ${email.trim().toLowerCase()}
    `;
    if (existing.length > 0) {
      return badRequest("An institution with this email already exists.");
    }

    // 1. Create a dummy order for ₹0
    const orderRef = generateOrderRef();
    const insertedOrder = await q`
      insert into orders (order_ref, email, name, phone, organization, plan, amount_paise, currency, status, bank_reference, paid_at)
      values (${orderRef}, ${email}, ${name}, ${phone}, ${institution}, 'institution-annual', 0, 'INR', 'paid', 'MANUAL', now())
      returning id
    `;
    const orderId = insertedOrder[0]?.id;
    if (!orderId) throw new Error("Failed to create manual order.");

    // 2. Create Admin User (COLLEGE role) so they can log in
    const tempPassword = randomBytes(4).toString("hex");
    const tempPasswordHash = hashPassword(tempPassword);
    
    // We try to create the user. If they already exist, we ignore the error (they just keep their existing password)
    let userCreated = false;
    try {
      await q`
        insert into admin_users (email, password_hash, name, role)
        values (${email}, ${tempPasswordHash}, ${name}, 'COLLEGE')
      `;
      userCreated = true;
    } catch (e: any) {
      if (!e.message?.includes("unique constraint")) {
        console.error("Error creating admin user:", e);
      }
    }

    // 3. Create the membership
    const validUntil = validUntilStr ? new Date(validUntilStr) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const result = await q`
      insert into memberships (order_id, member_no, email, name, institution, plan, valid_until, welcome_email_sent_at, profile_data)
      values (
        ${orderId},
        'DOS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('member_no_seq')::text, 4, '0'),
        ${email}, ${name}, ${institution}, 'institution-annual', ${validUntil.toISOString()}, now(), ${profileData}::jsonb
      )
      returning id, member_no
    `;

    const membershipId = result[0]?.id as string;
    const memberNo = result[0]?.member_no as string;

    // 4. Log the initial subscription
    await q`
      insert into membership_subscriptions (membership_id, order_id, valid_from, valid_until)
      values (${membershipId}, ${orderId}, now(), ${validUntil.toISOString()})
    `;

    // Send emails (background, fire and forget)
    const emailData = {
      name,
      memberNo,
      institution,
      email,
      orderRef,
      transactionId: null,
      bankReference: 'MANUAL',
      amountPaise: 0,
      paidAt: new Date().toISOString(),
      validUntil: validUntil.toISOString(),
      plan: PLANS["institution-annual"],
      siteUrl: env.siteUrl,
    };

    await send({
      to: email,
      template: "membership-activated",
      message: membershipActivated(emailData),
    }).catch(console.error);

    await send({
      to: env.adminNotifyEmail,
      template: "new-membership-notification",
      message: newMembershipNotification({
        ...emailData,
        phone,
        role: designation,
        city: location,
        message: null,
        adminUrl: `${env.siteUrl}/admin/memberships/${memberNo}`,
      }),
    }).catch(console.error);

    // Send login details if a new user was created
    if (userCreated) {
      await send({
        to: email,
        template: "welcome-institution",
        message: welcomeEmail({
          roleDisplay: "Academic Partner",
          name: name || "Partner",
          email: email,
          tempPassword: tempPassword,
          loginUrl: `${env.siteUrl}/portal/login`,
        }),
      }).catch(console.error);
    }

    return json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: "Database error: " + message }, 500);
  }
}
