import React from "react";
import styles from "@/app/admin/dashboard/dashboard.module.css";
import { 
  Building2, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  TrendingUp, 
  Award, 
  Activity, 
  FileText, 
  PieChart 
} from "lucide-react";

import type { KpiMetrics } from "@/lib/dashboard-metrics";

interface DashboardKpiGridProps {
  metrics?: KpiMetrics;
}

export function DashboardKpiGrid({ metrics }: DashboardKpiGridProps) {
  // Use metrics if provided, else fallback to mock data
  const kpis = [
    { id: 1, title: "Total Companies", value: metrics?.totalCompanies?.toLocaleString() || "0", icon: Building2, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 2, title: "Total GCCs", value: metrics?.totalGccs?.toLocaleString() || "0", icon: Globe, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 3, title: "Total Students", value: metrics?.totalEmployees?.toLocaleString() || "0", icon: Users, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 4, title: "Open Roles", value: metrics?.openRoles?.toLocaleString() || "0", icon: Briefcase, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 5, title: "Institutions", value: metrics?.institutions?.toLocaleString() || "0", icon: GraduationCap, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 6, title: "Active Projects", value: metrics?.activeProjects?.toLocaleString() || "0", icon: Activity, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 7, title: "Growth Rate", value: "0%", icon: TrendingUp, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 8, title: "Certifications", value: "0", icon: Award, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 9, title: "Reports Gen", value: "0", icon: FileText, color: "#0284C7", bgColor: "#F0F9FF" },
    { id: 10, title: "Market Share", value: "0%", icon: PieChart, color: "#0284C7", bgColor: "#F0F9FF" },
  ];

  return (
    <div className={styles.kpiGrid}>
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.id} className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiTitleWrapper} data-title={kpi.title}>
                <h3 className={styles.kpiTitle}>{kpi.title}</h3>
              </div>
              <div className={styles.iconWrapper}>
                <Icon color={kpi.color} strokeWidth={2.5} />
              </div>
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.kpiValue}>{kpi.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
