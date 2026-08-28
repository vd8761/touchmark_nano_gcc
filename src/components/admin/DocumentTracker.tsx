"use client";

import React, { useState } from "react";

interface Props {
  partnerId: string;
  ndaStatus: string;
  documentUrl?: string;
  mouStatus?: string;
  mouUrl?: string;
  commissionStatus?: string;
  commissionUrl?: string;
}

export default function DocumentTracker({ partnerId, ndaStatus, documentUrl, mouStatus, mouUrl, commissionStatus, commissionUrl }: Props) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copyLink = (type: string) => {
    let link = `${window.location.origin}/sign/${partnerId}`;
    if (type !== 'nda') {
      link += `?type=${type}`;
    }
    navigator.clipboard.writeText(link);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const isNdaFullySigned = ndaStatus === "ACTIVE" || ndaStatus === "NDA_SIGNED";
  const isNdaPartnerSigned = ndaStatus === "NDA_PENDING_ADMIN" || ndaStatus === "PENDING_ADMIN";
  
  const isMouFullySigned = mouStatus === "ACTIVE" || mouStatus === "MOU_SIGNED";
  const isMouPartnerSigned = mouStatus === "MOU_PENDING_ADMIN" || mouStatus === "PENDING_ADMIN";
  
  const isCommissionFullySigned = commissionStatus === "ACTIVE" || commissionStatus === "COMMISSION_SIGNED";
  const isCommissionPartnerSigned = commissionStatus === "COMMISSION_PENDING_ADMIN" || commissionStatus === "PENDING_ADMIN";

  return (
    <div className="adm-card" style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid var(--paper-2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Agreements & Docs</h3>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--paper-1)", borderRadius: "6px", border: "1px dashed var(--paper-3)" }}>
          <div style={{ width: "24px", height: "24px", minWidth: "24px", flexShrink: 0, background: isNdaFullySigned ? "var(--success, #10b981)" : isNdaPartnerSigned ? "var(--warning, #f59e0b)" : "var(--paper-3)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold" }}>
            {isNdaFullySigned && "✓"}
            {isNdaPartnerSigned && "!"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Non-Disclosure Agreement</div>
            <div style={{ fontSize: "0.8rem", color: isNdaFullySigned ? "var(--success, #10b981)" : isNdaPartnerSigned ? "var(--warning, #f59e0b)" : "var(--ink-faint)" }}>
              {isNdaFullySigned ? "Signed & Stored" : isNdaPartnerSigned ? "Admin Signature Required" : "Pending Signature"}
            </div>
          </div>
          {(!isNdaFullySigned && !isNdaPartnerSigned) && (
            <button onClick={() => copyLink('nda')} className="adm-btn outline" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>
              {copiedLink === 'nda' ? "Copied!" : "Copy Sign Link"}
            </button>
          )}
          {isNdaPartnerSigned && (
            <a href={`/admin/sign/${partnerId}?type=nda`} className="adm-btn primary" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>
              Admin Sign
            </a>
          )}
          {isNdaFullySigned && documentUrl && (
            <a href={`/api/admin/download-doc?url=${encodeURIComponent(documentUrl)}`} target="_blank" rel="noopener noreferrer" className="adm-btn outline" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>
              View PDF
            </a>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--paper-1)", borderRadius: "6px", border: "1px dashed var(--paper-3)" }}>
          <div style={{ width: "24px", height: "24px", minWidth: "24px", flexShrink: 0, background: isMouFullySigned ? "var(--success, #10b981)" : isMouPartnerSigned ? "var(--warning, #f59e0b)" : "var(--paper-3)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold" }}>
            {isMouFullySigned && "✓"}
            {isMouPartnerSigned && "!"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Memorandum of Understanding</div>
            <div style={{ fontSize: "0.8rem", color: isMouFullySigned ? "var(--success, #10b981)" : isMouPartnerSigned ? "var(--warning, #f59e0b)" : "var(--ink-faint)" }}>
              {isMouFullySigned ? "Signed & Stored" : isMouPartnerSigned ? "Admin Signature Required" : "Pending Signature"}
            </div>
          </div>
          {(!isMouFullySigned && !isMouPartnerSigned) && (
            <button onClick={() => copyLink('mou')} className="adm-btn outline" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>
              {copiedLink === 'mou' ? "Copied!" : "Copy Sign Link"}
            </button>
          )}
          {isMouPartnerSigned && (
            <a href={`/admin/sign/${partnerId}?type=mou`} className="adm-btn primary" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>
              Admin Sign
            </a>
          )}
          {isMouFullySigned && mouUrl && (
            <a href={`/api/admin/download-doc?url=${encodeURIComponent(mouUrl)}`} target="_blank" rel="noopener noreferrer" className="adm-btn outline" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>
              View PDF
            </a>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--paper-1)", borderRadius: "6px", border: "1px dashed var(--paper-3)" }}>
          <div style={{ width: "24px", height: "24px", minWidth: "24px", flexShrink: 0, background: isCommissionFullySigned ? "var(--success, #10b981)" : isCommissionPartnerSigned ? "var(--warning, #f59e0b)" : "var(--paper-3)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold" }}>
            {isCommissionFullySigned && "✓"}
            {isCommissionPartnerSigned && "!"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Commission Structure</div>
            <div style={{ fontSize: "0.8rem", color: isCommissionFullySigned ? "var(--success, #10b981)" : isCommissionPartnerSigned ? "var(--warning, #f59e0b)" : "var(--ink-faint)" }}>
              {isCommissionFullySigned ? "Signed & Stored" : isCommissionPartnerSigned ? "Admin Signature Required" : "Pending Signature"}
            </div>
          </div>
          {(!isCommissionFullySigned && !isCommissionPartnerSigned) && (
            <button onClick={() => copyLink('commission')} className="adm-btn outline" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>
              {copiedLink === 'commission' ? "Copied!" : "Copy Sign Link"}
            </button>
          )}
          {isCommissionPartnerSigned && (
            <a href={`/admin/sign/${partnerId}?type=commission`} className="adm-btn primary" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>
              Admin Sign
            </a>
          )}
          {isCommissionFullySigned && commissionUrl && (
            <a href={`/api/admin/download-doc?url=${encodeURIComponent(commissionUrl)}`} target="_blank" rel="noopener noreferrer" className="adm-btn outline" style={{ fontSize: "0.75rem", padding: "6px 10px", whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>
              View PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
