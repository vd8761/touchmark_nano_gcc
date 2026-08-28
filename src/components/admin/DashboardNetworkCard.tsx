"use client";

import Link from "next/link";
import React from "react";

interface DashboardNetworkCardProps {
  title: string;
  icon: React.ReactNode;
  mainCount: number;
  mainLabel: string;
  subCount1: number;
  subLabel1: string;
  subCount2: number;
  subLabel2: string;
  href: string;
  gradient: string;
}

const renderIcon = (icon: string) => {
  if (icon === '🏫') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M5 21h14"/><path d="M12 11v10"/><path d="M3 11l9-9 9 9"/></svg>;
  if (icon === '🤝') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14l-5-5-5 5"/><path d="M12 9v12"/><path d="M3 7h18"/></svg>;
  if (icon === '🏢') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
  if (icon === '🎓') return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
  return <span>{icon}</span>;
}

export function DashboardNetworkCard({
  title,
  icon,
  mainCount,
  mainLabel,
  subCount1,
  subLabel1,
  subCount2,
  subLabel2,
  href,
  gradient
}: DashboardNetworkCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
        border: "1px solid var(--paper-3)",
        borderRadius: "12px",
        padding: "20px",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          {renderIcon(icon)}
        </div>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{title}</h3>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "2rem", fontWeight: 700 }}>{mainCount}</span>
        <span style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>{mainLabel}</span>
      </div>

      <div style={{ 
        display: "flex", 
        gap: "12px", 
        paddingTop: "12px", 
        borderTop: "1px solid var(--paper-2)",
        fontSize: "0.85rem" 
      }}>
        <div style={{ flex: 1 }}>
          <strong style={{ color: "var(--ink)" }}>{subCount1}</strong> <span style={{ color: "var(--ink-soft)" }}>{subLabel1}</span>
        </div>
        <div style={{ width: "1px", background: "var(--paper-2)" }} />
        <div style={{ flex: 1 }}>
          <strong style={{ color: "var(--ink)" }}>{subCount2}</strong> <span style={{ color: "var(--ink-soft)" }}>{subLabel2}</span>
        </div>
      </div>
    </Link>
  );
}
