"use client";

import React, { useMemo } from "react";
import { useGlobalFilters } from "@/components/admin/GlobalFilterContext";
import { DashboardGlobalFilters } from "./DashboardGlobalFilters";
import { MasterKpiCards } from "./MasterKpiCards";
import { MasterCharts } from "./MasterCharts";
import { MasterTurnoverCards } from "./MasterTurnoverCards";
import { MasterTables } from "./MasterTables";
import styles from "../../app/admin/dashboard/dashboard.module.css";
import { CountryWiseView } from "./CountryWiseView";
import { EcosystemPartnerView } from "./EcosystemPartnerView";

export function MasterDashboardClient({ 
  rawPartners, 
  rawCompanies, 
  rawInstitutions, 
  rawStudents, 
  rawBatches, 
  rawJobs, 
  rawApplications, 
  rawEnquiries 
}: any) {
  const { filters } = useGlobalFilters();

  // Extract unique values for filters
  const uniqueCountries = useMemo(() => {
    const s = new Set<string>();
    rawPartners.forEach((p: any) => p.country && s.add(p.country));
    rawCompanies.forEach((c: any) => c.country && s.add(c.country));
    rawInstitutions.forEach((i: any) => i.country && s.add(i.country));
    return Array.from(s).sort();
  }, [rawPartners, rawCompanies, rawInstitutions]);

  const uniquePartners = useMemo(() => Array.from(new Set(rawPartners.map((p: any) => p.name))).sort() as string[], [rawPartners]);
  const uniqueCompanies = useMemo(() => Array.from(new Set(rawCompanies.map((c: any) => c.name))).sort() as string[], [rawCompanies]);
  const uniqueInstitutions = useMemo(() => Array.from(new Set(rawInstitutions.map((i: any) => i.name))).sort() as string[], [rawInstitutions]);

  // Apply filters to data
  const filteredCompanies = useMemo(() => {
    return rawCompanies.filter((c: any) => {
      if (filters.country !== "All Countries" && c.country !== filters.country) return false;
      if (filters.company !== "All Companies" && c.name !== filters.company) return false;
      return true;
    });
  }, [rawCompanies, filters]);

  // Apply similar filtering to other raw data depending on what is needed
  // ... (For a robust MVP, you filter students based on their company, or directly by their country)

  return (
    <div className={styles.mainGrid}>
      {/* Left Column (70%) */}
      <div className={styles.leftColumn}>
        <DashboardGlobalFilters 
          countries={uniqueCountries} 
          partners={uniquePartners} 
          companies={uniqueCompanies} 
          institutions={uniqueInstitutions} 
        />

        <MasterKpiCards 
          partners={rawPartners}
          companies={filteredCompanies}
          institutions={rawInstitutions}
          students={rawStudents}
          batches={rawBatches}
          jobs={rawJobs}
          currency={filters.currency}
        />

        <MasterCharts 
          students={rawStudents}
          applications={rawApplications}
          jobs={rawJobs}
          companies={filteredCompanies}
          currency={filters.currency}
        />

        <MasterTurnoverCards 
          companies={filteredCompanies} 
          currency={filters.currency}
        />

        <MasterTables 
          batches={rawBatches}
          enquiries={rawEnquiries}
        />
      </div>

      {/* Right Column (30%) */}
      <div className={styles.rightColumn}>
         <CountryWiseView 
           companies={filteredCompanies} 
           partners={rawPartners} 
           institutions={rawInstitutions} 
           currency={filters.currency} 
         />
         <EcosystemPartnerView 
           companies={filteredCompanies} 
           partners={rawPartners} 
           institutions={rawInstitutions} 
           students={rawStudents}
           jobs={rawJobs}
           batches={rawBatches}
           enquiries={rawEnquiries}
           currency={filters.currency} 
         />
      </div>

    </div>
  );
}
