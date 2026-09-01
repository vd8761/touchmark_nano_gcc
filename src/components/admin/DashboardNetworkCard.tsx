"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Landmark, Share2, Building2, GraduationCap } from "lucide-react";

interface DashboardNetworkCardProps {
  title: string;
  icon: string;
  mainCount: number;
  mainLabel: string;
  subCount1: number;
  subLabel1: string;
  subCount2: number;
  subLabel2: string;
  href: string;
  gradient?: string; // Kept for backwards compatibility but not strictly needed
}

// Custom hook for number rollout animation
function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

const renderIcon = (icon: string) => {
  if (icon === '🏫') return <Landmark size={22} strokeWidth={2.5} />;
  if (icon === '🤝') return <Share2 size={22} strokeWidth={2.5} />;
  if (icon === '🏢') return <Building2 size={22} strokeWidth={2.5} />;
  if (icon === '🎓') return <GraduationCap size={24} strokeWidth={2.5} />;
  return <span style={{fontSize: "1.2rem"}}>{icon}</span>;
}

// Micro Sparkline Component for that "rare" Dribbble look
function Sparkline({ seed }: { seed: number }) {
  // Generate a slightly different elegant curve based on the seed
  const offset = (seed * 17) % 20;
  const pathData = `M0,35 C15,${30 - offset} 30,${15 + offset} 45,25 C60,35 75,10 100,${15 + offset}`;
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L100,40 L0,40 Z`}
        fill={`url(#grad-${seed})`}
      />
      <path
        d={pathData}
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0px 4px 6px rgba(245,158,11,0.2))" }}
      />
      
      {/* Little glowing dot at the end of the sparkline */}
      <circle cx="100" cy={15 + offset} r="4" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
    </svg>
  );
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
}: DashboardNetworkCardProps) {
  const animatedMain = useCountUp(mainCount);
  const animatedSub1 = useCountUp(subCount1, 1000);
  const animatedSub2 = useCountUp(subCount2, 1000);

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        border: "1px solid rgba(15, 23, 42, 0.04)",
        borderRadius: "24px",
        padding: "28px",
        textDecoration: "none",
        color: "#0F172A",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255,255,255,1)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 24px 48px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,1)";
        e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.2)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255,255,255,1)";
        e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.04)";
      }}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        
        {/* Top Row: Title & Icon */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <h3 style={{ 
            margin: 0, fontSize: "1.05rem", fontWeight: 700, 
            color: "#475569", letterSpacing: "0.01em", lineHeight: 1.3 
          }}>
            {title}
          </h3>
          <div style={{
            color: "#F59E0B",
            background: "#0F172A",
            width: "44px",
            height: "44px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 16px rgba(15, 23, 42, 0.15), inset 0 1px 1px rgba(255,255,255,0.1)",
            flexShrink: 0
          }}>
            {renderIcon(icon)}
          </div>
        </div>

        {/* Middle Row: Massive Number & Sparkline */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "16px", marginBottom: "32px" }}>
          <span style={{ 
            fontFamily: "'Outfit', var(--display)", 
            fontSize: "4.8rem", 
            fontWeight: 600, 
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            background: "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            {animatedMain}
          </span>
          
          <div style={{ width: "100px", height: "45px", marginBottom: "4px" }}>
            <Sparkline seed={mainCount === 0 ? 5 : mainCount} />
          </div>
        </div>

        {/* Footer Row: Pills and Sub-stats */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "20px", borderTop: "1px dashed rgba(15, 23, 42, 0.08)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "99px",
            border: "1px solid rgba(245, 158, 11, 0.25)", color: "#D97706",
            fontSize: "0.75rem", fontWeight: 700, background: "rgba(245, 158, 11, 0.08)",
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 6px rgba(245,158,11,0.6)" }} />
            {animatedSub1} {subLabel1}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#0F172A", fontWeight: 700, fontSize: "0.9rem" }}>{animatedSub2}</span>
            <span style={{ color: "#94A3B8", fontSize: "0.8rem", fontWeight: 600 }}>{subLabel2}</span>
          </div>
        </div>

      </div>
    </Link>
  );
}
