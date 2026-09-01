"use client";

import React, { useState, useRef } from 'react';
import styles from '@/app/admin/dashboard/dashboard.module.css';

export interface ChartMetrics {
  funnel: number[];
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

interface DashboardChartsRowProps {
  metrics?: ChartMetrics;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  internships: number;
  jobs: number;
}

interface FunnelTooltip {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
}

interface DonutTooltip {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  pct: number;
}

const FUNNEL_LABELS = [
  'Opportunities Created',
  'Applications',
  'Shortlisted',
  'Interviews',
  'Offers',
  'Placements',
];

export function DashboardChartsRow({ metrics }: DashboardChartsRowProps) {
  const funnel = metrics?.funnel || [0, 0, 0, 0, 0, 0];
  const talent = metrics?.talent || {
    students: 0,
    freshGrads: 0,
    professionals: 0,
    openPositions: 0,
    total: 0,
  };

  const opportunitiesSeries = metrics?.opportunitiesSeries || {
    labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    internships: [0, 0, 0, 0, 0, 0],
    jobs: [0, 0, 0, 0, 0, 0],
  };

  // ---- SVG Donut chart helper ----
  const getDonutPath = (cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) => {
    const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    // Clamp to avoid full-circle path issues
    const sweep = Math.min(endDeg - startDeg, 359.99);
    const eActual = toRad(startDeg + sweep);
    const largeArc = sweep > 180 ? 1 : 0;
    const x1 = cx + outerR * Math.cos(s);
    const y1 = cy + outerR * Math.sin(s);
    const x2 = cx + outerR * Math.cos(eActual);
    const y2 = cy + outerR * Math.sin(eActual);
    const x3 = cx + innerR * Math.cos(eActual);
    const y3 = cy + innerR * Math.sin(eActual);
    const x4 = cx + innerR * Math.cos(s);
    const y4 = cy + innerR * Math.sin(s);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
  };

  // ---- Line chart setup ----
  const xCoords = [50, 110, 170, 230, 290, 350];
  const allVals = [...opportunitiesSeries.internships, ...opportunitiesSeries.jobs];
  const maxVal = Math.max(...allVals, 1);
  const yMin = 200;
  const yMax = 20;
  const getY = (val: number) => yMin - ((val / maxVal) * (yMin - yMax));
  const getPoints = (data: number[]) =>
    data.map((val, i) => `${xCoords[i]},${getY(val)}`).join(' ');
  const formatYAxis = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return Math.round(val);
  };

  // ---- Donut chart setup ----
  const calcPct = (val: number) => {
    if (!talent.total) return 0;
    return Math.round((val / talent.total) * 100);
  };

