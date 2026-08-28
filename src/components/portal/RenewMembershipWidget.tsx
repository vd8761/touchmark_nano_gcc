"use client";

import React, { useState } from "react";
import { format } from "date-fns";

interface Props {
  isExpired: boolean;
  daysRemaining: number;
  validUntil: Date;
}

export default function RenewMembershipWidget({ isExpired, daysRemaining, validUntil }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    // We let the form submit natively so it handles the 303 redirect,
    // but we set loading state so the button gives visual feedback.
    setIsSubmitting(true);
  };

  const statusText = isExpired 
    ? "Your institution membership has expired." 
    : `Your membership expires in ${daysRemaining} days.`;

  const bannerColor = isExpired ? "var(--critical-bg)" : "var(--warn-bg)";
  const borderColor = isExpired ? "var(--critical-border)" : "var(--warn-border)";
  const textColor = isExpired ? "var(--critical)" : "var(--warn)";

  return (
    <div 
      style={{ 
        background: bannerColor, 
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        animation: isExpired ? "pulse 2s infinite" : "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h3 style={{ margin: "0 0 8px 0", color: textColor, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Action Required
          </h3>
          <p style={{ margin: 0, color: "var(--ink)" }}>
            {statusText} Renew now to maintain uninterrupted access to the Ecosystem Portal, Student Management, and exclusive partner benefits.
          </p>
        </div>
        
        <form action="/api/portal/renew" method="POST" onSubmit={handleSubmit} style={{ margin: 0 }}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              background: "var(--brand)", 
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: isSubmitting ? "wait" : "pointer",
              opacity: isSubmitting ? 0.8 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "transform 0.1s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Renew Membership
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
