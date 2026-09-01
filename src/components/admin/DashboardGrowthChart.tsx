"use client";

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const mockData = [
  { name: 'Mar', students: 120, partners: 15 },
  { name: 'Apr', students: 250, partners: 35 },
  { name: 'May', students: 340, partners: 60 },
  { name: 'Jun', students: 510, partners: 90 },
  { name: 'Jul', students: 680, partners: 125 },
  { name: 'Aug', students: 950, partners: 180 },
];

export function DashboardGrowthChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={{ 
        background: "#FFFFFF", borderRadius: "20px", padding: "32px", 
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        height: "100%", minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8"
      }}>
        Loading Chart...
      </div>
    );
  }

  return (
    <div style={{ 
      background: "#FFFFFF", 
      borderRadius: "20px", 
      padding: "32px", 
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
      display: "flex",
      flexDirection: "column",
      height: "100%"
    }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>Network Growth Trends</h2>
          <p style={{ fontSize: "0.9rem", color: "#64748B", margin: "4px 0 0 0" }}>Student and partner acquisitions over the last 6 months.</p>
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#0F172A" }}></span>
            Students
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B" }}></span>
            Partners
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%', flex: 1, minHeight: "320px" }}>
        <ResponsiveContainer>
          <AreaChart
            data={mockData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F172A" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPartners" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              itemStyle={{ fontSize: '0.85rem', fontWeight: 600 }}
              labelStyle={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}
              cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="partners" 
              name="Partners & Corporates"
              stroke="#F59E0B" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPartners)" 
            />
            <Area 
              type="monotone" 
              dataKey="students" 
              name="Student Signups"
              stroke="#0F172A" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorStudents)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
