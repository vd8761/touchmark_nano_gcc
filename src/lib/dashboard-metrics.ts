import { sql } from "./db";

export interface GlobalMetrics {
  currentTurnover: number;
  projectedTurnover: number;
  businessBandwidth: number;
}

export async function getGlobalMetrics(filters?: any): Promise<GlobalMetrics> {
  // Wait a little to show loading state (for demonstration)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const cFilter = filters?.country && filters.country !== "All Countries" ? filters.country : null;
  let currencyFilter = 'USD';
  if (cFilter === 'India') currencyFilter = 'INR';
  else if (cFilter === 'Sri Lanka') currencyFilter = 'LKR';
  else if (cFilter === 'UAE') currencyFilter = 'AED';
  else if (cFilter === 'Singapore') currencyFilter = 'SGD';

  try {
    const result = await sql()`
      SELECT 
        SUM(turnover_current) as current_turnover,
        SUM(turnover_projected) as projected_turnover
      FROM companies
      WHERE (${cFilter}::text IS NULL OR country = ${cFilter})
        AND currency = ${currencyFilter}
    `.catch(() => null);

    if (!result) {
      return {
        currentTurnover: 0,
        projectedTurnover: 0,
        businessBandwidth: 0,
      };
    }

    return {
      currentTurnover: parseFloat(result[0]?.current_turnover || "0"),
      projectedTurnover: parseFloat(result[0]?.projected_turnover || "0"),
      businessBandwidth: 0, 
    };
  } catch (error) {
    console.error("Database connection failed. Returning empty global metrics.", error);
    return {
      currentTurnover: 0,
      projectedTurnover: 0,
      businessBandwidth: 0,
    };
  }
}

export interface KpiMetrics {
  totalCompanies: number;
  totalGccs: number;
  totalEmployees: number; // Students
  openRoles: number; // Open Jobs
  institutions: number; // Colleges
  activeProjects: number; // Active Internship Batches
  growthRate?: string;
  certifications?: number;
  reportsGen?: number;
  marketShare?: string;
}

export async function getKpiMetrics(filters?: any): Promise<KpiMetrics> {
  // Wait a little to show loading state (for demonstration)
  await new Promise((resolve) => setTimeout(resolve, 600));

  const cFilter = filters?.country && filters.country !== "All Countries" ? filters.country : null;
  // TODO: Add other filters (company, partner) in WHERE clauses similarly if needed

  try {
    const results = await Promise.all([
      sql()`SELECT COUNT(*) as count FROM companies WHERE (${cFilter}::text IS NULL OR country = ${cFilter})`.catch((e) => { throw e; }),
      sql()`SELECT COUNT(*) as count FROM ecosystem_partners WHERE (${cFilter}::text IS NULL OR country = ${cFilter})`.catch((e) => { throw e; }),
      sql()`SELECT COUNT(*) as count FROM students WHERE (${cFilter}::text IS NULL OR country = ${cFilter})`.catch((e) => { throw e; }),
      sql()`SELECT COUNT(*) as count FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.status = 'OPEN' AND (${cFilter}::text IS NULL OR c.country = ${cFilter})`.catch((e) => { throw e; }),
      sql()`SELECT COUNT(*) as count FROM colleges WHERE (${cFilter}::text IS NULL OR country = ${cFilter})`.catch((e) => { throw e; }),
      sql()`SELECT COUNT(*) as count FROM internship_batches ib JOIN companies c ON ib.company_id = c.id WHERE ib.status = 'ACTIVE' AND (${cFilter}::text IS NULL OR c.country = ${cFilter})`.catch((e) => { throw e; })
    ]).catch((e) => null);

    if (!results) {
      return {
        totalCompanies: 0,
        totalGccs: 0,
        totalEmployees: 0,
        openRoles: 0,
        institutions: 0,
        activeProjects: 0
      };
    }

    const [
      companiesResult,
      gccsResult,
      studentsResult,
      jobsResult,
      collegesResult,
      batchesResult
    ] = results;

    return {
      totalCompanies: parseInt(companiesResult[0]?.count || "0"),
      totalGccs: parseInt(gccsResult[0]?.count || "0"),
      totalEmployees: parseInt(studentsResult[0]?.count || "0"),
      openRoles: parseInt(jobsResult[0]?.count || "0"),
      institutions: parseInt(collegesResult[0]?.count || "0"),
      activeProjects: parseInt(batchesResult[0]?.count || "0"),
      // Mock metrics for fields that don't have DB tables yet
      growthRate: "+18%",
      certifications: 3120,
      reportsGen: 450,
      marketShare: "34%"
    };
  } catch (error) {
    console.error("Database connection failed. Returning empty metrics.", error);
    return {
      totalCompanies: 0,
      totalGccs: 0,
      totalEmployees: 0,
      openRoles: 0,
      institutions: 0,
      activeProjects: 0,
      growthRate: "+18%",
      certifications: 3120,
      reportsGen: 450,
      marketShare: "34%"
    };
  }
}

