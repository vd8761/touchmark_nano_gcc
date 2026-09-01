import React from "react";
import { DashboardCountryOverview } from "./DashboardCountryOverview";
import { getCountryMetrics } from "@/lib/dashboard-metrics";

export default async function DashboardCountryOverviewServer({ filters }: { filters?: any }) {
  const metrics = await getCountryMetrics(filters);
  
  return <DashboardCountryOverview countries={metrics} />;
}
