import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, json } from "@/lib/request";
import { PDFDocument, rgb } from "pdf-lib";
import { uploadToR2 } from "@/lib/r2";
import { mapDocumentVariables } from "@/lib/documentMapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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
    
    // Replace variables (same as in page.tsx)
    let html = mapDocumentVariables(doc.content_html, p);

    // Capture Request Metadata for Compliance
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";
    const timestamp = new Date().toISOString();

    // 4. Update Database
    const contactDetails = p.contact_details || {};
    let statusCol = 'nda_status';
    let signedStatus = 'NDA_PENDING_ADMIN';
    
    const metadata = { ip, userAgent, timestamp, signatureBase64 };

    if (typeParam === 'nda') {
      contactDetails.nda_partner_signature_metadata = metadata;
      statusCol = 'nda_status';
      signedStatus = 'NDA_PENDING_ADMIN';
    } else if (typeParam === 'mou') {
      contactDetails.mou_partner_signature_metadata = metadata;
      statusCol = 'mou_status';
      signedStatus = 'MOU_PENDING_ADMIN';
    } else if (typeParam === 'commission') {
      contactDetails.commission_partner_signature_metadata = metadata;
      statusCol = 'commission_status';
      signedStatus = 'COMMISSION_PENDING_ADMIN';
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

    return json({ ok: true, message: "Signature successfully applied to document." });

  } catch (error: any) {
    console.error("Signature stamping failed:", error);
    return json({ ok: false, error: "Failed to process signature." }, 500);
  }
}