export interface CountryMetrics {
  id: string;
  name: string;
  code: string;
  companies: string;
  companiesActive: string;
  partners: string;
  partnersActive: string;
  institutions: string;
  institutionsActive: string;
  talent: string;
  internships: string;
  internshipsAvail: string;
  placements: string;
  turnoverCurrent: string;
  turnoverProjected: string;
  mapSrc: string;
  topHubs: { name: string; val: string }[];
}

export async function getCountryMetrics(filters?: any): Promise<CountryMetrics[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const cFilter = filters?.country && filters.country !== "All Countries" ? filters.country : null;

  try {
    const rows = await sql()`
      SELECT country, COUNT(*) as company_count, SUM(turnover_current) as current_turnover, SUM(turnover_projected) as projected_turnover 
      FROM companies 
      WHERE country IS NOT NULL 
        AND (${cFilter}::text IS NULL OR country = ${cFilter})
      GROUP BY country
    `.catch(() => null);

    if (!rows) return [];

    const realCountries = rows.map((r: any) => {
      const code = r.country.toLowerCase();
      let name = r.country;
      if (code === 'in') name = 'India';
      if (code === 'us') name = 'United States';
      if (code === 'sg') name = 'Singapore';
      if (code === 'ae') name = 'UAE';
      if (code === 'lk') name = 'Sri Lanka';

      let currency = 'USD';
      if (code === 'in') currency = '₹';
      if (code === 'lk') currency = 'LKR';
      if (code === 'ae') currency = 'AED';
      if (code === 'sg') currency = 'S$';

      return {
        id: code,
        name: name,
        code: code.toUpperCase(),
        companies: r.company_count,
        companiesActive: '0',
        partners: '0',
        partnersActive: '0',
        institutions: '0',
        institutionsActive: '0',
        talent: '0',
        internships: '0',
        internshipsAvail: '0',
        placements: '0',
        turnoverCurrent: `${currency} ${(parseFloat(r.current_turnover) || 0).toFixed(1)}M`,
        turnoverProjected: `${currency} ${(parseFloat(r.projected_turnover) || 0).toFixed(1)}M`,
        mapSrc: code === 'in' ? '/india-map.jpg' : `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${code}/vector.svg`,
        topHubs: [{name: "Top Hub", val: r.company_count}]
      };
    });
    return realCountries.sort((a, b) => parseFloat(b.turnoverCurrent) - parseFloat(a.turnoverCurrent));
  } catch (error) {
    console.error("Database connection failed. Returning empty country metrics.", error);
    return [];
  }
}

export interface ChartMetrics {
  funnel: number[]; // [opportunities, applications, shortlisted, interviews, offers, placements]
  talent: {
    students: number;
    freshGrads: number;
    professionals: number;
    openPositions: number;
    total: number;
  };
  opportunitiesSeries?: {
    labels: string[];
    internships: number[];
    jobs: number[];
  };
}

export async function getChartMetrics(filters?: any): Promise<ChartMetrics> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const cFilter = filters?.country && filters.country !== "All Countries" ? filters.country : null;

  try {
    const results = await Promise.all([
      sql()`SELECT SUM(j.openings) as opps FROM jobs j JOIN companies c ON j.company_id = c.id WHERE (${cFilter}::text IS NULL OR c.country = ${cFilter})`.catch(() => null),
      sql()`SELECT ja.status, COUNT(*) as count FROM job_applications ja JOIN jobs j ON ja.job_id = j.id JOIN companies c ON j.company_id = c.id WHERE (${cFilter}::text IS NULL OR c.country = ${cFilter}) GROUP BY ja.status`.catch(() => null),
      sql()`SELECT s.talent_type, COUNT(*) as count FROM students s JOIN colleges col ON s.college_id = col.id WHERE (${cFilter}::text IS NULL OR col.country = ${cFilter}) GROUP BY s.talent_type`.catch(() => null),
      sql()`
        WITH months AS (
          SELECT date_trunc('month', current_date - interval '5 months') + (n || ' months')::interval as month
          FROM generate_series(0, 5) n
        )
        SELECT 
          to_char(m.month, 'Mon') as label,
          COALESCE(SUM(j.openings), 0) as jobs,
          COALESCE((SELECT COUNT(*) FROM internship_batches ib JOIN companies c2 ON ib.company_id = c2.id WHERE date_trunc('month', ib.created_at) = m.month AND (${cFilter}::text IS NULL OR c2.country = ${cFilter})), 0) as internships
        FROM months m
        LEFT JOIN jobs j ON date_trunc('month', j.created_at) = m.month
        LEFT JOIN companies c ON j.company_id = c.id AND (${cFilter}::text IS NULL OR c.country = ${cFilter})
        GROUP BY m.month
        ORDER BY m.month
      `.catch(() => null)
    ]);
    
    if (results.some(r => r === null)) return { funnel: [0,0,0,0,0,0], talent: { students: 0, freshGrads: 0, professionals: 0, openPositions: 0, total: 0 }, opportunitiesSeries: { labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], internships: [0,0,0,0,0,0], jobs: [0,0,0,0,0,0] } };

    const [jobsRow, appsRows, talentRows, seriesRows] = results as [any[], any[], any[], any[]];

    const opportunities = parseInt(jobsRow[0]?.opps || "0");
    const appsMap = appsRows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    const applied = appsMap['APPLIED'] || 0;
    const shortlisted = appsMap['SHORTLISTED'] || 0;
    const interview = appsMap['INTERVIEW'] || 0;
    const offered = appsMap['OFFERED'] || 0;
    const placed = appsMap['PLACED'] || 0;

    const talentMap = talentRows.reduce((acc: any, row: any) => {
      acc[row.talent_type || 'Student'] = parseInt(row.count);
      return acc;
    }, {});

    const students = talentMap['Student'] || 0;
    const freshGrads = talentMap['Fresh Graduate'] || 0;
    const professionals = talentMap['Working Professional'] || 0;
    const openPositions = opportunities; // simplified
    const totalTalent = students + freshGrads + professionals + openPositions;

    const labels = seriesRows.map((r: any) => r.label);
    const jobs = seriesRows.map((r: any) => parseInt(r.jobs || "0"));
    const internships = seriesRows.map((r: any) => parseInt(r.internships || "0"));

    return {
      funnel: [opportunities, applied, shortlisted, interview, offered, placed],
      talent: {
        students,
        freshGrads,
        professionals,
        openPositions,
        total: totalTalent
      },
      opportunitiesSeries: {
        labels,
        jobs,
        internships
      }
    };
  } catch (error) {
    console.error("Database connection failed. Returning empty chart metrics.", error);
    return {
      funnel: [0, 0, 0, 0, 0, 0],
      talent: {
        students: 0,
        freshGrads: 0,
        professionals: 0,
        openPositions: 0,
        total: 0
      },
      opportunitiesSeries: {
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        internships: [0, 0, 0, 0, 0, 0],
        jobs: [0, 0, 0, 0, 0, 0]
      }
    };
  }
}

