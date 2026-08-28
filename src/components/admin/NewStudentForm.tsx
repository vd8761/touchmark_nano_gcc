"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function NewStudentForm({ 
  companies 
}: { 
  companies: { id: string; name: string }[] 
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState("INTERNSHIP");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);
  const [dob, setDob] = useState<Date | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();

    const errors: Record<string, string> = {};
    if (!name) errors.name = "Student Name is required.";
    if (!email) errors.email = "Student Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Please enter a valid email address.";
    if (!startDate) errors.startDate = "Joined Date / Availability Start is required.";
    
    // Validate checkboxes
    if (!form.get("consentPrivacy")) errors.consentPrivacy = "Must accept data privacy policy.";
    if (!form.get("consentTerms")) errors.consentTerms = "Must accept terms and conditions.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    setError(null);
    setFieldErrors({});

    try {
      form.append("action", "assign-student");
      if (startDate) form.append("startDate", startDate.toISOString());
      if (completionDate) form.append("completionDate", completionDate.toISOString());
      if (dob) form.append("dob", dob.toISOString());

      const res = await fetch("/api/admin/portal", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        setError(data.error ?? "Failed to add student.");
        setBusy(false);
        return;
      }

      router.push("/admin/students");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="adm-form">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="adm-h1">Add Talent / Student</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>Register a new talent profile and optionally assign them to a corporate placement.</p>
        </div>
        <Link href="/admin/students" className="adm-btn ghost" style={{ textDecoration: "none", marginTop: "8px" }}>
          &larr; Back to Students
        </Link>
      </div>
      
      <form onSubmit={onSubmit} className="adm-card" noValidate>
        {error && (
          <div className="adm-err" role="alert">
            {error}
          </div>
        )}

        <div className="form-grid">
          {/* Personal Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "0 0 16px", gridColumn: "1 / -1" }}>Personal Information</h2>

          <div className="field-row">
            <div className={`field ${fieldErrors.name ? "error" : ""}`}>
              <label htmlFor="name">Full Name</label>
              <input id="name" name="name" type="text" placeholder="As per government ID" required />
              {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="dob">Date of Birth</label>
              <DatePicker
                id="dob"
                selected={dob}
                onChange={(date: Date | null) => setDob(date)}
                placeholderText="e.g. 01/01/2000"
                dateFormat="MM/dd/yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div className={`field ${fieldErrors.email ? "error" : ""}`}>
              <label htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" placeholder="e.g. rahul@example.com" required />
              {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" placeholder="e.g. +91 98765 43210" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="nationality">Nationality</label>
              <input id="nationality" name="nationality" type="text" placeholder="e.g. Indian" required defaultValue="Indian" />
            </div>
            <div className="field">
              <label htmlFor="countryResidence">Country of Residence</label>
              <input id="countryResidence" name="countryResidence" type="text" placeholder="e.g. India" required defaultValue="India" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="address">Current Address</label>
            <textarea id="address" name="address" placeholder="Full residential address" required rows={2} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender">
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor="emergencyContactName">Emergency Contact Name <span className="req">*</span></label>
              <input id="emergencyContactName" name="emergencyContactName" type="text" placeholder="e.g. John Doe" required />
            </div>
            <div className="adm-field">
              <label htmlFor="emergencyContactPhone">Emergency Contact Phone <span className="req">*</span></label>
              <input id="emergencyContactPhone" name="emergencyContactPhone" type="text" placeholder="e.g. +91 9876543210" required />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="field-row">
            <div className="field">
              <label htmlFor="linkedinUrl">LinkedIn Profile URL</label>
              <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." required />
            </div>
            <div className="field">
              <label htmlFor="portfolioUrl">Portfolio / GitHub Website</label>
              <input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://github.com/..." />
            </div>
          </div>

          {/* Educational Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Educational Details</h2>

          <div className="field-row">
            <div className="field">
              <label htmlFor="currentStatus">Current Status</label>
              <select id="currentStatus" name="currentStatus" required>
                <option value="Student">Student</option>
                <option value="Recent Graduate">Recent Graduate</option>
                <option value="Working Professional">Working Professional</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="institutionName">Institution Name</label>
              <input id="institutionName" name="institutionName" type="text" placeholder="e.g. XYZ University" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="highestQualification">Highest Qualification</label>
              <input id="highestQualification" name="highestQualification" type="text" placeholder="e.g. B.Tech" required />
            </div>
            <div className="field">
              <label htmlFor="fieldOfStudy">Field of Study / Specialization</label>
              <input id="fieldOfStudy" name="fieldOfStudy" type="text" placeholder="e.g. Computer Science" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="yearOfGraduation">Year of Graduation (or Expected)</label>
              <input id="yearOfGraduation" name="yearOfGraduation" type="number" min="1900" max="2100" placeholder="e.g. 2025" required />
            </div>
            <div className="field">
              <label htmlFor="cgpa">Current CGPA / Grade</label>
              <input id="cgpa" name="cgpa" type="text" placeholder="e.g. 8.5" />
            </div>
          </div>

          {/* Skills & Experience */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Skills & Experience</h2>

          <div className="field">
            <label htmlFor="technicalSkills">Technical Skills</label>
            <textarea id="technicalSkills" name="technicalSkills" placeholder="e.g. Python, React, Data Science" required rows={2} />
          </div>

          <div className="field">
            <label htmlFor="areasOfInterest">Areas of Interest</label>
            <input id="areasOfInterest" name="areasOfInterest" type="text" placeholder="e.g. AI Deployment, R&D" required />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="certifications">Certifications</label>
              <input id="certifications" name="certifications" type="text" placeholder="e.g. AWS Certified Developer" />
            </div>
            <div className="field">
              <label htmlFor="languages">Languages Known</label>
              <input id="languages" name="languages" type="text" placeholder="e.g. English, Hindi" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="priorExperience">Prior Internship / Work Experience</label>
            <textarea id="priorExperience" name="priorExperience" placeholder="Company, role, duration" rows={2} />
          </div>

          {/* Placement Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Placement & Engagement Preferences</h2>

          <div className="field">
            <label htmlFor="companyId">Assigned Corporate (Optional)</label>
            <select id="companyId" name="companyId">
              <option value="">-- None (Just registering profile) --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="preferredEngagement">Preferred Engagement Type</label>
              <input id="preferredEngagement" name="preferredEngagement" type="text" placeholder="e.g. Internship, Placement" required />
            </div>
            <div className="field">
              <label htmlFor="engagementMode">Engagement Mode Preference</label>
              <select id="engagementMode" name="engagementMode" required>
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className={`field ${fieldErrors.startDate ? "error" : ""}`}>
              <label htmlFor="startDate">Joined Date / Availability Start <span className="req">*</span></label>
              <DatePicker 
                id="startDate" 
                name="startDate" 
                required 
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="yyyy-mm-dd"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
              {fieldErrors.startDate && <span className="field-error-text">{fieldErrors.startDate}</span>}
            </div>
            <div className="adm-field">
              <label htmlFor="completionDate">Expected Completion / End Date</label>
              <DatePicker 
                id="completionDate" 
                name="completionDate" 
                selected={completionDate}
                onChange={(date: Date | null) => setCompletionDate(date)}
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
              <label htmlFor="category">Placement Category</label>
              <select 
                id="category" 
                name="category" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="INTERNSHIP">Internship</option>
                <option value="OFFER">Job Offer</option>
              </select>
            </div>
            
            {category === "INTERNSHIP" ? (
              <>
                <div className="field">
                  <label htmlFor="duration">Availability Duration</label>
                  <input id="duration" name="duration" type="text" placeholder="e.g. 6 Months" />
                </div>
                <div className="field">
                  <label htmlFor="stipend">Stipend / Month (₹)</label>
                  <input id="stipend" name="stipend" type="number" min="0" placeholder="Optional" />
                </div>
              </>
            ) : (
              <div className="field">
                <label htmlFor="lpa">CTC (LPA)</label>
                <input id="lpa" name="lpa" type="number" step="0.01" min="0" placeholder="Optional" />
              </div>
            )}
          </div>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="preferredLocation">Preferred Location(s)</label>
              <input id="preferredLocation" name="preferredLocation" type="text" placeholder="If onsite/hybrid preferred" />
            </div>
            <div className="field">
              <label htmlFor="noticePeriod">Notice Period (if employed)</label>
              <input id="noticePeriod" name="noticePeriod" type="text" placeholder="e.g. 30 days" />
            </div>
          </div>

          {/* Supporting Documents */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Supporting Documents</h2>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="docResume">Resume / CV</label>
              <input id="docResume" name="docResume" type="file" accept=".pdf,.doc,.docx" required />
            </div>
            <div className="field">
              <label htmlFor="docPhotoId">Government-Issued Photo ID</label>
              <input id="docPhotoId" name="docPhotoId" type="file" accept=".pdf,.jpg,.png" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="docEduCerts">Educational Certificates / Transcripts</label>
              <input id="docEduCerts" name="docEduCerts" type="file" accept=".pdf" required />
            </div>
            <div className="field">
              <label htmlFor="docPhoto">Passport-Size Photograph</label>
              <input id="docPhoto" name="docPhoto" type="file" accept=".jpg,.png" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="documents">Other Documents (Portfolio / Work Samples)</label>
            <input id="documents" name="documents" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png,.zip" />
            <span className="field-hint" style={{ fontSize: "0.8rem", color: "var(--sub)", marginTop: "4px", display: "block" }}>Max 10MB per file.</span>
          </div>

          {/* Consent & Agreements */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Agreements & Consents</h2>
          
          <div className={`adm-field ${fieldErrors.consentPrivacy ? "error" : ""}`} style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", gap: "12px", alignItems: "center", cursor: "pointer", fontWeight: "normal", justifyContent: "flex-start" }}>
              <input type="checkbox" name="consentPrivacy" required style={{ width: "auto", margin: 0, cursor: "pointer" }} />
              <span>Consent to Data Processing / Privacy Policy <span className="req">*</span></span>
            </label>
            {fieldErrors.consentPrivacy && <span className="field-error-text" style={{ marginTop: "4px" }}>{fieldErrors.consentPrivacy}</span>}
          </div>
          
          <div className={`adm-field ${fieldErrors.consentTerms ? "error" : ""}`} style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", gap: "12px", alignItems: "center", cursor: "pointer", fontWeight: "normal", justifyContent: "flex-start" }}>
              <input type="checkbox" name="consentTerms" required style={{ width: "auto", margin: 0, cursor: "pointer" }} />
              <span>Acceptance of Terms & Conditions (MoU/Agreement) <span className="req">*</span></span>
            </label>
            {fieldErrors.consentTerms && <span className="field-error-text" style={{ marginTop: "4px" }}>{fieldErrors.consentTerms}</span>}
          </div>

          <div className="adm-field" style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", gap: "12px", alignItems: "center", cursor: "pointer", fontWeight: "normal", justifyContent: "flex-start" }}>
              <input type="checkbox" name="consentMarketing" style={{ width: "auto", margin: 0, cursor: "pointer" }} />
              <span>Marketing / Communications Opt-in (Optional)</span>
            </label>
          </div>

        </div>

        <div style={{ marginTop: 32 }}>
          <button type="submit" className="adm-btn" disabled={busy} data-busy={busy}>
            {busy ? <span className="spin" /> : "Save Talent Record"}
          </button>
        </div>
      </form>
    </div>
  );
}
