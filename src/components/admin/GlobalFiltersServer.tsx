import React from "react";
import { GlobalFiltersClient } from "./GlobalFiltersClient";
import { sql } from "@/lib/db";

async function fetchFilterData() {
  try {
    const [countryRows, partnerRows, companyRows, collegeRows] = await Promise.all([
      sql()`SELECT DISTINCT country FROM companies WHERE country IS NOT NULL`.catch(() => []),
      sql()`SELECT name FROM ecosystem_partners WHERE status = 'ACTIVE' LIMIT 20`.catch(() => []),
      sql()`SELECT name FROM companies ORDER BY name ASC LIMIT 50`.catch(() => []),
      sql()`SELECT name FROM colleges ORDER BY name ASC LIMIT 20`.catch(() => [])
    ]);

    // Provide a fallback set of countries so the dropdown isn't empty when DB is disconnected
    const fallbackCountries = ["India", "Sri Lanka", "UAE", "Singapore", "USA"];

    return {
      countries: countryRows.length > 0 ? countryRows.map(r => r.country).sort() : fallbackCountries,
      partners: partnerRows.map(r => r.name),
      companies: companyRows.map(r => r.name),
      institutions: collegeRows.map(r => r.name),
    };
  } catch (error) {
    return {
      countries: ["India", "Sri Lanka", "UAE", "Singapore", "USA"],
      partners: [],
      companies: [],
      institutions: []
    };
  }
}

export default async function GlobalFiltersServer() {
  const data = await fetchFilterData();
  
  return (
    <GlobalFiltersClient 
      countries={data.countries}
      partners={data.partners}
      companies={data.companies}
      institutions={data.institutions}
    />
  );
}