export interface TableMetrics {
  partners: { name: string, activeCompanies: number, institutions: number, talent: number, commission: string }[];
  batches: { name: string, company: string, startDate: string, endDate: string, status: string, talentCount: number }[];
  jobs: { title: string, company: string, openings: number, status: string, applied: number, kind: string }[];
}

export async function getTableMetrics(filters?: any): Promise<TableMetrics> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const cFilter = filters?.country && filters.country !== "All Countries" ? filters.country : null;

  try {
    const results = await Promise.all([
      sql()`
        SELECT p.name, 
               (SELECT COUNT(*) FROM companies WHERE country = p.country AND (${cFilter}::text IS NULL OR country = ${cFilter})) as active_companies,
               (SELECT COUNT(*) FROM colleges WHERE country = p.country AND (${cFilter}::text IS NULL OR country = ${cFilter})) as institutions,
               (SELECT COUNT(*) FROM students WHERE country = p.country AND (${cFilter}::text IS NULL OR country = ${cFilter})) as talent
        FROM ecosystem_partners p
        WHERE (${cFilter}::text IS NULL OR p.country = ${cFilter})
        LIMIT 6
      `.catch(() => null),
      sql()`
        SELECT b.batch_name as name, c.name as company, b.start_date, b.end_date, b.status,
               (SELECT COUNT(*) FROM students WHERE batch_id = b.id) as talent_count
        FROM internship_batches b
        JOIN companies c ON b.company_id = c.id
        WHERE (${cFilter}::text IS NULL OR c.country = ${cFilter})
        ORDER BY b.created_at DESC
        LIMIT 5
      `.catch(() => null),
      sql()`
        SELECT e.name as title, e.organization as company, e.kind, e.status, 0 as openings, 0 as applied
        FROM enquiries e
        WHERE (${cFilter}::text IS NULL OR e.country = ${cFilter})
        ORDER BY e.created_at DESC
        LIMIT 5
      `.catch(() => null)
    ]);
    
    if (results.some(r => r === null)) return { partners: [], batches: [], jobs: [] };

    const [partnersRows, batchesRows, jobsRows] = results as [any[], any[], any[]];

    return {
      partners: partnersRows.map(r => ({
        name: r.name,
        activeCompanies: parseInt(r.active_companies || "0"),
        institutions: parseInt(r.institutions || "0"),
        talent: parseInt(r.talent || "0"),
        commission: "$0" // simplified
      })),
      batches: batchesRows.map(r => ({
        name: r.name,
        company: r.company,
        startDate: new Date(r.start_date).toLocaleDateString(),
        endDate: new Date(r.end_date).toLocaleDateString(),
        status: r.status,
        talentCount: parseInt(r.talent_count || "0")
      })),
      jobs: jobsRows.map(r => ({
        title: r.title,
        company: r.company,
        openings: 0,
        status: r.status,
        applied: 0,
        kind: r.kind
      }))
    };
  } catch (error) {
    console.error("Database connection failed. Returning empty table metrics.", error);
    return {
      partners: [],
      batches: [],
      jobs: []
    };
  }
}
