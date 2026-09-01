"use client";

import React, { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PlacementData {
  active_internships: number;
  completed_internships: number;
  placement_offers: number;
  in_progress: number;
}

export function DashboardAnalyticsRadar({ data }: { data: PlacementData }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find max value to scale the radar chart properly, minimum 10
  const maxVal = Math.max(
    10,
    data.active_internships,
    data.completed_internships,
    data.placement_offers,
    data.in_progress
  );
  
  // Add some padding to the max value for visual breathing room
  const fullMark = Math.ceil(maxVal * 1.2);

  const chartData = [
    { subject: 'Internships', A: data.active_internships, fullMark },
    { subject: 'Completed', A: data.completed_internships, fullMark },
    { subject: 'Offers', A: data.placement_offers, fullMark },
    { subject: 'In Progress', A: data.in_progress, fullMark },
  ];

  if (!isMounted) {
    return (
      <div style={{ 
        background: "#FFFFFF", borderRadius: "20px", padding: "32px", 
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)", height: "100%", minHeight: "400px", 
        display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8"
      }}>
        Loading Analytics...
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
      <div style={{ marginBottom: "16px", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>Placement Balance</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "4px 0 0 0" }}>Distribution of current placement activity.</p>
      </div>
      
      <div style={{ width: '100%', flex: 1, minHeight: "260px" }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#F1F5F9" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, fullMark]} 
              tick={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              itemStyle={{ fontSize: '1rem', fontWeight: 700, color: '#D97706' }}
              labelStyle={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}
              formatter={(value: any) => [value, 'Total']}
            />
            <Radar 
              name="Placement Volume" 
              dataKey="A" 
              stroke="#F59E0B" 
              strokeWidth={3}
              fill="#F59E0B" 
              fillOpacity={0.25} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
