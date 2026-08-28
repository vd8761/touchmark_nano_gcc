"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function NewCompanyForm({ 
  partners 
}: { 
  partners: { id: string; name: string }[] 
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [targetStartDate, setTargetStartDate] = useState<Date | null>(null);

  const checkEmail = async (email: string) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return;
    try {
      const res = await fetch(`/api/admin/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.exists) {
        setFieldErrors(prev => ({ ...prev, email: "An account with this email already exists." }));
      } else {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next.email;
          return next;
        });
      }
    } catch (e) {
      // Ignore network errors for background validation
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();

    const errors: Record<string, string> = {};
    if (!name) errors.name = "Legal Company Name is required.";
    if (!email) errors.email = "Contact Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Please enter a valid email address.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      form.append("action", "create-company");
      if (targetStartDate) {
        form.append("targetStartDate", targetStartDate.toISOString().split('T')[0]);
      }
      const res = await fetch("/api/admin/portal", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        setError(data.error ?? "Failed to create corporate.");
        setBusy(false);
        return;
      }

      setSuccess("Corporate partner created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/admin/companies");
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
          <h1 className="adm-h1">Add Corporate</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>Register a new corporate partner and outline their Nano GCC / hiring requirements.</p>
        </div>
        <Link href="/admin/companies" className="adm-btn ghost" style={{ textDecoration: "none", marginTop: "8px" }}>
          &larr; Back to Corporates
        </Link>
      </div>

      <form onSubmit={onSubmit} className="adm-card" noValidate>
        <div className="form-grid">
          {/* Company Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "0 0 16px", gridColumn: "1 / -1" }}>Company Details</h2>
          
          <div className="field-row">
            <div className={`field ${fieldErrors.name ? "error" : ""}`}>
              <label htmlFor="name">Legal Company Name</label>
              <input id="name" name="name" type="text" placeholder="e.g. Acme Corporation Pvt Ltd" required />
              {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="tradingName">Trading / Brand Name</label>
              <input id="tradingName" name="tradingName" type="text" placeholder="e.g. Acme" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="companyType">Company Type</label>
              <select id="companyType" name="companyType" required>
                <option value="Startup">Startup</option>
                <option value="SME">SME</option>
                <option value="Enterprise">Enterprise</option>
                <option value="MNC">MNC</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="industrySector">Industry / Sector</label>
              <input id="industrySector" name="industrySector" type="text" placeholder="e.g. Fintech, Healthcare" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="companyNumber">Business Registration / CIN / EIN Number</label>
              <input id="companyNumber" name="companyNumber" type="text" placeholder="e.g. U72900KA2021PTC..." required />
            </div>
            <div className="field">
              <label htmlFor="yearEstablished">Year Established</label>
              <input id="yearEstablished" name="yearEstablished" type="number" min="1800" max="2100" placeholder="e.g. 2010" />
            </div>
          </div>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="companySize">Company Size (Employee Count)</label>
              <select id="companySize" name="companySize" required>
                <option value="1-50">1–50</option>
                <option value="51-200">51–200</option>
                <option value="201-1000">201–1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="companyTurnover">Company Turnover (Optional)</label>
              <input id="companyTurnover" name="companyTurnover" type="text" placeholder="e.g. $5M - $10M" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="website">Company Website</label>
              <input id="website" name="website" type="url" placeholder="https://..." required />
            </div>
            <div className="field">
              <label htmlFor="linkedinUrl">Company LinkedIn Page</label>
              <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/company/..." />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="country">Country of Incorporation</label>
              <input id="country" name="country" type="text" placeholder="e.g. India" required defaultValue="India" />
            </div>
            <div className="field">
              <label htmlFor="location">City / State</label>
              <input id="location" name="location" type="text" placeholder="e.g. Mumbai, MH" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="registeredAddress">Registered Office Address</label>
            <textarea id="registeredAddress" name="registeredAddress" placeholder="Full address" required rows={2} />
          </div>

          <div className="field">
            <label htmlFor="operatingAddress">Operating / Communication Address</label>
            <textarea id="operatingAddress" name="operatingAddress" placeholder="If different from registered address" rows={2} />
          </div>

          {/* Contact Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Contact Information</h2>

          <div className="field-row">
            <div className="field">
              <label htmlFor="contactPerson">Primary Contact Name (HR/Talent/Innovation)</label>
              <input id="contactPerson" name="contactPerson" type="text" placeholder="e.g. Jane Doe" required />
            </div>
            <div className="field">
              <label htmlFor="designation">Designation / Title</label>
              <input id="designation" name="designation" type="text" placeholder="e.g. Head of Talent" required />
            </div>
          </div>

          <div className="field-row">
            <div className={`field ${fieldErrors.email ? "error" : ""}`}>
              <label htmlFor="email">Business Email Address</label>
              <input 
                id="email" name="email" type="email" placeholder="e.g. jane@acme.com" required 
                onBlur={(e) => checkEmail(e.target.value)}
              />
              {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="phone">Phone Number (with country code)</label>
              <input id="phone" name="phone" type="tel" placeholder="e.g. +91 98765 43210" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="altContactName">Secondary / HR Contact Name</label>
              <input id="altContactName" name="altContactName" type="text" placeholder="e.g. John Smith" />
            </div>
            <div className="field">
              <label htmlFor="altContactEmail">Secondary Contact Email</label>
              <input id="altContactEmail" name="altContactEmail" type="email" placeholder="e.g. hr@acme.com" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="altContactPhone">Secondary Contact Phone</label>
              <input id="altContactPhone" name="altContactPhone" type="tel" placeholder="e.g. +91 98765 43210" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="introducedBy">Introduced / Referred By</label>
            <input id="introducedBy" name="introducedBy" type="text" placeholder="e.g. Ecosystem Partner Name or Event" />
          </div>

          {/* Engagement Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Engagement Requirements</h2>
          
          <div className="field">
            <label htmlFor="engagementTypes">Type(s) of Engagement Interested In</label>
            <input id="engagementTypes" name="engagementTypes" type="text" placeholder="e.g. Internship, Placement, R&D Project, Nano GCC Build-out" required />
          </div>

          <div className="field">
            <label htmlFor="techDomains">Technology Domains / Skills Required</label>
            <input id="techDomains" name="techDomains" type="text" placeholder="e.g. AI/ML, Full-Stack Dev, Data Engineering" required />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="estimatedInterns">Estimated Number of Interns/Employees Required</label>
              <input id="estimatedInterns" name="estimatedInterns" type="number" min="0" placeholder="Per quarter/year" />
            </div>
            <div className="field">
              <label htmlFor="engagementMode">Preferred Engagement Mode</label>
              <select id="engagementMode" name="engagementMode" required>
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="preferredLocation">Preferred Location(s) in India</label>
              <input id="preferredLocation" name="preferredLocation" type="text" placeholder="If onsite/hybrid preferred" />
            </div>
            <div className="field">
              <label htmlFor="targetStartDate">Target Start Date</label>
              <DatePicker 
                id="targetStartDate" 
                name="targetStartDate" 
                selected={targetStartDate} 
                onChange={(date: Date | null) => setTargetStartDate(date)} 
                dateFormat="yyyy-MM-dd"
                placeholderText="yyyy-mm-dd"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="budgetRange">Budget Range (if applicable)</label>
            <input id="budgetRange" name="budgetRange" type="text" placeholder="For paid engagements beyond free internships" />
          </div>
          
          <div className="field">
            <label htmlFor="nanoGccObjective">Nano GCC Objective (Optional)</label>
            <textarea id="nanoGccObjective" name="nanoGccObjective" rows={3} placeholder="e.g. Pilot AI capability, build dedicated team, validate India entry..."></textarea>
          </div>

          {/* Supporting Documents */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Supporting Documents</h2>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="docProfile">Company Profile / Deck</label>
              <input id="docProfile" name="docProfile" type="file" accept=".pdf" required />
            </div>
            <div className="field">
              <label htmlFor="docIncorporation">Certificate of Incorporation</label>
              <input id="docIncorporation" name="docIncorporation" type="file" accept=".pdf" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="docTaxRegistration">Business/Tax Registration Proof</label>
              <input id="docTaxRegistration" name="docTaxRegistration" type="file" accept=".pdf" required />
            </div>
            <div className="field">
              <label htmlFor="docAuthSignatoryId">Authorized Signatory ID</label>
              <input id="docAuthSignatoryId" name="docAuthSignatoryId" type="file" accept=".pdf,.jpg,.png" required />
            </div>
          </div>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="docLogo">Company Logo (High Res)</label>
              <input id="docLogo" name="docLogo" type="file" accept=".png,.svg,.jpg" />
            </div>
            <div className="field">
              <label htmlFor="docPrivacyPolicy">Data Protection / Privacy Policy</label>
              <input id="docPrivacyPolicy" name="docPrivacyPolicy" type="file" accept=".pdf" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="documents">Other Documents (Signed MoU / Engagement Agreement)</label>
            <input id="documents" name="documents" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" />
            <span className="field-hint" style={{ fontSize: "0.8rem", color: "var(--sub)", marginTop: "4px", display: "block" }}>Max 10MB per file.</span>
          </div>

          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Ecosystem Partner & Terms</h2>

          <div className="field">
            <label htmlFor="ecosystemPartnerId">Ecosystem Partner (Optional)</label>
            <select id="ecosystemPartnerId" name="ecosystemPartnerId">
              <option value="">-- None (Direct Registration) --</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="commissionType">Commission Type</label>
              <select id="commissionType" name="commissionType">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (₹)</option>
              </select>
            </div>
            
            <div className="field">
              <label htmlFor="commissionValue">Value</label>
              <input id="commissionValue" name="commissionValue" type="number" step="0.01" min="0" placeholder="0" required defaultValue="0" />
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ marginTop: "24px", color: "var(--critical)", background: "var(--critical-bg)", padding: "16px", borderRadius: "8px", border: "1px solid var(--critical-border)" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="success-banner" style={{ marginTop: "24px", color: "var(--proven)", background: "var(--proven-bg)", padding: "16px", borderRadius: "8px", border: "1px solid var(--proven-border)" }}>
            {success}
          </div>
        )}
        <div className="acts" style={{ marginTop: "32px" }}>
          <button className="act primary" type="submit" disabled={busy || !!success}>
            {busy ? (
              <>
                <span className="spin" aria-hidden="true" /> Creating...
              </>
            ) : (
              "Create Corporate"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
