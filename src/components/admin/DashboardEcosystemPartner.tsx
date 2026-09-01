"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from '@/app/admin/dashboard/dashboard.module.css';
import { 
  Building2, 
  Library, 
  Users, 
  Briefcase, 
  GraduationCap, 
  CheckCircle,
  TrendingUp,
  DollarSign,
  ChevronDown,
  Clock,
  Layers,
  Search
} from 'lucide-react';
import type { TableMetrics } from '@/lib/dashboard-metrics';

interface DashboardEcosystemPartnerProps {
  metrics?: TableMetrics;
}

export default function DashboardEcosystemPartner({ metrics }: DashboardEcosystemPartnerProps) {
  const partners = metrics?.partners || [];

  const PARTNERS = partners.map(p => p.name);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(PARTNERS[0] || 'No Partners Available');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPartners = PARTNERS.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentPartnerData = partners.find(p => p.name === selectedPartner) || partners[0];

  return (
    <div className={styles.ecoSection}>
      <h3 className={styles.ecoSectionTitle}>ECOSYSTEM PARTNER VIEW</h3>
      
      <div className={styles.ecoCard}>
        {/* Left Panel */}
        <div className={styles.ecoLeftPanel}>
          <div className={styles.ecoDropdownGroup} ref={dropdownRef}>
            <label className={styles.ecoLabel}>Ecosystem Partner</label>
            <div 
              className={`${styles.ecoDropdown} ${isDropdownOpen ? styles.ecoDropdownOpen : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{selectedPartner}</span>
              <ChevronDown size={16} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </div>
            {isDropdownOpen && (
              <div className={styles.ecoDropdownMenu}>
                <div className={styles.ecoSearchBox}>
                  <Search size={14} className={styles.ecoSearchIcon} />
                  <input 
                    type="text" 
                    placeholder="Search partner..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.ecoSearchInput}
                    autoFocus
                  />
                </div>
                <div className={styles.ecoDropdownList}>
                  {filteredPartners.length > 0 ? filteredPartners.map(p => (
                    <div 
                      key={p} 
                      className={`${styles.ecoDropdownItem} ${selectedPartner === p ? styles.ecoDropdownItemSelected : ''}`}
                      onClick={() => {
                        setSelectedPartner(p);
                        setIsDropdownOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      {p}
                    </div>
                  )) : (
                    <div className={styles.ecoDropdownEmpty}>No partners found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.ecoMicroCard}>
            <div className={styles.ecoMicroIcon} style={{ color: '#3B82F6' }}>
              <Building2 size={20} />
            </div>
            <div className={styles.ecoMicroContent}>
              <div className={styles.ecoMicroHeader}>
                <span className={styles.ecoMicroTitle}>Companies Onboarded</span>
              </div>
              <div className={styles.ecoMicroValueRow}>
                <span className={styles.ecoMicroValue}>{currentPartnerData?.activeCompanies || 0}</span>
                <span className={styles.ecoMicroSub}>Active <strong>{currentPartnerData?.activeCompanies || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className={styles.ecoMicroCard}>
            <div className={styles.ecoMicroIcon} style={{ color: '#10B981' }}>
              <Library size={20} />
            </div>
            <div className={styles.ecoMicroContent}>
              <div className={styles.ecoMicroHeader}>
                <span className={styles.ecoMicroTitle}>Institutions</span>
              </div>
              <div className={styles.ecoMicroValueRow}>
                <span className={styles.ecoMicroValue}>{currentPartnerData?.institutions || 0}</span>
                <span className={styles.ecoMicroSub}>Active <strong>{currentPartnerData?.institutions || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className={styles.ecoMicroCard}>
            <div className={styles.ecoMicroIcon} style={{ color: '#F97316' }}>
              <Users size={20} />
            </div>
            <div className={styles.ecoMicroContent}>
              <div className={styles.ecoMicroHeader}>
                <span className={styles.ecoMicroTitle}>Talent Registered</span>
              </div>
              <div className={styles.ecoMicroValueRow}>
                <span className={styles.ecoMicroValue}>{(currentPartnerData?.talent || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.ecoRightPanel}>
          
          {/* Top Row Grid */}
          <div className={styles.ecoGrid}>
            <div className={styles.ecoStatCard}>
              <div className={styles.ecoStatIcon} style={{ backgroundColor: '#E0F2FE', color: '#0EA5E9' }}>
                <Briefcase size={24} />
              </div>
              <div className={styles.ecoStatContent}>
                <div className={styles.ecoStatTitle}>Internship Opportunities</div>
                <div className={styles.ecoStatValue}>0</div>
                <div className={styles.ecoStatSub}>Available <strong>0</strong></div>
              </div>
            </div>

            <div className={styles.ecoStatCard}>
              <div className={styles.ecoStatIcon} style={{ backgroundColor: '#F3E8FF', color: '#A855F7' }}>
                <Clock size={24} />
              </div>
              <div className={styles.ecoStatContent}>
                <div className={styles.ecoStatTitle}>Ongoing Internships</div>
                <div className={styles.ecoStatValue}>0</div>
              </div>
            </div>

            <div className={styles.ecoStatCard}>
              <div className={styles.ecoStatIcon} style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.ecoStatContent}>
                <div className={styles.ecoStatTitle}>Completed Internships</div>
                <div className={styles.ecoStatValue}>0</div>
              </div>
            </div>

            <div className={styles.ecoStatCard}>
              <div className={styles.ecoStatIcon} style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}>
                <Briefcase size={24} />
              </div>
              <div className={styles.ecoStatContent}>
                <div className={styles.ecoStatTitle}>Job Opportunities</div>
                <div className={styles.ecoStatValue}>0</div>
              </div>
            </div>

            <div className={styles.ecoStatCard}>
              <div className={styles.ecoStatIcon} style={{ backgroundColor: '#FFEDD5', color: '#F97316' }}>
                <Users size={24} />
              </div>
              <div className={styles.ecoStatContent}>
                <div className={styles.ecoStatTitle}>Placements</div>
                <div className={styles.ecoStatValue}>0</div>
              </div>
            </div>

            <div className={styles.ecoStatCard}>
              <div className={styles.ecoStatIcon} style={{ backgroundColor: '#FCE7F3', color: '#EC4899' }}>
                <Layers size={24} />
              </div>
              <div className={styles.ecoStatContent}>
                <div className={styles.ecoStatTitle}>Active Batches</div>
                <div className={styles.ecoStatValue}>0</div>
              </div>
            </div>
          </div>

          {/* Bottom Financial / Leads Row */}
          <div className={styles.ecoBottomBar}>
            <div className={styles.ecoBottomItem}>
              <div className={styles.ecoBottomTitle}>Enquiries Generated</div>
              <div className={styles.ecoBottomValue}>0</div>
            </div>
            
            <div className={styles.ecoBottomItem}>
              <div className={styles.ecoBottomTitle}>Turnover (Current)</div>
              <div className={styles.ecoBottomValue}>$ 0</div>
            </div>

            <div className={styles.ecoBottomItem}>
              <div className={styles.ecoBottomTitle}>Turnover (Projected)</div>
              <div className={styles.ecoBottomValue}>$ 0</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
