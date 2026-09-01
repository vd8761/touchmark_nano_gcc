"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import styles from "../../app/admin/dashboard/dashboard.module.css";

interface DashboardGlobalFiltersProps {
  countries: string[];
  partners: string[];
  companies: string[];
  institutions: string[];
}

// Premium react-select styles
const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    border: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent',
    minHeight: '20px',
    cursor: 'pointer'
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    color: '#0F172A',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 600,
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#94A3B8',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 500,
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#0F172A',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 600,
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  indicatorsContainer: () => ({ display: 'none' }),
  dropdownIndicator: (base: any) => ({ display: 'none' }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '8px',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    zIndex: 9999,
    minWidth: '180px',
    width: 'max-content',
  }),
  menuList: (base: any) => ({
    ...base,
    padding: '4px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    borderRadius: '6px',
    backgroundColor: state.isSelected ? '#EFF6FF' : state.isFocused ? '#F8FAFC' : 'transparent',
    color: state.isSelected ? '#1D4ED8' : '#1E293B',
    fontWeight: state.isSelected ? 600 : 400,
    cursor: 'pointer',
    padding: '8px 12px',
    '&:active': { backgroundColor: '#DBEAFE' }
  })
};

const currencySelectStyles = {
  ...selectStyles,
  singleValue: (base: any) => ({
    ...base,
    color: '#0F172A',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 600,
  }),
};

export function DashboardGlobalFilters({
  countries,
  partners,
  companies,
  institutions,
}: DashboardGlobalFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  const currentCountry = searchParams.get("country") || "All Countries";
  const currentPartner = searchParams.get("ecosystemPartner") || "All Partners";
  const currentCompany = searchParams.get("company") || "All Companies";

  const setFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All Countries" || value === "All Partners" || value === "All Companies") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    router.push(`?`, { scroll: false });
    setDateRange([null, null]);
  };

  const countryNames: Record<string, string> = {
    "IN": "India",
    "LK": "Sri Lanka",
    "AE": "UAE",
    "SG": "Singapore",
    "US": "USA"
  };

  const countryOptions = [{ value: "All Countries", label: "All Countries" }, ...countries.map(c => ({ value: c, label: countryNames[c] || c }))];
  const partnerOptions = [{ value: "All Partners", label: "All Partners" }, ...partners.map(p => ({ value: p, label: p }))];
  const companyOptions = [{ value: "All Companies", label: "All Companies" }, ...companies.map(c => ({ value: c, label: c }))];

  return (
    <div className={styles.filterBar}>
      
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Country</label>
        <Select 
          instanceId="country-select"
          options={countryOptions}
          value={countryOptions.find(o => o.value === currentCountry) || countryOptions[0]}
          onChange={(opt) => setFilterUrl("country", opt?.value || "All Countries")}
          styles={selectStyles}
          isSearchable={true}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          components={{ DropdownIndicator: () => null }}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Ecosystem Partner</label>
        <Select 
          instanceId="partner-select"
          options={partnerOptions}
          value={partnerOptions.find(o => o.value === currentPartner) || partnerOptions[0]}
          onChange={(opt) => setFilterUrl("ecosystemPartner", opt?.value || "All Partners")}
          styles={selectStyles}
          isSearchable={true}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          components={{ DropdownIndicator: () => null }}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Company</label>
        <Select 
          instanceId="company-select"
          options={companyOptions}
          value={companyOptions.find(o => o.value === currentCompany) || companyOptions[0]}
          onChange={(opt) => setFilterUrl("company", opt?.value || "All Companies")}
          styles={selectStyles}
          isSearchable={true}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          components={{ DropdownIndicator: () => null }}
        />
      </div>

      <div className={`${styles.filterGroup} ${styles.filterGroupWide}`}>
        <label className={styles.filterLabel}>Date Range</label>
        <DatePicker
          selectsRange={true}
          startDate={startDate}
          endDate={endDate}
          onChange={(update: any) => setDateRange(update)}
          dateFormat="dd MMM yy"
          monthsShown={2}
          placeholderText="Select date range"
          className={styles.datePickerInput}
        />
      </div>

      <div className={styles.filterActions}>
        <button onClick={resetFilters} className={styles.refreshBtn} title="Refresh Data">
          <RefreshCw size={18} color="#ffffff" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
