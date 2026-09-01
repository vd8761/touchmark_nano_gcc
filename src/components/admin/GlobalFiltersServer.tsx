import React from "react";
import { GlobalFiltersClient } from "./GlobalFiltersClient";
import { sql } from "@/lib/db";

async function fetchFilterData(filters?: any) {
  const cFilter = filters?.country && filters.country !== "All Countries" ? filters.country : null;
  const partFilter = filters?.ecosystemPartner && filters.ecosystemPartner !== "All Partners" ? filters.ecosystemPartner : null;

  try {
    const countryRows = await sql`SELECT DISTINCT country FROM companies WHERE country IS NOT NULL`.catch(() => []);
    
    // Fetch active partners
    // Filter by country if selected
    const partnerRows = await sql`
      SELECT name FROM ecosystem_partners 
      WHERE nda_status = 'ACTIVE'
        AND (${cFilter}::text IS NULL OR contact_details->>'country' = ${cFilter})
      ORDER BY name ASC
    `.catch(() => []);

    // Fetch companies
    // Filter by ecosystem partner (if selected) or country (if selected)
    // If no partner is selected but country is, show direct companies + partner companies in that country
    const companyRows = await sql`
      SELECT name FROM companies 
      WHERE (${cFilter}::text IS NULL OR country = ${cFilter})
        AND (${partFilter}::text IS NULL OR ecosystem_partner_id IN (SELECT id FROM ecosystem_partners WHERE name = ${partFilter}))
      ORDER BY name ASC
    `.catch(() => []);

    // Fetch colleges
    const collegeRows = await sql`
      SELECT name FROM colleges 
      WHERE (${cFilter}::text IS NULL OR country = ${cFilter})
      ORDER BY name ASC
    `.catch(() => []);

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

export default async function GlobalFiltersServer({ filters }: { filters?: any }) {
  const data = await fetchFilterData(filters);
  
  return (
    <GlobalFiltersClient 
      countries={data.countries}
      partners={data.partners}
      companies={data.companies}
      institutions={data.institutions}
    />
  );
}
