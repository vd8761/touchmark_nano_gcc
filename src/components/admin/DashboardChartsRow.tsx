import React from 'react';
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

export function DashboardChartsRow({ metrics }: DashboardChartsRowProps) {
  // Use metrics if provided, else fallback to mock data
  const funnel = metrics?.funnel || [0, 0, 0, 0, 0, 0];
  const talent = metrics?.talent || {
    students: 0,
    freshGrads: 0,
    professionals: 0,
    openPositions: 0,
    total: 0
  };

  const opportunitiesSeries = metrics?.opportunitiesSeries || {
    labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    internships: [0, 0, 0, 0, 0, 0],
    jobs: [0, 0, 0, 0, 0, 0]
  };

  // Calculate dynamic SVG coordinates for line chart
  const xCoords = [50, 110, 170, 230, 290, 350];
  const allVals = [...opportunitiesSeries.internships, ...opportunitiesSeries.jobs];
  const maxVal = Math.max(...allVals, 100); // minimum scale of 100
  const yMin = 200; // Bottom of chart (y coord for 0)
  const yMax = 20;  // Top of chart (y coord for maxVal)
  
  const getY = (val: number) => {
    return yMin - ((val / maxVal) * (yMin - yMax));
  };

  const getPoints = (data: number[]) => {
    return data.map((val, i) => `${xCoords[i]},${getY(val)}`).join(' ');
  };

  const formatYAxis = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val;
  };

  const calcPct = (val: number) => {
    if (!talent.total) return 0;
    return Math.round((val / talent.total) * 100);
  };

  return (
    <div className={styles.chartsRowGrid}>
      
      {/* 1. Internship & Placement Funnel */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Internship & Placement Funnel</h3>
        <div className={styles.funnelContainer}>
          <div className={styles.funnelGraphic}>
            <div className={styles.funnelBand} style={{ background: '#E0E7FF' }}>Opportunities Created</div>
            <div className={styles.funnelBand} style={{ background: '#C7D2FE' }}>Applications</div>
            <div className={styles.funnelBand} style={{ background: '#BFDBFE' }}>Shortlisted</div>
            <div className={styles.funnelBand} style={{ background: '#A7F3D0' }}>Interviews</div>
            <div className={styles.funnelBand} style={{ background: '#6EE7B7' }}>Offers</div>
            <div className={styles.funnelBand} style={{ background: '#FDE047', borderBottom: 'none' }}>Placements</div>
          </div>
          <div className={styles.funnelValues}>
            {funnel.map((val, i) => (
              <span key={i} className={styles.funnelValue}>{val.toLocaleString()}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Talent Overview (Donut Chart) */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>Talent Overview</h3>
        <div className={styles.donutLayout}>
          <div className={styles.donutChartWrapper}>
            <div className={styles.donutChart} style={{
              background: 'conic-gradient(#3B82F6 0% 59%, #A855F7 59% 66%, #10B981 66% 83%, #6EE7B7 83% 100%)'
            }}>
              <div className={styles.donutHole}>
                <span className={styles.donutTotal}>{talent.total.toLocaleString()}</span>
                <span className={styles.donutLabel}>Total Talent</span>
              </div>
            </div>
          </div>
          <div className={styles.donutLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#3B82F6' }}></span>
              <div className={styles.legendText}>
                <span className={styles.legendName}>Students</span>
                <span className={styles.legendStat}>{talent.students.toLocaleString()} ({calcPct(talent.students)}%)</span>
              </div>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#6EE7B7' }}></span>
              <div className={styles.legendText}>
                <span className={styles.legendName}>Fresh Graduates</span>
                <span className={styles.legendStat}>{talent.freshGrads.toLocaleString()} ({calcPct(talent.freshGrads)}%)</span>
              </div>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#A855F7' }}></span>
              <div className={styles.legendText}>
                <span className={styles.legendName}>Working Professionals</span>
                <span className={styles.legendStat}>{talent.professionals.toLocaleString()} ({calcPct(talent.professionals)}%)</span>
              </div>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#10B981' }}></span>
              <div className={styles.legendText}>
                <span className={styles.legendName}>Open Positions</span>
                <span className={styles.legendStat}>{talent.openPositions.toLocaleString()} ({calcPct(talent.openPositions)}%)</span>
              </div>
            </div>
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
        <div className={styles.lineChartWrapper}>
          {/* Mock SVG Line Chart with improved spacing */}
          <svg width="100%" height="100%" viewBox="0 0 420 220" preserveAspectRatio="none">
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
            
            {/* Custom SVG dots to avoid preserveAspectRatio distortion */}
            <g fill="#ffffff" strokeWidth="2" stroke="#3B82F6">
               {opportunitiesSeries.internships.map((val, i) => (
                 <circle key={`int-${i}`} cx={xCoords[i]} cy={getY(val)} r="4" vectorEffect="non-scaling-stroke">
                   <title>{opportunitiesSeries.labels[i]}: {val} Internship Opportunities</title>
                 </circle>
               ))}
            </g>

            <g fill="#ffffff" strokeWidth="2" stroke="#10B981">
               {opportunitiesSeries.jobs.map((val, i) => (
                 <circle key={`job-${i}`} cx={xCoords[i]} cy={getY(val)} r="4" vectorEffect="non-scaling-stroke">
                   <title>{opportunitiesSeries.labels[i]}: {val} Job Opportunities</title>
                 </circle>
               ))}
            </g>
          </svg>
        </div>
      </div>

    </div>
  );
}
