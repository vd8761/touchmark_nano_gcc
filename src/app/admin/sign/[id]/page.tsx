import React from "react";
import SignaturePad from "@/components/SignaturePad";
import { notFound, redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { currentAdmin } from "@/lib/auth";

export default async function AdminESignaturePage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ type?: string }> }) {
  const admin = await currentAdmin();
  if (!admin) redirect('/admin/login');

  const params = await props.params;
  const searchParams = await props.searchParams;
  const id = params.id;
  const typeParam = searchParams.type || 'nda';
  
  if (!id) {
    notFound();
  }

  // 1. Identify the signer
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
      notFound();
    }
  }

  let isSigned = false;
  if (typeParam === 'nda') isSigned = p.nda_status === "ACTIVE" || p.nda_status === "NDA_SIGNED";
  else if (typeParam === 'mou') isSigned = p.mou_status === "ACTIVE" || p.mou_status === "MOU_SIGNED";
  else if (typeParam === 'commission') isSigned = p.commission_status === "ACTIVE" || p.commission_status === "COMMISSION_SIGNED";

  if (isSigned) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper-1)", padding: "20px" }}>
        <div className="adm-card" style={{ background: "white", padding: "40px", borderRadius: "8px", border: "1px solid var(--paper-2)", maxWidth: "500px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", background: "var(--success, #10b981)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", fontSize: "2rem" }}>✓</div>
          <h2 style={{ fontSize: "1.5rem", margin: "0 0 10px 0" }}>Document Signed</h2>
          <p style={{ color: "var(--ink-soft)", margin: 0 }}>This document has already been signed by {p.name}.</p>
        </div>
      </div>
    );
  }

  // 2. Fetch the corresponding document
  let docKey = "GENERIC_NDA";
  if (typeParam === 'mou') {
    docKey = type === "PARTNER" ? "PARTNER_MOU" : "COMPANY_MOU";
  } else if (typeParam === 'commission') {
    docKey = "PARTNER_COMMERCIAL_AGREEMENT";
  }

  const docs = await sql()`select title, content_html from legal_documents where document_key = ${docKey}`;
  const doc = docs.length > 0 ? docs[0] : { 
    title: typeParam === 'nda' ? "Non-Disclosure Agreement" : "Legal Agreement", 
    content_html: typeParam === 'nda' ? "<p>1. Purpose. The parties wish to explore a business opportunity...</p>" : "<p>No agreement content found.</p>" 
  };

  // 3. Replace variables
  let html = doc.content_html;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const address = p.contact_details?.location ? `${p.contact_details.location}, ${p.contact_details.country || ''}` : '';
  const email = p.email || p.contact_details?.email || '';

  html = html.replace(/(\[|\{\{)COMPANY_NAME(\]|\}\})/gi, p.name || '');
  html = html.replace(/(\[|\{\{)COMPANY NAME(\]|\}\})/gi, p.name || '');
  html = html.replace(/(\[|\{\{)PARTNER_NAME(\]|\}\})/gi, p.name || '');
  html = html.replace(/(\[|\{\{)PARTNER NAME(\]|\}\})/gi, p.name || '');
  html = html.replace(/(\[|\{\{)DATE(\]|\}\})/gi, date);
  html = html.replace(/(\[|\{\{)ADDRESS(\]|\}\})/gi, address);
  html = html.replace(/(\[|\{\{)CONTACT_EMAIL(\]|\}\})/gi, email);
  html = html.replace(/(\[|\{\{)REPRESENTATIVE NAME(\]|\}\})/gi, p.contact_details?.contactPerson || p.name || '');
  html = html.replace(/(\[|\{\{)DESIGNATION(\]|\}\})/gi, p.contact_details?.designation || 'Representative');
  
  // Add space before Signature:
  html = html.replace(/Signature:/g, '<br><br><br>Signature:');

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper-1)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <h1 className="adm-h1" style={{ fontSize: "2rem", marginBottom: "8px" }}>
            {doc.title}
          </h1>
          <p className="adm-sub" style={{ fontSize: "1.1rem" }}>
            Please review the document below and provide your signature at the bottom.
          </p>
        </div>

        {/* Document Preview Area */}
        <div className="adm-card" style={{ background: "white", borderRadius: "8px", border: "1px solid var(--paper-2)", padding: "40px", minHeight: "500px", overflow: "hidden" }}>
          <div 
            style={{ color: "var(--ink)", lineHeight: 1.6, fontSize: "0.95rem" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div style={{ borderTop: "1px solid var(--paper-2)", paddingTop: "32px", marginTop: "80px" }}>
            <SignaturePad 
              title="Admin E-Signature Required" 
              documentId={`${id}?type=${typeParam}`} 
              apiEndpoint={`/api/admin/sign/${id}?type=${typeParam}`} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
