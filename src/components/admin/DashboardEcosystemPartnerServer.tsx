import React from "react";
import DashboardEcosystemPartner from "./DashboardEcosystemPartner";
import { getTableMetrics } from "@/lib/dashboard-metrics";

export default async function DashboardEcosystemPartnerServer({ filters }: { filters?: any }) {
  const metrics = await getTableMetrics(filters);
  
  return <DashboardEcosystemPartner metrics={metrics} />;
}
