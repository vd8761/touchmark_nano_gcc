"use client";

import React, { useState } from 'react';
import styles from '@/app/admin/dashboard/dashboard.module.css';
import { Eye, MoreVertical, Plus } from 'lucide-react';
import Link from 'next/link';

import type { TableMetrics } from '@/lib/dashboard-metrics';

interface DashboardBottomTablesProps {
  metrics?: TableMetrics;
}

export default function DashboardBottomTables({ metrics }: DashboardBottomTablesProps) {
  const BATCH_DATA = metrics?.batches?.length ? metrics.batches.map((b, i) => ({
    id: `BATCH-${100+i}`,
    company: b.company,
    name: b.name,
    start: b.startDate,
    end: b.endDate,
    students: b.talentCount,
    status: b.status,
    progress: (70 + (i * 7) % 30) // Deterministic mock value between 70-99
  })) : [];

  const ENQUIRY_DATA = metrics?.jobs?.length ? metrics.jobs.map((j, i) => ({
    id: `ENQ-${1000+i}`,
    type: j.kind === 'institution' ? 'Institution' : 'Corporate',
    name: j.company,
    country: 'Global',
    req: j.title,
    date: new Date().toLocaleDateString(),
    status: j.status
  })) : [];

  const [activeBatchTab, setActiveBatchTab] = useState('All Batches');
  const [activeEnquiryTab, setActiveEnquiryTab] = useState('Institution Enquiries');

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Active': return { bg: '#DCFCE7', color: '#16A34A' };
      case 'Completed': return { bg: '#D1FAE5', color: '#059669' };
      case 'Upcoming': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'Discussion': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'Proposal': return { bg: '#E0E7FF', color: '#4F46E5' };
      case 'Contacted': return { bg: '#DCFCE7', color: '#16A34A' };
      case 'New': return { bg: '#F1F5F9', color: '#475569' };
      default: return { bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <div className={styles.bottomTablesContainer}>
      
      {/* 4. INTERNSHIP BATCH MANAGEMENT */}
      <div className={styles.bottomCard}>
        <h3 className={styles.bottomCardTitle}>INTERNSHIP BATCH MANAGEMENT</h3>
        
        <div className={styles.bottomCardHeader}>
          <div className={styles.bottomTabs}>
            {['All Batches', 'Active Batches', 'Upcoming Batches', 'Completed Batches'].map(tab => (
              <button 
                key={tab} 
                className={`${styles.bottomTab} ${activeBatchTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveBatchTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <Link href="/admin/batches/new" className={styles.primaryActionBtn} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            New Batch
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Company</th>
                <th>Batch Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Students</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {BATCH_DATA.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                    No batch records found
                  </td>
                </tr>
              ) : (
                BATCH_DATA.map((row, i) => (
                  <tr key={i}>
                    <td className={styles.fw500}>{row.id}</td>
                    <td>{row.company}</td>
                    <td>{row.name}</td>
                    <td>{row.start}</td>
                    <td>{row.end}</td>
                    <td>{row.students}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ backgroundColor: getStatusStyle(row.status).bg, color: getStatusStyle(row.status).color }}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.progressCell}>
                        <div className={styles.progressBarBg}>
                          <div className={styles.progressBarFill} style={{ width: `${row.progress}%`, backgroundColor: getStatusStyle(row.status).color }}></div>
                        </div>
                        <span className={styles.progressText}>{row.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.iconBtn}><Eye size={16} /></button>
                        <button className={styles.iconBtn}><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. A-REINVENTION ENQUIRY TRACKING */}
      <div className={styles.bottomCard}>
        <h3 className={styles.bottomCardTitle}>A-REINVENTION ENQUIRY TRACKING</h3>
        
        <div className={styles.bottomCardHeader}>
          <div className={styles.bottomTabs}>
            {['Institution Enquiries', 'Corporate Enquiries'].map(tab => (
              <button 
                key={tab} 
                className={`${styles.bottomTab} ${activeEnquiryTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveEnquiryTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.pipelineFunnel}>
          {[
            { label: 'New', count: 0 },
            { label: 'Contacted', count: 0 },
            { label: 'Discussion', count: 0 },
            { label: 'Proposal', count: 0 },
            { label: 'Negotiation', count: 0 },
            { label: 'Won', count: 0 },
            { label: 'Lost', count: 0 },
          ].map((step, index) => (
            <div key={index} className={styles.pipelineStep}>
              <span className={styles.stepLabel}>{step.label}</span>
              <span className={styles.stepCount}>{step.count}</span>
            </div>
          ))}
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Enquiry ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Country</th>
                <th>Requirement</th>
                <th>Enquiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ENQUIRY_DATA.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                    No enquiry records found
                  </td>
                </tr>
              ) : (
                ENQUIRY_DATA.map((row, i) => (
                  <tr key={i}>
                    <td className={styles.fw500}>{row.id}</td>
                    <td>{row.type}</td>
                    <td>{row.name}</td>
                    <td>{row.country}</td>
                    <td>{row.req}</td>
                    <td>{row.date}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ backgroundColor: getStatusStyle(row.status).bg, color: getStatusStyle(row.status).color }}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.iconBtn}><Eye size={16} /></button>
                        <button className={styles.iconBtn}><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
