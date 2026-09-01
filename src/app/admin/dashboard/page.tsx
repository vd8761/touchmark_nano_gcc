import React, { Suspense } from "react";
import styles from "./dashboard.module.css";
import GlobalFiltersServer from "@/components/admin/GlobalFiltersServer";
import { GlobalFiltersSkeleton, TurnoverCardsSkeleton, KpiGridSkeleton, CountryOverviewSkeleton, ChartsRowSkeleton, EcosystemPartnerSkeleton, BottomTablesSkeleton } from "@/components/admin/DashboardSkeletons";
import { GlobalFilterProvider } from "@/components/admin/GlobalFilterContext";
import DashboardKpiGridServer from "@/components/admin/DashboardKpiGridServer";
import DashboardCountryOverviewServer from "@/components/admin/DashboardCountryOverviewServer";
import DashboardChartsRowServer from "@/components/admin/DashboardChartsRowServer";
import MasterTurnoverCardsServer from "@/components/admin/MasterTurnoverCardsServer";
import DashboardEcosystemPartnerServer from "@/components/admin/DashboardEcosystemPartnerServer";
import DashboardBottomTablesServer from "@/components/admin/DashboardBottomTablesServer";

export const metadata = {
  title: "GCC Admin Dashboard",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MasterDashboard({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = {
    country: typeof sp.country === "string" ? sp.country : undefined,
    ecosystemPartner: typeof sp.ecosystemPartner === "string" ? sp.ecosystemPartner : undefined,
    company: typeof sp.company === "string" ? sp.company : undefined,
    currency: typeof sp.currency === "string" ? sp.currency : undefined,
  };

  return (
    <div className={`adm-main ${styles.dashboardContainer}`}>
      
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Overview Dashboard</h1>
          <p className={styles.pageSubtitle}>Monitor key performance indicators and global statistics</p>
        </div>
      </div>

      {/* 2-Column Master Layout */}
      <div className={styles.mainGrid}>
        
        {/* Left Column (60%) */}
        <div className={styles.leftColumn}>
            <Suspense fallback={<GlobalFiltersSkeleton />}>
              <GlobalFiltersServer />
            </Suspense>
            
            <Suspense fallback={<KpiGridSkeleton />}>
              <DashboardKpiGridServer filters={filters} />
            </Suspense>
            
            <Suspense fallback={<TurnoverCardsSkeleton />}>
              <MasterTurnoverCardsServer filters={filters} />
            </Suspense>
            
        </div>

        {/* Right Column (40%) */}
        <div className={styles.rightColumn}>
            <Suspense fallback={<CountryOverviewSkeleton />}>
              <DashboardCountryOverviewServer filters={filters} />
            </Suspense>
        </div>

      </div>

      {/* Full Width Row: Charts & Funnel */}
      <Suspense fallback={<ChartsRowSkeleton />}>
        <DashboardChartsRowServer filters={filters} />
      </Suspense>

        {/* Full Width Row: Ecosystem Partner View */}
      <div className={styles.fullWidthSection}>
        <Suspense fallback={<EcosystemPartnerSkeleton />}>
          <DashboardEcosystemPartnerServer filters={filters} />
        </Suspense>
      </div>

      {/* Full Width Row: Bottom Tables */}
      <div className={styles.fullWidthSection}>
        <Suspense fallback={<BottomTablesSkeleton />}>
          <DashboardBottomTablesServer filters={filters} />
        </Suspense>
      </div>

    </div>
  );
}
