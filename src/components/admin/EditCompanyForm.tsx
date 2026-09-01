"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";

export default function EditCompanyForm({ 
  company,
  partners 
}: { 
  company: any;
  partners: { id: string; name: string }[] 
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const initialDate = company.contact_details?.targetStartDate 
    ? new Date(company.contact_details.targetStartDate) 
    : null;
  const [targetStartDate, setTargetStartDate] = useState<Date | null>(initialDate);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();

    const errors: Record<string, string> = {};
    if (!name) errors.name = "Legal Company Name is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    setFieldErrors({});

    try {
      if (targetStartDate) {
        form.append("targetStartDate", targetStartDate.toISOString().split('T')[0]);
      }
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PUT",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        toast.error(data.error ?? "Failed to update corporate.");
        setBusy(false);
        return;
      }

      toast.success("Corporate partner updated successfully!");
      setTimeout(() => {
        router.push("/admin/companies");
        router.refresh();
      }, 1000);
    } catch {
      toast.error("Network error. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="adm-form">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="adm-h1">Edit Corporate</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>Update details for {company.name}</p>
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
              <input id="name" name="name" type="text" placeholder="e.g. Acme Corporation Pvt Ltd" defaultValue={company.name} required />
              {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="tradingName">Trading / Brand Name</label>
              <input id="tradingName" name="tradingName" type="text" placeholder="e.g. Acme" defaultValue={company.contact_details?.tradingName} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="companyType">Company Type</label>
              <select id="companyType" name="companyType" defaultValue={company.contact_details?.companyType} required>
                <option value="Startup">Startup</option>
                <option value="SME">SME</option>
                <option value="Enterprise">Enterprise</option>
                <option value="MNC">MNC</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="industrySector">Industry / Sector</label>
              <input id="industrySector" name="industrySector" type="text" placeholder="e.g. Fintech, Healthcare" defaultValue={company.contact_details?.industrySector} required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="companyNumber">Business Registration / CIN / EIN Number</label>
              <input id="companyNumber" name="companyNumber" type="text" placeholder="e.g. U72900KA2021PTC..." defaultValue={company.contact_details?.companyNumber} required />
            </div>
            <div className="field">
              <label htmlFor="yearEstablished">Year Established</label>
              <input id="yearEstablished" name="yearEstablished" type="number" min="1800" max="2100" placeholder="e.g. 2010" defaultValue={company.contact_details?.yearEstablished} />
            </div>
          </div>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="companySize">Company Size (Employee Count)</label>
              <select id="companySize" name="companySize" defaultValue={company.contact_details?.companySize} required>
                <option value="1-50">1–50</option>
                <option value="51-200">51–200</option>
                <option value="201-1000">201–1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="country">Country of Incorporation</label>
              <select id="country" name="country" defaultValue={company.contact_details?.country || "IN"} required>
                <option value="IN">India</option>
                <option value="LK">Sri Lanka</option>
                <option value="AE">UAE</option>
                <option value="SG">Singapore</option>
                <option value="US">USA</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="turnoverCurrent">Turnover (Current) in millions</label>
              <input id="turnoverCurrent" name="turnoverCurrent" type="number" step="0.01" min="0" placeholder="e.g. 236.8" defaultValue={company.turnover_current} />
            </div>
            <div className="field">
              <label htmlFor="turnoverProjected">Turnover (Projected) in millions</label>
              <input id="turnoverProjected" name="turnoverProjected" type="number" step="0.01" min="0" placeholder="e.g. 612.7" defaultValue={company.turnover_projected} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="website">Company Website</label>
              <input id="website" name="website" type="url" placeholder="https://..." defaultValue={company.contact_details?.website} required />
            </div>
            <div className="field">
              <label htmlFor="linkedinUrl">Company LinkedIn Page</label>
              <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/company/..." defaultValue={company.contact_details?.linkedinUrl} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="location">City / State</label>
            <input id="location" name="location" type="text" placeholder="e.g. Mumbai, MH" defaultValue={company.contact_details?.location} required />
          </div>

          <div className="field">
            <label htmlFor="registeredAddress">Registered Office Address</label>
            <textarea id="registeredAddress" name="registeredAddress" placeholder="Full address" defaultValue={company.contact_details?.registeredAddress} required rows={2} />
          </div>

          <div className="field">
            <label htmlFor="operatingAddress">Operating / Communication Address</label>
            <textarea id="operatingAddress" name="operatingAddress" placeholder="If different from registered address" defaultValue={company.contact_details?.operatingAddress} rows={2} />
          </div>

          {/* Contact Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Contact Information</h2>

          <div className="field-row">
            <div className="field">
              <label htmlFor="contactPerson">Primary Contact Name (HR/Talent/Innovation)</label>
              <input id="contactPerson" name="contactPerson" type="text" placeholder="e.g. Jane Doe" defaultValue={company.contact_details?.contactPerson} required />
            </div>
            <div className="field">
              <label htmlFor="designation">Designation / Title</label>
              <input id="designation" name="designation" type="text" placeholder="e.g. Head of Talent" defaultValue={company.contact_details?.designation} required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="phone">Phone Number (with country code)</label>
              <input id="phone" name="phone" type="tel" placeholder="e.g. +91 98765 43210" defaultValue={company.contact_details?.phone} required />
            </div>
            <div className="field">
              <label htmlFor="altContactName">Secondary / HR Contact Name</label>
              <input id="altContactName" name="altContactName" type="text" placeholder="e.g. John Smith" defaultValue={company.contact_details?.altContactName} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="altContactEmail">Secondary Contact Email</label>
              <input id="altContactEmail" name="altContactEmail" type="email" placeholder="e.g. hr@acme.com" defaultValue={company.contact_details?.altContactEmail} />
            </div>
            <div className="field">
              <label htmlFor="altContactPhone">Secondary Contact Phone</label>
              <input id="altContactPhone" name="altContactPhone" type="tel" placeholder="e.g. +91 98765 43210" defaultValue={company.contact_details?.altContactPhone} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="introducedBy">Introduced / Referred By</label>
            <input id="introducedBy" name="introducedBy" type="text" placeholder="e.g. Ecosystem Partner Name or Event" defaultValue={company.contact_details?.introducedBy} />
          </div>

          {/* Engagement Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Engagement Requirements</h2>
          
          <div className="field">
            <label htmlFor="engagementTypes">Type(s) of Engagement Interested In</label>
            <input id="engagementTypes" name="engagementTypes" type="text" placeholder="e.g. Internship, Placement, R&D Project, Nano GCC Build-out" defaultValue={company.contact_details?.engagementTypes} required />
          </div>

          <div className="field">
            <label htmlFor="techDomains">Technology Domains / Skills Required</label>
            <input id="techDomains" name="techDomains" type="text" placeholder="e.g. AI/ML, Full-Stack Dev, Data Engineering" defaultValue={company.contact_details?.techDomains} required />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="estimatedInterns">Estimated Number of Interns/Employees Required</label>
              <input id="estimatedInterns" name="estimatedInterns" type="number" min="0" placeholder="Per quarter/year" defaultValue={company.contact_details?.estimatedInterns} />
            </div>
            <div className="field">
              <label htmlFor="engagementMode">Preferred Engagement Mode</label>
              <select id="engagementMode" name="engagementMode" defaultValue={company.contact_details?.engagementMode} required>
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="preferredLocation">Preferred Location(s) in India</label>
              <input id="preferredLocation" name="preferredLocation" type="text" placeholder="If onsite/hybrid preferred" defaultValue={company.contact_details?.preferredLocation} />
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

          <div className="field-row">
            <div className="field">
              <label htmlFor="budgetRange">Budget Range (Stipend/Salary)</label>
              <input id="budgetRange" name="budgetRange" type="text" placeholder="For paid engagements beyond free internships" defaultValue={company.contact_details?.budgetRange} />
            </div>
            <div className="field">
              <label htmlFor="ecosystemPartnerId">Mapped to Ecosystem Partner</label>
              <select id="ecosystemPartnerId" name="ecosystemPartnerId" defaultValue={company.ecosystem_partner_id || ""}>
                <option value="">-- Direct (No Partner) --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="nanoGccObjective">Key Objective for Nano GCC / Hiring</label>
            <textarea id="nanoGccObjective" name="nanoGccObjective" placeholder="e.g. Pilot AI capability, build dedicated team, validate India entry..." defaultValue={company.contact_details?.nanoGccObjective} rows={3} required />
          </div>
          
          <div className="field">
            <label htmlFor="additionalInfo">Additional Information / Special Requirements</label>
            <textarea id="additionalInfo" name="additionalInfo" defaultValue={company.contact_details?.additionalInfo} rows={2} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="commissionType">Commission Type</label>
              <select id="commissionType" name="commissionType" defaultValue={company.commission_type} required>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="commissionValue">Commission Value</label>
              <input id="commissionValue" name="commissionValue" type="number" step="0.01" min="0" placeholder="0" defaultValue={company.commission_value} required />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "flex-end", gap: 16 }}>
          <button type="submit" className="adm-btn primary" disabled={busy}>
            {busy ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
