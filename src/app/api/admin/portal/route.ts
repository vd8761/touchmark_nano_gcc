import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { badRequest, json, sameOrigin } from "@/lib/request";
import { clean, isEmail, LIMITS } from "@/lib/validate";
import { hashPassword } from "@/lib/crypto";
import { randomBytes } from "node:crypto";
import { send } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { uploadToR2 } from "@/lib/r2";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  let admin = await currentAdmin();
  
  if (admin && !admin.role) {
    const rows = await sql()`select role from admin_users where id = ${admin.id}`;
    if (rows.length > 0) admin.role = rows[0].role;
  }

  if (!admin || admin.role !== "ADMIN") {
    return json({ ok: false, error: `Unauthorized.` }, 401);
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

  switch (body.action) {
    case "create-ecosystem-partner":
      return createEcosystemPartner(body);
    case "create-company":
      return createCompany(body);
    case "assign-student":
      return assignStudent(body);
    default:
      return badRequest("Unknown action.");
  }
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

async function createEcosystemPartner(body: Record<string, unknown>) {
  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const contactPerson = clean(body.contactPerson, LIMITS.name) || name;
  const phone = clean(body.phone, LIMITS.phone);
  const location = clean(body.location, LIMITS.city);
  const country = clean(body.country, LIMITS.city);
  const commissionType = body.commissionType === "FIXED" ? "FIXED" : "PERCENTAGE";
  const commissionValue = Number(body.commissionValue) || 0;
  
  let companies: any[] = [];
  if (typeof body.companies === "string") {
    try { companies = JSON.parse(body.companies); } catch {}
  } else if (Array.isArray(body.companies)) {
    companies = body.companies;
  }

  if (!name || !email || !isEmail(email)) {
    return badRequest("Invalid name or email.");
  }

  try {
    const uploadedDocs = await handleFileUploads(body.documents, 'partners/docs');
    const docProfile = await handleFileUploads(body.docProfile, 'partners/docs');
    const docIncorporation = await handleFileUploads(body.docIncorporation, 'partners/docs');
    const docPhotoId = await handleFileUploads(body.docPhotoId, 'partners/docs');
    const docAddressProof = await handleFileUploads(body.docAddressProof, 'partners/docs');
    const docTaxRegistration = await handleFileUploads(body.docTaxRegistration, 'partners/docs');
    const docBankVerification = await handleFileUploads(body.docBankVerification, 'partners/docs');
    const taxForm = await handleFileUploads(body.taxForm, 'partners/docs');

    // 1. Create User
    const tempPassword = randomBytes(4).toString("hex");
    const tempPasswordHash = hashPassword(tempPassword);
    
    const resultUser = await sql()`
      insert into admin_users (email, password_hash, name, role)
      values (${email}, ${tempPasswordHash}, ${contactPerson}, 'ECOSYSTEM_PARTNER')
      returning id
    `;
    const userId = resultUser[0]?.id;

    const registeredAddress = clean(body.registeredAddress as string, LIMITS.city);
    const primaryTargetMarket = clean(body.primaryTargetMarket as string, LIMITS.city);
    const experienceYears = clean(body.experienceYears as string, 50);
    const bankName = clean(body.bankName as string, LIMITS.name);
    const bankAccount = clean(body.bankAccount as string, 100);
    const bankIfsc = clean(body.bankIfsc as string, 50);
    const taxId = clean(body.taxId as string, 50);

    const tradingName = clean(body.tradingName as string, LIMITS.name);
    const partnerType = clean(body.partnerType as string, 50);
    const industrySector = clean(body.industrySector as string, 100);
    const companyNumber = clean(body.companyNumber as string, 100);
    const dateOfIncorporation = clean(body.dateOfIncorporation as string, 50);
    const website = clean(body.website as string, 200);
    const linkedinUrl = clean(body.linkedinUrl as string, 200);
    const timeZone = clean(body.timeZone as string, 50);
    const designation = clean(body.designation as string, 100);
    const altContactName = clean(body.altContactName as string, LIMITS.name);
    const altContactEmail = clean(body.altContactEmail as string, LIMITS.email);
    const altContactPhone = clean(body.altContactPhone as string, LIMITS.phone);
    const preferredLanguages = clean(body.preferredLanguages as string, 100);
    const estimatedCompanies = clean(body.estimatedCompanies as string, 50);
    const descriptionNetwork = clean(body.descriptionNetwork as string, 2000);
    const industryVerticals = clean(body.industryVerticals as string, 500);
    const priorGccExperience = clean(body.priorGccExperience as string, 500);
    const references = clean(body.references as string, 2000);
    const bankHolderName = clean(body.bankHolderName as string, 100);
    const preferredCurrency = clean(body.preferredCurrency as string, 10);

    const contactDetails = JSON.stringify({ 
      phone, location, country, tempPassword,
      tradingName, partnerType, industrySector, companyNumber, dateOfIncorporation, website, linkedinUrl, timeZone,
      designation, altContactName, altContactEmail, altContactPhone, preferredLanguages,
      estimatedCompanies, descriptionNetwork, industryVerticals, priorGccExperience, references,
      registeredAddress, primaryTargetMarket, experienceYears,
      bankHolderName, bankName, bankAccount, bankIfsc, preferredCurrency, taxId,
      documents: {
        docProfile, docIncorporation, docPhotoId, docAddressProof, docTaxRegistration, docBankVerification, taxForm,
        additional: uploadedDocs
      }
    });

    // 2. Create Ecosystem Partner
    const resultPartner = await sql()`
      insert into ecosystem_partners (user_id, name, commission_type, commission_value, contact_details, nda_status)
      values (${userId}, ${name}, ${commissionType}, ${commissionValue}, ${contactDetails}::jsonb, 'ACTIVE')
      returning id
    `;
    const partnerId = resultPartner[0]?.id;

    // 3. Create Linked Companies
    for (const c of companies) {
      const cName = clean(c.name, LIMITS.name);
      const cContactName = clean(c.contactName, LIMITS.name) || cName;
      const cEmail = clean(c.email, LIMITS.email);
      const cPhone = clean(c.phone, LIMITS.phone);
      const cLocation = clean(c.location, LIMITS.city);
      const cCountry = clean(c.country, LIMITS.city);
      if (cName && cEmail && isEmail(cEmail)) {
        const cTempPassword = randomBytes(4).toString("hex");
        const cTempPasswordHash = hashPassword(cTempPassword);
        
        const cUser = await sql()`
          insert into admin_users (email, password_hash, name, role)
          values (${cEmail}, ${cTempPasswordHash}, ${cName}, 'COMPANY')
          returning id
        `;
        const cUserId = cUser[0]?.id;
        const cContactDetails = JSON.stringify({ phone: cPhone, location: cLocation, country: cCountry, tempPassword: cTempPassword });
        await sql()`
          insert into companies (user_id, ecosystem_partner_id, name, commission_type, commission_value, contact_details, nda_status)
          values (${cUserId}, ${partnerId}, ${cName}, 'PERCENTAGE', 0, ${cContactDetails}::jsonb, 'ACTIVE')
        `;
        const loginUrl = `${env.siteUrl}/portal/login`;
        await send({
          to: cEmail,
          template: "welcome-company",
          message: welcomeEmail({
            roleDisplay: "Company",
            name: cContactName,
            email: cEmail,
            tempPassword: cTempPassword,
            loginUrl
          })
        }).catch(console.error);
      }
    }

    const loginUrl = `${env.siteUrl}/portal/login`;
    await send({
      to: email,
      template: "welcome-partner",
      message: welcomeEmail({
        roleDisplay: "Ecosystem Partner",
        name: contactPerson,
        email,
        tempPassword,
        loginUrl
      })
    }).catch(console.error);

    return json({ ok: true, userId });
  } catch (err: any) {
    console.error("Error creating ecosystem partner:", err);
    if (err.message && err.message.includes("unique constraint")) {
      return json({ ok: false, error: "An account with this email already exists." }, 400);
    }
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}


async function createCompany(body: Record<string, unknown>) {
  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const contactPerson = clean(body.contactPerson, LIMITS.name) || name;
  const phone = clean(body.phone, LIMITS.phone);
  const location = clean(body.location, LIMITS.city);
  const country = clean(body.country, LIMITS.city);
  const partnerId = typeof body.ecosystemPartnerId === "string" && body.ecosystemPartnerId.length > 0 ? body.ecosystemPartnerId : null;
  const commissionType = body.commissionType === "FIXED" ? "FIXED" : "PERCENTAGE";
  const commissionValue = Number(body.commissionValue) || 0;

  if (!name || !email || !isEmail(email)) {
    return badRequest("Invalid name or email.");
  }

  try {
    const uploadedDocs = await handleFileUploads(body.documents, 'corporates/docs');
    const docProfile = await handleFileUploads(body.docProfile, 'corporates/docs');
    const docIncorporation = await handleFileUploads(body.docIncorporation, 'corporates/docs');
    const docTaxRegistration = await handleFileUploads(body.docTaxRegistration, 'corporates/docs');
    const docAuthSignatoryId = await handleFileUploads(body.docAuthSignatoryId, 'corporates/docs');
    const docLogo = await handleFileUploads(body.docLogo, 'corporates/docs');
    const docPrivacyPolicy = await handleFileUploads(body.docPrivacyPolicy, 'corporates/docs');

    // 1. Create User
    const tempPassword = randomBytes(4).toString("hex");
    const tempPasswordHash = hashPassword(tempPassword);

    const resultUser = await sql()`
      insert into admin_users (email, password_hash, name, role)
      values (${email}, ${tempPasswordHash}, ${name}, 'COMPANY')
      returning id
    `;
    const userId = resultUser[0]?.id;

    const registeredAddress = clean(body.registeredAddress as string, LIMITS.city);
    const interestAreas = clean(body.interestAreas as string, 200);
    const engagementRequirements = clean(body.engagementRequirements as string, 1000);

    const tradingName = clean(body.tradingName as string, LIMITS.name);
    const companyType = clean(body.companyType as string, 50);
    const industrySector = clean(body.industrySector as string, 100);
    const companyNumber = clean(body.companyNumber as string, 100);
    const yearEstablished = clean(body.yearEstablished as string, 10);
    const companySize = clean(body.companySize as string, 50);
    const companyTurnover = clean(body.companyTurnover as string, 100);
    const website = clean(body.website as string, 200);
    const linkedinUrl = clean(body.linkedinUrl as string, 200);
    
    const operatingAddress = clean(body.operatingAddress as string, LIMITS.city);
    const designation = clean(body.designation as string, 100);
    const altContactName = clean(body.altContactName as string, LIMITS.name);
    const altContactEmail = clean(body.altContactEmail as string, LIMITS.email);
    const altContactPhone = clean(body.altContactPhone as string, LIMITS.phone);
    const introducedBy = clean(body.introducedBy as string, 100);
    
    const engagementTypes = clean(body.engagementTypes as string, 200);
    const techDomains = clean(body.techDomains as string, 200);
    const estimatedInterns = clean(body.estimatedInterns as string, 50);
    const engagementMode = clean(body.engagementMode as string, 50);
    const preferredLocation = clean(body.preferredLocation as string, 200);
    const targetStartDate = clean(body.targetStartDate as string, 50);
    const budgetRange = clean(body.budgetRange as string, 100);
    const nanoGccObjective = clean(body.nanoGccObjective as string, 2000);

    const contactDetails = JSON.stringify({ 
      phone, location, country, tempPassword,
      tradingName, companyType, industrySector, companyNumber, yearEstablished, companySize, companyTurnover, website, linkedinUrl,
      registeredAddress, operatingAddress,
      designation, altContactName, altContactEmail, altContactPhone, introducedBy,
      interestAreas, engagementRequirements, engagementTypes, techDomains, estimatedInterns, engagementMode, preferredLocation, targetStartDate, budgetRange, nanoGccObjective,
      documents: {
        docProfile, docIncorporation, docTaxRegistration, docAuthSignatoryId, docLogo, docPrivacyPolicy,
        additional: uploadedDocs
      }
    });

    // 2. Create Company
    await sql()`
      insert into companies (user_id, ecosystem_partner_id, name, commission_type, commission_value, contact_details, nda_status)
      values (${userId}, ${partnerId}, ${name}, 'PERCENTAGE', 0, ${contactDetails}::jsonb, 'ACTIVE')
    `;

    const loginUrl = `${env.siteUrl}/portal/login`;
    await send({
      to: email,
      template: "welcome-company",
      message: welcomeEmail({
        roleDisplay: "Company",
        name: contactPerson,
        email,
        tempPassword,
        loginUrl
      })
    }).catch(console.error);

    return json({ ok: true, userId });
  } catch (err: any) {
    console.error("Error creating company:", err);
    if (err.message && err.message.includes("unique constraint")) {
      return json({ ok: false, error: "An account with this email already exists." }, 400);
    }
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}

async function assignStudent(body: Record<string, unknown>) {
  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const category = body.category === "INTERNSHIP" ? "INTERNSHIP" : "OFFER";
  const companyId = typeof body.companyId === "string" && body.companyId.length > 0 ? body.companyId : null;
  const startDate = typeof body.startDate === "string" && body.startDate.length > 0 ? body.startDate : null;
  const completionDate = typeof body.completionDate === "string" && body.completionDate.length > 0 ? body.completionDate : null;
  
  if (!name || !email || !isEmail(email)) {
    return badRequest("Invalid name or email.");
  }

  const uploadedDocs = await handleFileUploads(body.documents, 'students/docs');
  const docResume = await handleFileUploads(body.docResume, 'students/docs');
  const docPhotoId = await handleFileUploads(body.docPhotoId, 'students/docs');
  const docEduCerts = await handleFileUploads(body.docEduCerts, 'students/docs');
  const docPhoto = await handleFileUploads(body.docPhoto, 'students/docs');

  const dob = clean(body.dob as string, 50);
  const phone = clean(body.phone as string, 50);
  const nationality = clean(body.nationality as string, 50);
  const countryResidence = clean(body.countryResidence as string, 50);
  const address = clean(body.address as string, 500);
  const gender = clean(body.gender as string, 20);
  const emergencyContactName = clean(body.emergencyContactName as string, 100);
  const emergencyContactPhone = clean(body.emergencyContactPhone as string, 50);
  const linkedinUrl = clean(body.linkedinUrl as string, 200);
  const portfolioUrl = clean(body.portfolioUrl as string, 200);

  const currentStatus = clean(body.currentStatus as string, 50);
  const institutionName = clean(body.institutionName as string, 100);
  const highestQualification = clean(body.highestQualification as string, 100);
  const fieldOfStudy = clean(body.fieldOfStudy as string, 100);
  const yearOfGraduation = clean(body.yearOfGraduation as string, 10);
  const cgpa = clean(body.cgpa as string, 20);
  
  const technicalSkills = clean(body.technicalSkills as string, 500);
  const areasOfInterest = clean(body.areasOfInterest as string, 200);
  const certifications = clean(body.certifications as string, 200);
  const languages = clean(body.languages as string, 200);
  const priorExperience = clean(body.priorExperience as string, 500);

  const preferredEngagement = clean(body.preferredEngagement as string, 100);
  const engagementMode = clean(body.engagementMode as string, 50);
  const preferredLocation = clean(body.preferredLocation as string, 200);
  const noticePeriod = clean(body.noticePeriod as string, 50);

  const consentPrivacy = body.consentPrivacy === 'on';
  const consentTerms = body.consentTerms === 'on';
  const consentMarketing = body.consentMarketing === 'on';

  const profileData = JSON.stringify({
    dob, phone, nationality, countryResidence, address, gender, emergencyContactName, emergencyContactPhone, linkedinUrl, portfolioUrl,
    currentStatus, institutionName, highestQualification, fieldOfStudy, yearOfGraduation, cgpa,
    technicalSkills, areasOfInterest, certifications, languages, priorExperience,
    preferredEngagement, engagementMode, preferredLocation, noticePeriod,
    consents: { privacy: consentPrivacy, terms: consentTerms, marketing: consentMarketing },
    documents: {
      docResume, docPhotoId, docEduCerts, docPhoto,
      additional: uploadedDocs
    }
  });

  await sql()`
    insert into students (name, email, company_id, category, duration, stipend, lpa, start_date, completion_date, profile_data)
    values (
      ${name}, 
      ${email}, 
      ${companyId}, 
      ${category},
      ${typeof body.duration === "string" ? body.duration : null},
      ${Number(body.stipend) || null},
      ${Number(body.lpa) || null},
      ${startDate},
      ${completionDate},
      ${profileData}::jsonb
    )
  `;

  return json({ ok: true });
}
