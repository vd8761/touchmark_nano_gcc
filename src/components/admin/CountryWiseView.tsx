"use client";

import React, { useState } from "react";
import styles from "../../app/admin/dashboard/dashboard.module.css";

interface CountryWiseViewProps {
  companies?: any[];
  partners?: any[];
  institutions?: any[];
  currency?: string;
}

export function CountryWiseView({ companies = [], partners = [], institutions = [], currency = 'USD' }: CountryWiseViewProps) {
  const [selectedCountry, setSelectedCountry] = useState("India");

  const countryStats = [
    { name: "India", flag: "🇮🇳", companies: 186, partners: 72 },
    { name: "Sri Lanka", flag: "🇱🇰", companies: 38, partners: 18 },
    { name: "UAE", flag: "🇦🇪", companies: 26, partners: 12 },
    { name: "Singapore", flag: "🇸🇬", companies: 22, partners: 11 },
    { name: "USA", flag: "🇺🇸", companies: 18, partners: 8 },
  ];

  return (
    <div className={styles.sidePanelCard} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", textTransform: "uppercase" }}>2. Country-Wise View</h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "140px minmax(0, 1fr)", gap: "20px" }}>
        {/* Left Side: Country List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Country</label>
            <select 
              style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none", fontSize: "0.85rem", fontWeight: 500, color: "#334155" }}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="India">India</option>
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="UAE">UAE</option>
              <option value="Singapore">Singapore</option>
              <option value="USA">USA</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {countryStats.map(c => (
              <button 
                key={c.name}
                onClick={() => setSelectedCountry(c.name)}
                style={{ 
                  display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px", 
                  borderRadius: "8px", border: "none", textAlign: "left", cursor: "pointer",
                  background: selectedCountry === c.name ? "#EFF6FF" : "transparent",
                }}
              >
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{c.flag}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1E293B" }}>{c.name}</span>
                  <div style={{ fontSize: "0.7rem", color: "#64748B", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                       <span>Companies</span> <span style={{ fontWeight: 600, color: "#0F172A" }}>{c.companies}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                       <span>Partners</span> <span style={{ fontWeight: 600, color: "#0F172A" }}>{c.partners}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <button style={{ padding: "8px", background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
            View All Countries
          </button>
        </div>

        {/* Right Side: Details */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>{selectedCountry} - Overview</div>
          </div>
          
          <div style={{ width: "100%", height: "240px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden", position: "relative" }}>
             <img src="/assets/india_map.jpg" alt="Map of India" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            
            {/* Small Stat Cards */}
            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Companies</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>186</span>
              <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>Active <span style={{ color: "#334155", fontWeight: 500 }}>148</span></span>
            </div>
            
            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Partners</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>72</span>
              <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>Active <span style={{ color: "#334155", fontWeight: 500 }}>51</span></span>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Institutions</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>262</span>
              <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>Active <span style={{ color: "#334155", fontWeight: 500 }}>208</span></span>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Talent</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>15,340</span>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Internships</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>5,642</span>
              <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>Available <span style={{ color: "#334155", fontWeight: 500 }}>1,432</span></span>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Placements</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>675</span>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#F8FAFC", borderRadius: "8px", marginTop: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>Turnover (Current)</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>$ 236.8M</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>Turnover (Projected)</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>$ 612.7M</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
