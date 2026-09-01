import React from "react";
import { DashboardChartsRow } from "./DashboardChartsRow";
import { getChartMetrics } from "@/lib/dashboard-metrics";

export default async function DashboardChartsRowServer({ filters }: { filters?: any }) {
  const metrics = await getChartMetrics(filters);
  
  return <DashboardChartsRow metrics={metrics} />;
}