  // ---- Tooltip states ----
  const [lineTooltip, setLineTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, label: '', internships: 0, jobs: 0,
  });
  const [funnelTooltip, setFunnelTooltip] = useState<FunnelTooltip>({
    visible: false, x: 0, y: 0, label: '', value: 0,
  });
  const [donutTooltip, setDonutTooltip] = useState<DonutTooltip>({
    visible: false, x: 0, y: 0, label: '', value: 0, pct: 0,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  const handleDotHover = (
    e: React.MouseEvent<SVGElement>,
    idx: number,
  ) => {
    const rect = (e.currentTarget as SVGElement).closest('svg')!.getBoundingClientRect();
    const parentRect = (e.currentTarget as SVGElement).closest('.'+styles.lineChartWrapper)?.getBoundingClientRect()
      || rect;
    setLineTooltip({
      visible: true,
      x: e.clientX - parentRect.left,
      y: e.clientY - parentRect.top,
      label: opportunitiesSeries.labels[idx],
      internships: opportunitiesSeries.internships[idx],
      jobs: opportunitiesSeries.jobs[idx],
    });
  };

  const handleFunnelHover = (e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    const rect = (e.currentTarget as HTMLDivElement).closest('.'+styles.funnelContainer)?.getBoundingClientRect()
      || e.currentTarget.getBoundingClientRect();
    setFunnelTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      label: FUNNEL_LABELS[idx],
      value: funnel[idx],
    });
  };

  const DONUT_ITEMS = [
    { label: 'Students', value: talent.students, color: '#3B82F6' },
    { label: 'Fresh Graduates', value: talent.freshGrads, color: '#6EE7B7' },
    { label: 'Working Professionals', value: talent.professionals, color: '#A855F7' },
    { label: 'Open Positions', value: talent.openPositions, color: '#10B981' },
  ];

  const handleDonutHover = (e: React.MouseEvent<HTMLDivElement>, item: typeof DONUT_ITEMS[0]) => {
    const rect = (e.currentTarget as HTMLDivElement).closest('.'+styles.donutLayout)?.getBoundingClientRect()
      || e.currentTarget.getBoundingClientRect();
    setDonutTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      label: item.label,
      value: item.value,
      pct: calcPct(item.value),
    });
  };

  return (
    <div className={styles.chartsRowGrid}>

      {/* 1. Internship & Placement Funnel */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Internship &amp; Placement Funnel</h3>
        <div className={styles.funnelContainer} style={{ position: 'relative' }}>
          <div className={styles.funnelGraphic}>
            {[
              { bg: '#E0E7FF', label: 'Opportunities Created' },
              { bg: '#C7D2FE', label: 'Applications' },
              { bg: '#BFDBFE', label: 'Shortlisted' },
              { bg: '#A7F3D0', label: 'Interviews' },
              { bg: '#6EE7B7', label: 'Offers' },
              { bg: '#FDE047', label: 'Placements', noBorder: true },
            ].map((band, i) => (
              <div
                key={i}
                className={styles.funnelBand}
                style={{ background: band.bg, borderBottom: band.noBorder ? 'none' : undefined, cursor: 'pointer' }}
                onMouseEnter={(e) => handleFunnelHover(e, i)}
                onMouseLeave={() => setFunnelTooltip(t => ({ ...t, visible: false }))}
                onMouseMove={(e) => handleFunnelHover(e, i)}
              >
                {band.label}
              </div>
            ))}
          </div>
          <div className={styles.funnelValues}>
            {funnel.map((val, i) => (
              <span key={i} className={styles.funnelValue}>{val.toLocaleString()}</span>
            ))}
          </div>

          {/* Funnel Tooltip */}
          {funnelTooltip.visible && (
            <div style={{
              position: 'absolute',
              left: funnelTooltip.x + 12,
              top: funnelTooltip.y - 10,
              background: '#1E293B',
              color: '#fff',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              fontFamily: 'Inter, sans-serif',
              pointerEvents: 'none',
              zIndex: 100,
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              whiteSpace: 'nowrap',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{funnelTooltip.label}</div>
              <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Count</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#38BDF8' }}>
                {funnelTooltip.value.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Talent Overview (Donut Chart) */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Talent Overview</h3>
        <div className={styles.donutLayout} style={{ position: 'relative' }}>

          {/* SVG Donut Chart */}
          <div className={styles.donutChartWrapper} style={{ position: 'relative' }}>
            <svg viewBox="0 0 160 160" width="160" height="160">
              {(() => {
                const cx = 80, cy = 80, outerR = 70, innerR = 46;
                const total = DONUT_ITEMS.reduce((s, d) => s + d.value, 0) || 1;
                let startDeg = 0;
                return DONUT_ITEMS.map((item) => {
                  const slice = (item.value / total) * 359.99;
                  const path = getDonutPath(cx, cy, outerR, innerR, startDeg, startDeg + slice);
                  const midDeg = startDeg + slice / 2;
                  startDeg += slice;
                  return (
                    <path
                      key={item.label}
                      d={path}
                      fill={item.color}
                      stroke="#fff"
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as SVGPathElement).style.opacity = '0.82';
                        const svgRect = (e.currentTarget as SVGPathElement).closest('svg')!.getBoundingClientRect();
                        const wrapRect = (e.currentTarget as SVGPathElement).closest('div')!.getBoundingClientRect();
                        setDonutTooltip({
                          visible: true,
                          x: e.clientX - wrapRect.left,
                          y: e.clientY - wrapRect.top,
                          label: item.label,
                          value: item.value,
                          pct: calcPct(item.value),
                        });
                      }}
                      onMouseMove={(e) => {
                        const wrapRect = (e.currentTarget as SVGPathElement).closest('div')!.getBoundingClientRect();
                        setDonutTooltip(t => ({
                          ...t,
                          x: e.clientX - wrapRect.left,
                          y: e.clientY - wrapRect.top,
                        }));
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as SVGPathElement).style.opacity = '1';
                        setDonutTooltip(t => ({ ...t, visible: false }));
                      }}
                    />
                  );
                });
              })()}
              {/* Center hole label */}
              <text x="80" y="75" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0F172A" fontFamily="Inter, sans-serif">
                {talent.total.toLocaleString()}
              </text>
              <text x="80" y="92" textAnchor="middle" fontSize="10" fill="#64748B" fontFamily="Inter, sans-serif">
                Total Talent
              </text>
            </svg>

            {/* SVG Donut Tooltip */}
            {donutTooltip.visible && (
              <div style={{
                position: 'absolute',
                left: donutTooltip.x + 12,
                top: donutTooltip.y - 10,
                background: '#1E293B',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontFamily: 'Inter, sans-serif',
                pointerEvents: 'none',
                zIndex: 100,
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                whiteSpace: 'nowrap',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{donutTooltip.label}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Count • Share</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#38BDF8' }}>
                  {donutTooltip.value.toLocaleString()} <span style={{ color: '#A7F3D0', fontSize: '0.85rem' }}>({donutTooltip.pct}%)</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.donutLegend}>
            {DONUT_ITEMS.map((item) => (
              <div key={item.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: item.color }}></span>
                <div className={styles.legendText}>
                  <span className={styles.legendName}>{item.label}</span>
                  <span className={styles.legendStat}>{item.value.toLocaleString()} ({calcPct(item.value)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Opportunities Overview (Line Chart) */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Opportunities Overview</h3>
        <div className={styles.lineChartLegend}>
          <div className={styles.lineLegendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#3B82F6' }}></span>
            Internship Opportunities
          </div>
          <div className={styles.lineLegendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#10B981' }}></span>
            Job Opportunities
          </div>
        </div>
        <div className={styles.lineChartWrapper} style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 420 220"
            preserveAspectRatio="none"
            onMouseLeave={() => setLineTooltip(t => ({ ...t, visible: false }))}
          >
            {/* Grid lines */}
            <line x1="30" y1="20" x2="400" y2="20" stroke="#F1F5F9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="30" y1="65" x2="400" y2="65" stroke="#F1F5F9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="30" y1="110" x2="400" y2="110" stroke="#F1F5F9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="30" y1="155" x2="400" y2="155" stroke="#F1F5F9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="30" y1="200" x2="400" y2="200" stroke="#F1F5F9" strokeWidth="1" vectorEffect="non-scaling-stroke" />

            {/* Y-axis labels */}
            <text x="0" y="25" fontSize="10" fill="#64748B">{formatYAxis(maxVal)}</text>
            <text x="0" y="70" fontSize="10" fill="#64748B">{formatYAxis(maxVal * 0.75)}</text>
            <text x="0" y="115" fontSize="10" fill="#64748B">{formatYAxis(maxVal * 0.5)}</text>
            <text x="0" y="160" fontSize="10" fill="#64748B">{formatYAxis(maxVal * 0.25)}</text>
            <text x="0" y="205" fontSize="10" fill="#64748B">0</text>

            {/* X-axis labels */}
            {opportunitiesSeries.labels.map((label, i) => (
              <text key={i} x={xCoords[i]} y="218" fontSize="10" fill="#64748B" textAnchor="middle">{label}</text>
            ))}

            {/* Line 1: Internships (Blue) */}
            <polyline points={getPoints(opportunitiesSeries.internships)} fill="none" stroke="#3B82F6" strokeWidth="2" vectorEffect="non-scaling-stroke" />

            {/* Line 2: Jobs (Green) */}
            <polyline points={getPoints(opportunitiesSeries.jobs)} fill="none" stroke="#10B981" strokeWidth="2" vectorEffect="non-scaling-stroke" />

            {/* Internship dots with hover */}
            <g fill="#ffffff" strokeWidth="2" stroke="#3B82F6">
              {opportunitiesSeries.internships.map((val, i) => (
                <circle
                  key={`int-${i}`}
                  cx={xCoords[i]}
                  cy={getY(val)}
                  r="6"
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handleDotHover(e, i)}
                  onMouseMove={(e) => handleDotHover(e, i)}
                  onMouseLeave={() => setLineTooltip(t => ({ ...t, visible: false }))}
                />
              ))}
            </g>

            {/* Job dots with hover */}
            <g fill="#ffffff" strokeWidth="2" stroke="#10B981">
              {opportunitiesSeries.jobs.map((val, i) => (
                <circle
                  key={`job-${i}`}
                  cx={xCoords[i]}
                  cy={getY(val)}
                  r="6"
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handleDotHover(e, i)}
                  onMouseMove={(e) => handleDotHover(e, i)}
                  onMouseLeave={() => setLineTooltip(t => ({ ...t, visible: false }))}
                />
              ))}
            </g>
          </svg>

          {/* Line Chart Tooltip */}
          {lineTooltip.visible && (
            <div style={{
              position: 'absolute',
              left: lineTooltip.x + 14,
              top: lineTooltip.y - 14,
              background: '#1E293B',
              color: '#fff',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.75rem',
              fontFamily: 'Inter, sans-serif',
              pointerEvents: 'none',
              zIndex: 100,
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              whiteSpace: 'nowrap',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: '#E2E8F0' }}>{lineTooltip.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }}></span>
                <span style={{ color: '#94A3B8' }}>Internships:</span>
                <span style={{ fontWeight: 700, color: '#38BDF8' }}>{lineTooltip.internships.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                <span style={{ color: '#94A3B8' }}>Jobs:</span>
                <span style={{ fontWeight: 700, color: '#34D399' }}>{lineTooltip.jobs.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
