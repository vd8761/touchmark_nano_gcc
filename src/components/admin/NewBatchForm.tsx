"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function NewBatchForm({
  companies,
  colleges
}: {
  companies: { id: string; name: string }[];
  colleges: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const form = new FormData(e.currentTarget);
    const batchName = String(form.get("batchName") ?? "").trim();
    const companyId = String(form.get("companyId") ?? "").trim();

    const errors: Record<string, string> = {};
    if (!batchName) errors.batchName = "Batch Name is required.";
    if (!companyId) errors.companyId = "Company is required.";
    if (!startDate) errors.startDate = "Start Date is required.";
    if (!endDate) errors.endDate = "End Date is required.";
    if (startDate && endDate && startDate > endDate) {
      errors.endDate = "End Date must be after Start Date.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      form.append("action", "create-batch");
      form.append("startDate", startDate!.toISOString().split('T')[0]);
      form.append("endDate", endDate!.toISOString().split('T')[0]);
      
      const res = await fetch("/api/admin/portal", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        setError(data.error ?? "Failed to create batch.");
        setBusy(false);
        return;
      }

      setSuccess("Internship batch created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/admin/dashboard");
        router.refresh();
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="adm-form">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="adm-h1">Add New Batch</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>Create a new internship batch.</p>
        </div>
        <Link href="/admin/dashboard" className="adm-btn ghost" style={{ textDecoration: "none", marginTop: "8px" }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <form onSubmit={onSubmit} className="adm-card" noValidate>
        <div className="form-grid">
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "0 0 16px", gridColumn: "1 / -1" }}>Batch Details</h2>
          
          <div className="field-row">
            <div className={`field ${fieldErrors.batchName ? "error" : ""}`}>
              <label htmlFor="batchName">Batch Name</label>
              <input id="batchName" name="batchName" type="text" placeholder="e.g. Summer 2025 Internship" required />
              {fieldErrors.batchName && <span className="field-error-text">{fieldErrors.batchName}</span>}
            </div>
            <div className={`field ${fieldErrors.companyId ? "error" : ""}`}>
              <label htmlFor="companyId">Company</label>
              <select id="companyId" name="companyId" required>
                <option value="">Select Company...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {fieldErrors.companyId && <span className="field-error-text">{fieldErrors.companyId}</span>}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="collegeId">Institution (Optional)</label>
              <select id="collegeId" name="collegeId">
                <option value="">None / Open to all</option>
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Initial Status</label>
              <select id="status" name="status">
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className={`field ${fieldErrors.startDate ? "error" : ""}`}>
              <label>Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
                className="date-picker-input"
              />
              {fieldErrors.startDate && <span className="field-error-text">{fieldErrors.startDate}</span>}
            </div>
            <div className={`field ${fieldErrors.endDate ? "error" : ""}`}>
              <label>End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
                className="date-picker-input"
                minDate={startDate || undefined}
              />
              {fieldErrors.endDate && <span className="field-error-text">{fieldErrors.endDate}</span>}
            </div>
          </div>

        </div>

        {error && <div className="adm-alert error" style={{ marginTop: 24 }}>{error}</div>}
        {success && <div className="adm-alert success" style={{ marginTop: 24 }}>{success}</div>}

        <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="adm-btn primary" disabled={busy}>
            {busy ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}
