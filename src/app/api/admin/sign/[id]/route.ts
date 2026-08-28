import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/request";
import { uploadToR2 } from "@/lib/r2";
import { currentAdmin } from "@/lib/auth";
import { generateFormattedPdf } from "@/lib/pdfGenerator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return json({ ok: false, error: "Unauthorized." }, 401);

  const params = await props.params;
  const id = params.id;
  const typeParam = req.nextUrl.searchParams.get("type") || "nda";
  
  if (!id) return badRequest("Missing document ID.");

  let body: { signatureBase64?: string };
  try {
    body = (await req.json()) as any;
  } catch {
    return badRequest("Malformed request.");
  }

  const { signatureBase64 } = body;
  if (!signatureBase64 || typeof signatureBase64 !== "string") {
    return badRequest("Missing signature data.");
  }

  try {
    // 1. Fetch partner or company details
    let p: any = null;
    let type = "";
    
    const partners = await sql()`select * from ecosystem_partners where id = ${id}`;
    if (partners.length > 0) {
      p = partners[0];
      type = "PARTNER";
    } else {
      const companies = await sql()`select * from companies where id = ${id}`;
      if (companies.length > 0) {
        p = companies[0];
        type = "COMPANY";
      } else {
        return badRequest("Signer not found.");
      }
    }

    let docKey = "GENERIC_NDA";
    if (typeParam === 'mou') {
      docKey = type === "PARTNER" ? "PARTNER_MOU" : "COMPANY_MOU";
    } else if (typeParam === 'commission') {
      docKey = "PARTNER_COMMERCIAL_AGREEMENT";
    }

    const docs = await sql()`select title, content_html from legal_documents where document_key = ${docKey}`;
    const doc = docs.length > 0 ? docs[0] : { title: "Legal Agreement", content_html: "<p>No agreement content found.</p>" };
    
    // Replace template variables
    let html = doc.content_html;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const address = p.contact_details?.location ? `${p.contact_details.location}, ${p.contact_details.country || ''}` : '';
    const email = p.email || p.contact_details?.email || '';

    html = html.replace(/(\[|\{\{)COMPANY_NAME(\]|\}\})/gi, p.name || '');
    html = html.replace(/(\[|\{\{)COMPANY NAME(\]|\}\})/gi, p.name || '');
    html = html.replace(/(\[|\{\{)PARTNER_NAME(\]|\}\})/gi, p.name || '');
    html = html.replace(/(\[|\{\{)PARTNER NAME(\]|\}\})/gi, p.name || '');
    html = html.replace(/(\[|\{\{)Ecosystem Partner Name(\]|\}\})/gi, p.name || '');
    html = html.replace(/(\[|\{\{)DATE(\]|\}\})/gi, date);
    html = html.replace(/(\[|\{\{)ADDRESS(\]|\}\})/gi, address);
    html = html.replace(/(\[|\{\{)CONTACT_EMAIL(\]|\}\})/gi, email);
    html = html.replace(/(\[|\{\{)REPRESENTATIVE NAME(\]|\}\})/gi, p.contact_details?.contactPerson || p.name || '');
    html = html.replace(/(\[|\{\{)DESIGNATION(\]|\}\})/gi, p.contact_details?.designation || 'Representative');

    // 2. Extract Partner Signature from DB
    let partnerMetadata: any = null;
    if (typeParam === 'nda') partnerMetadata = p.contact_details?.nda_partner_signature_metadata;
    else if (typeParam === 'mou') partnerMetadata = p.contact_details?.mou_partner_signature_metadata;
    else if (typeParam === 'commission') partnerMetadata = p.contact_details?.commission_partner_signature_metadata;

    if (!partnerMetadata || !partnerMetadata.signatureBase64) {
      return badRequest("Partner signature not found. Partner must sign first.");
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";
    const timestamp = new Date().toISOString();

    // 3. Generate Word-like formatted PDF with both signatures
    const partnerName = p.contact_details?.contactPerson || p.name || "Partner";
    const partnerDesignation = p.contact_details?.designation || "Representative";

    const pdfBuffer = await generateFormattedPdf(
      doc.title,
      html,
      // Left column: Admin (First Party - Touchmark)
      {
        label: "For Touchmark Descience Pvt Ltd",
        name: "Mr. Bharathiraja Thangappalam",
        designation: "Chief Executive Officer",
        date,
        signatureBase64,
      },
      // Right column: Partner (Second Party)
      {
        label: `For ${p.name}`,
        name: partnerName,
        designation: partnerDesignation,
        date,
        signatureBase64: partnerMetadata.signatureBase64,
      }
    );

    // 4. Upload to Cloudflare R2
    const fileName = `${typeParam}_fully_signed_${p.id}_${Date.now()}.pdf`;
    const r2Url = await uploadToR2(fileName, pdfBuffer, "application/pdf");

    // 5. Update Database with final status + URL
    const contactDetails = p.contact_details || {};
    let statusCol = 'nda_status';
    let signedStatus = 'NDA_SIGNED';
    let docUrl = 'nda_document_url';

    const metadata = { 
      partner_ip: partnerMetadata.ip, 
      partner_timestamp: partnerMetadata.timestamp,
      admin_ip: ip,
      admin_userAgent: userAgent,
      admin_timestamp: timestamp 
    };

    if (typeParam === 'nda') {
      contactDetails.nda_document_url = r2Url;
      contactDetails.nda_signature_metadata = metadata;
      delete contactDetails.nda_partner_signature_metadata;
      statusCol = 'nda_status';
      signedStatus = 'NDA_SIGNED';
    } else if (typeParam === 'mou') {
      contactDetails.mou_document_url = r2Url;
      contactDetails.mou_signature_metadata = metadata;
      delete contactDetails.mou_partner_signature_metadata;
      statusCol = 'mou_status';
      signedStatus = 'MOU_SIGNED';
    } else if (typeParam === 'commission') {
      contactDetails.commission_document_url = r2Url;
      contactDetails.commission_signature_metadata = metadata;
      delete contactDetails.commission_partner_signature_metadata;
      statusCol = 'commission_status';
      signedStatus = 'COMMISSION_SIGNED';
    }

    if (type === "PARTNER") {
      if (statusCol === 'nda_status') {
        await sql()`update ecosystem_partners set nda_status = ${signedStatus}, contact_details = ${JSON.stringify(contactDetails)}::jsonb where id = ${id}`;
      } else if (statusCol === 'mou_status') {
        await sql()`update ecosystem_partners set mou_status = ${signedStatus}, contact_details = ${JSON.stringify(contactDetails)}::jsonb where id = ${id}`;
      } else if (statusCol === 'commission_status') {
        await sql()`update ecosystem_partners set commission_status = ${signedStatus}, contact_details = ${JSON.stringify(contactDetails)}::jsonb where id = ${id}`;
      }
    } else if (type === "COMPANY") {
      if (statusCol === 'nda_status') {
        await sql()`update companies set nda_status = ${signedStatus}, contact_details = ${JSON.stringify(contactDetails)}::jsonb where id = ${id}`;
      } else if (statusCol === 'mou_status') {
        await sql()`update companies set mou_status = ${signedStatus}, contact_details = ${JSON.stringify(contactDetails)}::jsonb where id = ${id}`;
      } else if (statusCol === 'commission_status') {
        await sql()`update companies set commission_status = ${signedStatus}, contact_details = ${JSON.stringify(contactDetails)}::jsonb where id = ${id}`;
      }
    }

    return json({ ok: true, message: "Document fully signed and stored successfully." });

  } catch (error: any) {
    console.error("Admin signature signing failed:", error);
    return json({ ok: false, error: "Failed to process signature: " + (error?.message || "Unknown error") }, 500);
  }
}
