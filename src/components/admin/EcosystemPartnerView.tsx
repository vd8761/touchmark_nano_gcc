"use client";

import React, { useState } from "react";
import { Building2, School, GraduationCap, Briefcase, CalendarCheck, CheckCircle2, TrendingUp, Layers } from "lucide-react";
import styles from "../../app/admin/dashboard/dashboard.module.css";

interface EcosystemPartnerViewProps {
  partners?: any[];
  companies?: any[];
  institutions?: any[];
  students?: any[];
  jobs?: any[];
  batches?: any[];
  enquiries?: any[];
  currency?: string;
}

export function EcosystemPartnerView({
  partners = [],
  companies = [],
  institutions = [],
  students = [],
  jobs = [],
  batches = [],
  enquiries = [],
  currency = 'USD'
}: EcosystemPartnerViewProps) {
  const [selectedPartner, setSelectedPartner] = useState("Tech Nexus Solutions");

  return (
    <div className={styles.sidePanelCard} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", textTransform: "uppercase" }}>3. Ecosystem Partner View</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Partner Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Ecosystem Partner</label>
          <select 
            style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none", fontSize: "0.85rem", fontWeight: 500, color: "#334155", background: "#F8FAFC", width: "100%" }}
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
          >
            <option value="Tech Nexus Solutions">Tech Nexus Solutions</option>
            <option value="Global Innovators">Global Innovators</option>
            <option value="EduConnect">EduConnect</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "140px minmax(0, 1fr)", gap: "20px" }}>
          
          {/* Left Column: Core Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", alignItems: "flex-start", gap: "12px" }}>
               <div style={{ color: "#2563EB", marginTop: "2px" }}><Building2 size={20} /></div>
               <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                 <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Companies Onboarded</span>
                 <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>32</span>
                 <span style={{ fontSize: "0.65rem", color: "#94A3B8", textAlign: "right" }}>Active <span style={{ color: "#334155", fontWeight: 500 }}>26</span></span>
               </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", alignItems: "flex-start", gap: "12px" }}>
               <div style={{ color: "#059669", marginTop: "2px" }}><School size={20} /></div>
               <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                 <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Institutions</span>
                 <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>48</span>
                 <span style={{ fontSize: "0.65rem", color: "#94A3B8", textAlign: "right" }}>Active <span style={{ color: "#334155", fontWeight: 500 }}>36</span></span>
               </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", alignItems: "flex-start", gap: "12px" }}>
               <div style={{ color: "#EA580C", marginTop: "2px" }}><GraduationCap size={20} /></div>
               <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                 <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Talent Registered</span>
                 <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>3,842</span>
               </div>
            </div>

          </div>

          {/* Right Column: Opportunities Grid */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", gridAutoRows: "min-content" }}>
            
            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", alignItems: "flex-start", gap: "12px" }}>
               <div style={{ color: "#0D9488", marginTop: "2px" }}><Briefcase size={18} /></div>
               <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                 <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Internship Opportunities</span>
                 <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>1,248</span>
                 <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>Available <span style={{ color: "#334155", fontWeight: 500 }}>356</span></span>
               </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Ongoing Internships</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>521</span>
              </div>
              <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Completed Internships</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>927</span>
              </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", alignItems: "flex-start", gap: "12px" }}>
               <div style={{ color: "#2563EB", marginTop: "2px" }}><Briefcase size={18} /></div>
               <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                 <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Job Opportunities</span>
                 <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>642</span>
               </div>
            </div>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", gap: "8px" }}><div style={{ color: "#EA580C" }}><TrendingUp size={14} /></div><span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Placements</span></div>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>218</span>
              </div>
              <div style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748B" }}>Active Batches</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>14</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Metrics Row */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #F1F5F9", alignItems: "center" }}>
           <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>Enquiries Generated</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>28</span>
           </div>
           <div style={{ width: "1px", height: "30px", background: "#E2E8F0" }}></div>
           <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>Turnover (Current)</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>$ 68.4M</span>
           </div>
           <div style={{ width: "1px", height: "30px", background: "#E2E8F0" }}></div>
           <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>Turnover (Projected)</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>$ 172.6M</span>
           </div>
        </div>

      </div>

    </div>
  );
}
