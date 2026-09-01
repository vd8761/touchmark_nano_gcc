"use client";

import React from "react";
import { DollarSign, TrendingUp, Briefcase } from "lucide-react";
import styles from "../../app/admin/dashboard/dashboard.module.css";

interface MasterTurnoverCardsProps {
  companies?: any[];
  currency?: string;
}

export function MasterTurnoverCards({
  companies = [],
  currency = 'INR'
}: MasterTurnoverCardsProps) {

  const rates: Record<string, number> = {
    USD: 1,
    INR: 83.5,
    LKR: 300,
    AED: 3.67,
    SGD: 1.35
  };

  const symbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    LKR: 'LKR',
    AED: 'AED',
    SGD: 'S$'
  };

  const rate = rates[currency] || 83.5;
  const symbol = symbols[currency] || '₹';

  // Format big numbers
  const formatCurrency = (val: number) => {
    if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
    if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  // Calculate values from companies data or fallback to defaults
  let currentTurnover = 0;
  let projectedTurnover = 0;
  let bandwidth = 0;

  companies.forEach(c => {
    currentTurnover += (Number(c.turnover_current) || 0);
    projectedTurnover += (Number(c.turnover_projected) || 0);
    bandwidth += (Number(c.bandwidth) || 0);
  });

  const displayCurrent = currentTurnover * rate;
  const displayProjected = projectedTurnover * rate;
  const displayBandwidth = bandwidth * rate;

  return (
    <div className={styles.turnoverGrid}>

      {/* Current Turnover */}
      <div className={styles.turnoverCard}>
        <div className={`${styles.turnoverIcon} ${styles.bgPurple}`}>
          <DollarSign />
        </div>
        <div className={styles.turnoverContent}>
          <div className={styles.turnoverTitle}>Current Ecosystem Turnover</div>
          <div className={styles.turnoverValueRow}>
            <div className={styles.turnoverValueBig}>
              {symbol} {formatCurrency(displayCurrent)}
            </div>
            <div className={styles.turnoverCurrencyCode}>({currency})</div>
          </div>
        </div>
      </div>

      {/* Projected Turnover */}
      <div className={styles.turnoverCard}>
        <div className={`${styles.turnoverIcon} ${styles.bgEmerald}`}>
          <TrendingUp />
        </div>
        <div className={styles.turnoverContent}>
          <div className={styles.turnoverTitle}>Projected Ecosystem Turnover</div>
          <div className={styles.turnoverValueRow}>
            <div className={styles.turnoverValueBig}>
              {symbol} {formatCurrency(displayProjected)}
            </div>
            <div className={styles.turnoverCurrencyCode}>({currency})</div>
          </div>
        </div>
      </div>

      {/* Business Bandwidth */}
      <div className={styles.turnoverCard}>
        <div className={`${styles.turnoverIcon} ${styles.bgOrange}`}>
          <Briefcase />
        </div>
        <div className={styles.turnoverContent}>
          <div className={styles.turnoverTitle}>Total Business Bandwidth</div>
          <div className={styles.turnoverValueRow}>
            <div className={styles.turnoverValueBig}>
              {symbol} {formatCurrency(displayBandwidth)}
            </div>
            <div className={styles.turnoverCurrencyCode}>({currency})</div>
          </div>
        </div>
      </div>

    </div>
  );
}
