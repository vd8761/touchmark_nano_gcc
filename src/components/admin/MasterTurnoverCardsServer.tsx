import React from "react";
import { MasterTurnoverCards } from "./MasterTurnoverCards";
import { getGlobalMetrics } from "@/lib/dashboard-metrics";

export default async function MasterTurnoverCardsServer({ filters }: { filters?: any }) {
  const metrics = await getGlobalMetrics(filters);
  
  let currency = 'INR';
  if (filters?.country) {
    if (filters.country === 'India') currency = 'INR';
    else if (filters.country === 'Sri Lanka') currency = 'LKR';
    else if (filters.country === 'UAE') currency = 'AED';
    else if (filters.country === 'Singapore') currency = 'SGD';
    else if (filters.country === 'USA') currency = 'USD';
  }

  // Create a dummy companies array with the aggregated totals 
  // so the existing MasterTurnoverCards component works without any UI disturbance.
  const aggregatedData = [{
    turnover_current: metrics.currentTurnover,
    turnover_projected: metrics.projectedTurnover,
    bandwidth: metrics.businessBandwidth
  }];

  return <MasterTurnoverCards companies={aggregatedData} currency={currency} />;
}
