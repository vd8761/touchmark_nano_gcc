"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import styles from "../../app/admin/dashboard/dashboard.module.css";

interface MasterChartsProps {
  students?: any[];
  applications?: any[];
  jobs?: any[];
  companies?: any[];
  currency?: string;
}

export function MasterCharts({ students = [], applications = [], jobs = [], companies = [], currency = 'USD' }: MasterChartsProps) {
  
  const funnelData = [
    { name: "Opportunities Created", value: 0, color: "#E0E7FF" },
    { name: "Applications", value: 0, color: "#C7D2FE" },
    { name: "Shortlisted", value: 0, color: "#A5B4FC" },
    { name: "Interviews", value: 0, color: "#818CF8" },
    { name: "Offers", value: 0, color: "#6366F1" },
    { name: "Placements", value: 0, color: "#FDE68A" }
  ];

  const talentData = [
    { name: "Students", value: 0, percent: 0 },
    { name: "Fresh Graduates", value: 0, percent: 0 },
    { name: "Working Professionals", value: 0, percent: 0 },
    { name: "Others", value: 0, percent: 0 }
  ];
  
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  const oppData = [
    { name: "Dec 24", internship: 0, job: 0 },
    { name: "Jan 25", internship: 0, job: 0 },
    { name: "Feb 25", internship: 0, job: 0 },
    { name: "Mar 25", internship: 0, job: 0 },
    { name: "Apr 25", internship: 0, job: 0 },
    { name: "May 25", internship: 0, job: 0 },
  ];

  return (
    <div className={styles.chartsGrid}>
      
      {/* Funnel Chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.cardTitle}>Internship & Placement Funnel</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {funnelData.map((item, index) => (
            <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div 
                style={{ 
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px",
                  fontSize: "0.85rem", fontWeight: 500, backgroundColor: item.color, 
                  width: `${100 - (index * 12)}%`,
                  color: index === 5 ? '#92400E' : '#312E81',
                  borderRadius: index === 5 ? '8px' : '4px'
                }}
              >
                <span>{item.name}</span>
                <span style={{ fontWeight: 700 }}>{item.value.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Talent Overview Donut */}
      <div className={styles.chartCard}>
        <h3 className={styles.cardTitle}>Talent Overview</h3>
        <div style={{ height: "250px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={talentData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
              >
                {talentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1E293B" }}>24,530</span>
            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>Total Talent</span>
          </div>
        </div>
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
           {talentData.map((item, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span style={{ color: "#475569", fontWeight: 500 }}>{item.name}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                   <span style={{ fontWeight: 700, color: "#334155" }}>{item.value.toLocaleString()}</span>
                   <span style={{ color: "#94A3B8" }}>({item.percent}%)</span>
                </div>
              </div>
           ))}
        </div>
      </div>

      {/* Opportunities Overview Line Chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.cardTitle}>Opportunities Overview</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", fontSize: "0.75rem", fontWeight: 500 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }}></div><span style={{ color: "#475569" }}>Internship Opportunities</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div><span style={{ color: "#475569" }}>Job Opportunities</span></div>
        </div>
        <div style={{ height: "250px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={oppData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}K`} />
              <RechartsTooltip />
              <Line type="monotone" dataKey="internship" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="job" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
