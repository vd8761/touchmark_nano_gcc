"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from '@/app/admin/dashboard/dashboard.module.css';
import { ChevronDown } from 'lucide-react';

import type { CountryMetrics } from '@/lib/dashboard-metrics';

interface DashboardCountryOverviewProps {
  countries?: CountryMetrics[];
}

export function DashboardCountryOverview({ countries: initialCountries }: DashboardCountryOverviewProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState("in");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fallback to empty default if no real data is provided
  const countries = initialCountries && initialCountries.length > 0 ? initialCountries : [
    { 
      id: "in", name: "India", code: "IN", 
      companies: "0", companiesActive: "0", partners: "0", partnersActive: "0",
      institutions: "0", institutionsActive: "0", talent: "0", internships: "0", internshipsAvail: "0",
      placements: "0", turnoverCurrent: "₹ 0M", turnoverProjected: "₹ 0M", mapSrc: "/assets/india_map.jpg", topHubs: []
    },
    { 
      id: "lk", name: "Sri Lanka", code: "LK", 
      companies: "0", companiesActive: "0", partners: "0", partnersActive: "0",
      institutions: "0", institutionsActive: "0", talent: "0", internships: "0", internshipsAvail: "0",
      placements: "0", turnoverCurrent: "LKR 0M", turnoverProjected: "LKR 0M", mapSrc: "https://raw.githubusercontent.com/djaiss/mapsicon/master/all/lk/vector.svg", topHubs: []
    },
    { 
      id: "ae", name: "UAE", code: "AE", 
      companies: "0", companiesActive: "0", partners: "0", partnersActive: "0",
      institutions: "0", institutionsActive: "0", talent: "0", internships: "0", internshipsAvail: "0",
      placements: "0", turnoverCurrent: "AED 0M", turnoverProjected: "AED 0M", mapSrc: "https://raw.githubusercontent.com/djaiss/mapsicon/master/all/ae/vector.svg", topHubs: []
    },
    { 
      id: "sg", name: "Singapore", code: "SG", 
      companies: "0", companiesActive: "0", partners: "0", partnersActive: "0",
      institutions: "0", institutionsActive: "0", talent: "0", internships: "0", internshipsAvail: "0",
      placements: "0", turnoverCurrent: "S$ 0M", turnoverProjected: "S$ 0M", mapSrc: "https://raw.githubusercontent.com/djaiss/mapsicon/master/all/sg/vector.svg", topHubs: []
    },
    { 
      id: "us", name: "USA", code: "US", 
      companies: "0", companiesActive: "0", partners: "0", partnersActive: "0",
      institutions: "0", institutionsActive: "0", talent: "0", internships: "0", internshipsAvail: "0",
      placements: "0", turnoverCurrent: "$ 0M", turnoverProjected: "$ 0M", mapSrc: "https://raw.githubusercontent.com/djaiss/mapsicon/master/all/us/vector.svg", topHubs: []
    }
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCountry = countries.find(c => c.id === selectedCountryId) || countries[0];

  return (
    <div className={styles.countryViewContainer}>
      <div className={styles.countryViewBody}>
        {/* Right Detail Panel (Now Full Width) */}
        <div className={styles.countryDetails}>
          <div className={styles.detailsHeaderRow}>
            <h3 className={styles.detailsHeader}>Country Overview</h3>
            <div className={styles.countryDropdownWrapper} ref={dropdownRef}>
              <div 
                className={styles.customSelectTrigger} 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <img src={`https://flagcdn.com/${selectedCountry.code.toLowerCase()}.svg`} alt="flag" width="18" height="14" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                <span>{selectedCountry.name}</span>
                <ChevronDown size={14} />
              </div>
              
              {isDropdownOpen && (
                <div className={styles.customSelectMenu}>
                  {countries.map(c => (
                    <div 
                      key={c.id} 
                      className={`${styles.customSelectOption} ${c.id === selectedCountryId ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedCountryId(c.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <img src={`https://flagcdn.com/${c.code.toLowerCase()}.svg`} alt="flag" width="18" height="14" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                      <span>{c.name}</span>
                      <div className={styles.checkIcon}>
                        {c.id === selectedCountryId && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.detailsTopSplit}>
            {/* Map Column */}
            <div className={styles.mapColumn}>
              {/* Map Area */}
              <div className={styles.mapContainer}>
                <img 
                  src={selectedCountry.mapSrc} 
                  alt={`${selectedCountry.name} Map`} 
                  style={selectedCountry.id !== 'in' ? { filter: 'invert(53%) sepia(76%) saturate(2371%) hue-rotate(198deg) brightness(101%) contrast(97%)' } : {}}
                />
              </div>

              {/* Additional Information: Top Hubs */}
              <div className={styles.countryTopHubs}>
                <span className={styles.hubsTitle}>Top Hubs:</span>
                <div className={styles.hubsList}>
                  {selectedCountry.topHubs?.map((hub: any, i: number) => (
                    <div key={i} className={styles.hubBadge}>
                      {hub.name} <span>{hub.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricMicroCard}>
                <span className={styles.microCardTitle}>Companies</span>
                <span className={styles.microCardValue}>{selectedCountry.companies}</span>
                <div className={styles.microCardSub}>Active <span>{selectedCountry.companiesActive}</span></div>
              </div>
              <div className={styles.metricMicroCard}>
                <span className={styles.microCardTitle}>Ecosystem Partners</span>
                <span className={styles.microCardValue}>{selectedCountry.partners}</span>
                <div className={styles.microCardSub}>Active <span>{selectedCountry.partnersActive}</span></div>
              </div>
              <div className={styles.metricMicroCard}>
                <span className={styles.microCardTitle}>Institutions</span>
                <span className={styles.microCardValue}>{selectedCountry.institutions}</span>
                <div className={styles.microCardSub}>Active <span>{selectedCountry.institutionsActive}</span></div>
              </div>
              <div className={styles.metricMicroCard}>
                <span className={styles.microCardTitle}>Talent</span>
                <span className={styles.microCardValue}>{selectedCountry.talent}</span>
              </div>
              <div className={styles.metricMicroCard}>
                <span className={styles.microCardTitle}>Internships</span>
                <span className={styles.microCardValue}>{selectedCountry.internships}</span>
                <div className={styles.microCardSub}>Available <span>{selectedCountry.internshipsAvail}</span></div>
              </div>
              <div className={styles.metricMicroCard}>
                <span className={styles.microCardTitle}>Placements</span>
                <span className={styles.microCardValue}>{selectedCountry.placements}</span>
              </div>
            </div>
          </div>

          {/* Bottom Turnover Bar */}
          <div className={styles.turnoverBar}>
            <div className={styles.turnoverCol}>
              <span className={styles.turnoverLabel}>Turnover (Current)</span>
              <span className={styles.turnoverValue}>{selectedCountry.turnoverCurrent}</span>
            </div>
            <div className={styles.turnoverCol} style={{ textAlign: 'right' }}>
              <span className={styles.turnoverLabel}>Turnover (Projected)</span>
              <span className={styles.turnoverValue}>{selectedCountry.turnoverProjected}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
