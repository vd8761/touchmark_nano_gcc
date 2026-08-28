"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function NewInstitutionForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() + 1);
  const [validUntil, setValidUntil] = useState<Date | null>(defaultDate);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const form = new FormData(e.currentTarget);
    const institution = String(form.get("institution") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();

    const errors: Record<string, string> = {};
    if (!institution) errors.institution = "Institution Name is required.";
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
      form.append("action", "create-manual-membership");

      const res = await fetch("/api/admin/memberships", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        setError(data.error ?? "Failed to create institution.");
        setBusy(false);
        return;
      }

      setSuccess("Institution successfully created!");
      setTimeout(() => {
        router.push("/admin/memberships");
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
          <h1 className="adm-h1">Add Institution (Manual)</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>Register a new academic partner and track their programs.</p>
        </div>
        <Link href="/admin/memberships" className="adm-btn ghost" style={{ textDecoration: "none", marginTop: "8px" }}>
          &larr; Back to Institutions
        </Link>
      </div>

      <form onSubmit={onSubmit} className="adm-card" noValidate>


        <div className="form-grid">
          {/* General Information */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "0 0 16px", gridColumn: "1 / -1" }}>General Information</h2>
          
          <div className="field-row">
            <div className={`field ${fieldErrors.institution ? "error" : ""}`}>
              <label htmlFor="institution">Institution Name</label>
              <input id="institution" name="institution" type="text" placeholder="e.g. University of Example" required />
              {fieldErrors.institution && <span className="field-error-text">{fieldErrors.institution}</span>}
            </div>
            <div className="field">
              <label htmlFor="institutionType">Institution Type</label>
              <select id="institutionType" name="institutionType" required>
                <option value="University">University</option>
                <option value="College">College</option>
                <option value="Autonomous Institute">Autonomous Institute</option>
                <option value="Training Institute">Training Institute</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="affiliatingUniversity">Affiliating University (if applicable)</label>
              <input id="affiliatingUniversity" name="affiliatingUniversity" type="text" placeholder="e.g. State Tech University" />
            </div>
            <div className="field">
              <label htmlFor="accreditation">Accreditation / Recognition</label>
              <input id="accreditation" name="accreditation" type="text" placeholder="e.g. NAAC, NBA, UGC" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="country">Country</label>
              <input id="country" name="country" type="text" placeholder="e.g. India" required defaultValue="India" />
            </div>
            <div className="field">
              <label htmlFor="state">State / Province</label>
              <input id="state" name="state" type="text" placeholder="e.g. Tamil Nadu" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="campusAddress">Campus Address</label>
            <textarea id="campusAddress" name="campusAddress" placeholder="Full address" required rows={2} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="website">Institution Website</label>
              <input id="website" name="website" type="url" placeholder="https://..." required />
            </div>
            <div className="field">
              <label htmlFor="yearEstablished">Year Established</label>
              <input id="yearEstablished" name="yearEstablished" type="number" min="1800" max="2100" placeholder="e.g. 1995" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="studentStrength">Total Student Strength</label>
            <input id="studentStrength" name="studentStrength" type="number" placeholder="e.g. 5000" />
          </div>

          {/* Contact Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Contact Information</h2>

          <div className="field-row">
            <div className="field">
              <label htmlFor="name">Primary Coordinator Name</label>
              <input id="name" name="name" type="text" placeholder="e.g. Dr. John Smith" required />
            </div>
            <div className="field">
              <label htmlFor="designation">Designation / Title</label>
              <input id="designation" name="designation" type="text" placeholder="e.g. Placement Officer" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="department">Department</label>
              <input id="department" name="department" type="text" placeholder="e.g. Computer Science" />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone Number (with country code)</label>
              <input id="phone" name="phone" type="tel" placeholder="e.g. +91 98765 43210" required />
            </div>
          </div>

          <div className={`field ${fieldErrors.email ? "error" : ""}`}>
            <label htmlFor="email">Business Email Address</label>
            <input id="email" name="email" type="email" placeholder="e.g. placement@university.edu" required />
            {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="facultyCoordinatorName">Faculty Coordinator Name (R&D Liaison)</label>
              <input id="facultyCoordinatorName" name="facultyCoordinatorName" type="text" placeholder="e.g. Prof. Jane Doe" />
            </div>
            <div className="field">
              <label htmlFor="facultyCoordinatorEmail">Faculty Email</label>
              <input id="facultyCoordinatorEmail" name="facultyCoordinatorEmail" type="email" placeholder="jane@..." />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="facultyCoordinatorPhone">Faculty Phone</label>
              <input id="facultyCoordinatorPhone" name="facultyCoordinatorPhone" type="tel" placeholder="+91..." />
            </div>
          </div>

          {/* Academic & Research Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Academic & Research Details</h2>
          
          <div className="field">
            <label htmlFor="programsOffered">Departments / Programs Offered</label>
            <textarea id="programsOffered" name="programsOffered" placeholder="e.g. B.Tech CS, M.Tech Data Science..." required rows={2} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="keyTechDepartments">Relevant Technology Programs</label>
              <input id="keyTechDepartments" name="keyTechDepartments" type="text" placeholder="e.g. AI/ML, Data Science, Electronics" required />
            </div>
            <div className="field">
              <label htmlFor="eligibleStudents">Number of Eligible Students per Batch</label>
              <input id="eligibleStudents" name="eligibleStudents" type="number" placeholder="For internships/placements" />
            </div>
          </div>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="academicCalendar">Academic Calendar</label>
              <input id="academicCalendar" name="academicCalendar" type="text" placeholder="e.g. Aug-Dec, Jan-May" />
            </div>
            <div className="field">
              <label htmlFor="facultyStrength">Faculty Strength in Relevant Depts</label>
              <input id="facultyStrength" name="facultyStrength" type="number" placeholder="e.g. 150" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="rdLabs">Research Labs / Infrastructure Available</label>
            <textarea id="rdLabs" name="rdLabs" rows={2} placeholder="Describe existing labs or facilities..."></textarea>
          </div>

          <div className="field">
            <label htmlFor="researchStrengths">Areas of Research Strength / Interest</label>
            <textarea id="researchStrengths" name="researchStrengths" rows={2} placeholder="e.g. Robotics, NLP, Renewable Energy"></textarea>
          </div>

          <div className="field">
            <label htmlFor="industryPartnerships">Existing Industry Partnerships</label>
            <textarea id="industryPartnerships" name="industryPartnerships" rows={2} placeholder="Names of companies or nature of tie-ups"></textarea>
          </div>

          {/* Supporting Documents */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Supporting Documents</h2>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="docProfile">Institution Profile / Brochure</label>
              <input id="docProfile" name="docProfile" type="file" accept=".pdf" required />
            </div>
            <div className="field">
              <label htmlFor="docAffiliation">Affiliation / Recognition Certificate</label>
              <input id="docAffiliation" name="docAffiliation" type="file" accept=".pdf" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="docAccreditation">Accreditation Certificate</label>
              <input id="docAccreditation" name="docAccreditation" type="file" accept=".pdf" />
            </div>
            <div className="field">
              <label htmlFor="docAuthSignatoryId">Authorized Signatory ID</label>
              <input id="docAuthSignatoryId" name="docAuthSignatoryId" type="file" accept=".pdf,.jpg,.png" required />
            </div>
          </div>
          
          <div className="field">
            <label htmlFor="docLogo">Institution Logo (High Res)</label>
            <input id="docLogo" name="docLogo" type="file" accept=".png,.svg,.jpg" />
          </div>

          <div className="field">
            <label htmlFor="documents">Other Documents (Signed MoU / Agreement)</label>
            <input id="documents" name="documents" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" />
            <span className="field-hint" style={{ fontSize: "0.8rem", color: "var(--sub)", marginTop: "4px", display: "block" }}>Max 10MB per file.</span>
          </div>

          {/* Membership Terms */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Membership Terms</h2>

          <div className="field">
            <label htmlFor="validUntil">Membership Valid Until</label>
            <input 
              type="date" 
              id="validUntil" 
              name="validUntil"
              value={validUntil ? validUntil.toISOString().split('T')[0] : ""}
              onChange={(e) => setValidUntil(e.target.value ? new Date(e.target.value) : null)}
            />
            <p className="adm-sub" style={{ marginTop: 4 }}>Default is 1 year from today. The institution can renew it later.</p>
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ marginTop: "24px", color: "var(--critical)", background: "var(--critical-bg)", padding: "16px", borderRadius: "8px", border: "1px solid var(--critical-border)" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="success-banner" style={{ marginTop: "24px", color: "var(--success)", background: "var(--success-bg)", padding: "16px", borderRadius: "8px", border: "1px solid var(--success-border)" }}>
            {success}
          </div>
        )}

        <div className="acts" style={{ marginTop: "32px", borderTop: "1px solid var(--rule)", paddingTop: "24px" }}>
          <button className="act primary" type="submit" disabled={busy}>
            {busy ? (
              <>
                <span className="spin" aria-hidden="true" /> Saving...
              </>
            ) : (
              "Save Institution"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
