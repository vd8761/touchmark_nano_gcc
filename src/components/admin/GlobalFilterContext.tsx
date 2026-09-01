"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface GlobalFilters {
  country: string;
  ecosystemPartner: string;
  company: string;
  institution: string;
  dateRange: string;
  status: string;
  currency: string;
}

interface GlobalFilterContextType {
  filters: GlobalFilters;
  setFilter: (key: keyof GlobalFilters, value: string) => void;
  resetFilters: () => void;
}

const defaultFilters: GlobalFilters = {
  country: "All Countries",
  ecosystemPartner: "All Partners",
  company: "All Companies",
  institution: "All Institutions",
  dateRange: "01 May 2024 - 31 May 2025", // Replace with dynamic if needed
  status: "All Status",
  currency: "USD",
};

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);

  const setFilter = (key: keyof GlobalFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <GlobalFilterContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(GlobalFilterContext);
  if (context === undefined) {
    throw new Error("useGlobalFilters must be used within a GlobalFilterProvider");
  }
  return context;
}
