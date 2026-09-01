"use client";

import React, { useState } from "react";
import { Eye, Plus, MoreVertical } from "lucide-react";
import styles from "../../app/admin/dashboard/dashboard.module.css";

interface MasterTablesProps {
  batches: any[];
  enquiries: any[];
}

export function MasterTables({ batches = [], enquiries = [] }: MasterTablesProps) {
  
  // Fill with dummy data for demo if empty
  const displayBatches = batches.length > 0 ? batches : Array.from({ length: 5 }).map((_, i) => ({
    id: `BATCH-${128 - i}`,
    company: i === 0 ? 'Infosys' : i === 1 ? 'TCS' : i === 2 ? 'Wipro' : i === 3 ? 'Tech Mahindra' : 'Zoho',
    name: i === 0 ? 'Infosys Spring 2025' : i === 1 ? 'TCS Digital Batch 2' : i === 2 ? 'Wipro Talent Next' : i === 3 ? 'TM Business Batch' : 'Zoho Intern Program',
    start: '01 Mar 2025',
    end: '31 May 2025',
    status: i < 2 ? 'Active' : i < 4 ? 'Completed' : 'Upcoming',
    progress: i < 2 ? 65 : i < 4 ? 100 : 0
  }));

  const displayEnquiries = enquiries.length > 0 ? enquiries : Array.from({ length: 5 }).map((_, i) => ({
    id: `INST-${1028 - i}`,
    type: i > 2 ? 'Corporate' : 'Institution',
    name: i === 0 ? 'Indian Institute of Tech' : i === 1 ? 'University of Colombo' : i === 2 ? 'XYZ Technologies' : 'ABC Solutions',
    country: i === 1 ? 'Sri Lanka' : i === 3 ? 'UAE' : 'India',
    req: 'Skilling Program',
    date: '25 May 2025',
    status: i === 0 ? 'Discussion' : i === 1 ? 'Proposal' : i === 2 ? 'Contacted' : 'New'
  }));

  const [activeTab, setActiveTab] = useState('batches');

  return (
    <div className={styles.dashboardContainer} style={{ marginTop: "24px" }}>
      
      {/* Batches Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTabs}>
             <button 
               onClick={() => setActiveTab('batches')}
               className={`${styles.tableTab} ${activeTab === 'batches' ? styles.active : ''}`}
             >
               All Batches
             </button>
             <button className={styles.tableTab}>Active Batches</button>
             <button className={styles.tableTab}>Upcoming Batches</button>
             <button className={styles.tableTab}>Completed Batches</button>
          </div>
          <button className={`${styles.iconBtn} ${styles.iconBtnPrimary}`} style={{ width: "auto", padding: "0 16px", fontSize: "0.8rem", fontWeight: 600 }}>
            <Plus size={16} style={{ marginRight: "6px" }} /> New Batch
          </button>
        </div>
        
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Company</th>
                <th>Batch Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th style={{ textAlign: "center" }}>Students</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th>Progress</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayBatches.map((batch: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{batch.id || `BATCH-${128 - i}`}</td>
                  <td>{batch.company_name || batch.company}</td>
                  <td>{batch.batch_name || batch.name}</td>
                  <td>{batch.start_date ? new Date(batch.start_date).toISOString().split('T')[0] : batch.start}</td>
                  <td>{batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : batch.end}</td>
                  <td style={{ textAlign: "center", fontWeight: 500 }}>{batch.students || (20 + (i * 15) % 50)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles.statusPill} ${
                      (batch.status || 'Active').toLowerCase() === 'active' ? styles.statusActive :
                      (batch.status || 'Completed').toLowerCase() === 'completed' ? styles.statusCompleted :
                      styles.statusUpcoming
                    }`}>
                      {batch.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "60px", height: "6px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "#3B82F6", width: `${batch.progress || 65}%` }}></div>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{batch.progress || 65}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "0 4px" }}><Eye size={16} /></button>
                    <button style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "0 4px" }}><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTabs}>
             <button className={`${styles.tableTab} ${styles.active}`}>Institution Enquiries</button>
             <button className={styles.tableTab}>Corporate Enquiries</button>
          </div>
          <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontWeight: 500, color: "#64748B", background: "#F8FAFC", padding: "8px 16px", borderRadius: "8px" }}>
             <span>New <strong style={{ color: "#0F172A" }}>28</strong></span>
             <span>Contacted <strong style={{ color: "#0F172A" }}>22</strong></span>
             <span>Discussion <strong style={{ color: "#0F172A" }}>18</strong></span>
             <span>Proposal <strong style={{ color: "#0F172A" }}>12</strong></span>
             <span>Negotiation <strong style={{ color: "#0F172A" }}>7</strong></span>
             <span>Won <strong style={{ color: "#0F172A" }}>5</strong></span>
             <span>Lost <strong style={{ color: "#0F172A" }}>3</strong></span>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Enquiry ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Country</th>
                <th>Requirement</th>
                <th>Enquiry Date</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayEnquiries.map((enq: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{enq.id || `ENQ-${1028 - i}`}</td>
                  <td>{enq.type || 'Institution'}</td>
                  <td style={{ fontWeight: 500 }}>{enq.name || enq.institution_name}</td>
                  <td>{enq.country || 'India'}</td>
                  <td>{enq.requirement || enq.req}</td>
                  <td>{enq.created_at ? new Date(enq.created_at).toLocaleDateString() : enq.date}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles.statusPill} ${
                      (enq.status || 'New').toLowerCase() === 'new' ? styles.statusNew :
                      (enq.status || 'Contacted').toLowerCase() === 'contacted' ? styles.statusContacted :
                      styles.statusCompleted
                    }`}>
                      {enq.status || 'New'}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "0 4px" }}><Eye size={16} /></button>
                    <button style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "0 4px" }}><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
