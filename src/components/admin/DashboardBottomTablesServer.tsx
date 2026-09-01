import React from "react";
import DashboardBottomTables from "./DashboardBottomTables";
import { getTableMetrics } from "@/lib/dashboard-metrics";

export default async function DashboardBottomTablesServer({ filters }: { filters?: any }) {
  const metrics = await getTableMetrics(filters);
  
  return <DashboardBottomTables metrics={metrics} />;
}
