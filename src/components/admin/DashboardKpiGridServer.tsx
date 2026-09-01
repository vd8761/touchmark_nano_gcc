import React from "react";
import { DashboardKpiGrid } from "./DashboardKpiGrid";
import { getKpiMetrics } from "@/lib/dashboard-metrics";

export default async function DashboardKpiGridServer({ filters }: { filters?: any }) {
  const metrics = await getKpiMetrics(filters);
  
  return <DashboardKpiGrid metrics={metrics} />;
}
