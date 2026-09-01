"use client";

import dynamic from "next/dynamic";
import { GlobalFiltersSkeleton } from "./DashboardSkeletons";

// ssr:false must be inside a Client Component
const DashboardGlobalFilters = dynamic(
  () => import("./DashboardGlobalFilters").then((m) => ({ default: m.DashboardGlobalFilters })),
  { ssr: false, loading: () => <GlobalFiltersSkeleton /> }
);

interface GlobalFiltersClientProps {
  countries: string[];
  partners: string[];
  companies: string[];
  institutions: string[];
}

export function GlobalFiltersClient(props: GlobalFiltersClientProps) {
  return <DashboardGlobalFilters {...props} />;
}
