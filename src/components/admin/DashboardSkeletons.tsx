"use client";

import React from "react";
import styles from "../../app/admin/dashboard/dashboard.module.css";

export function GlobalFiltersSkeleton() {
  return (
    <div className={styles.filterBar}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={styles.filterGroup}>
          <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: "60px", height: "12px", marginBottom: "8px" }}></div>
          <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ height: "38px", width: "100%", borderRadius: "8px" }}></div>
        </div>
      ))}
      <div className={styles.filterActions}>
        <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: "38px", height: "38px", borderRadius: "8px" }}></div>
        <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: "38px", height: "38px", borderRadius: "8px" }}></div>
      </div>
    </div>
  );
}

export function TurnoverCardsSkeleton() {
  return (
    <div className={styles.turnoverGrid}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.turnoverCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
            <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '120px', height: '14px' }}></div>
          </div>
          <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '80%', height: '24px' }}></div>
        </div>
      ))}
    </div>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className={styles.kpiGrid}>
      {[...Array(10)].map((_, i) => (
        <div key={i} className={styles.kpiCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <div className={styles.kpiHeader}>
             <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '80px', height: '14px' }}></div>
             <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '40px', height: '40px', borderRadius: '8px' }}></div>
           </div>
           <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '50%', height: '28px' }}></div>
        </div>
      ))}
    </div>
  );
}

export function CountryOverviewSkeleton() {
  return (
    <div className={styles.countryOverviewPanel} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className={styles.panelHeader} style={{ marginBottom: '16px' }}>
        <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '150px', height: '24px' }}></div>
        <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '120px', height: '36px', borderRadius: '8px' }}></div>
      </div>
      <div className={styles.countryContent} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '100%', flex: 1, minHeight: '300px', borderRadius: '12px' }}></div>
        <div className={styles.countryStatsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.statBox} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '80px', height: '14px' }}></div>
              <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '60px', height: '20px' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChartsRowSkeleton() {
  return (
    <div className={styles.chartsRowGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '24px' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '350px' }}>
          <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '150px', height: '20px' }}></div>
          <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '100%', flex: 1, borderRadius: '8px' }}></div>
        </div>
      ))}
    </div>
  );
}

export function EcosystemPartnerSkeleton() {
  return (
    <div className={styles.ecoSection} style={{ marginTop: '32px' }}>
      <div className={`${styles.skeletonText} ${styles.pulse}`} style={{ width: '200px', height: '24px', marginBottom: '16px' }}></div>
      <div className={styles.ecoCard} style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
        <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '250px', height: '100%', borderRadius: '12px' }}></div>
        <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ flex: 1, height: '100%', borderRadius: '12px' }}></div>
      </div>
    </div>
  );
}

export function BottomTablesSkeleton() {
  return (
    <div className={styles.bottomTablesGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginTop: '24px' }}>
      <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '100%', height: '400px', borderRadius: '12px' }}></div>
      <div className={`${styles.skeletonBox} ${styles.pulse}`} style={{ width: '100%', height: '400px', borderRadius: '12px' }}></div>
    </div>
  );
}
