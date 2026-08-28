"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function NewPartnerForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [timeZone, setTimeZone] = useState("");
  const timeZoneOptions = Intl.supportedValuesOf('timeZone').map(tz => {
    // Some older JS engines use Asia/Calcutta instead of Asia/Kolkata
    if (tz === 'Asia/Calcutta') return { value: 'Asia/Kolkata', label: 'Asia/Kolkata' };
    return { value: tz, label: tz };
  });
  if (!timeZoneOptions.find(o => o.value === 'Asia/Kolkata')) {
    timeZoneOptions.push({ value: 'Asia/Kolkata', label: 'Asia/Kolkata' });
  }
  timeZoneOptions.sort((a, b) => a.label.localeCompare(b.label));

  const [dateOfIncorporation, setDateOfIncorporation] = useState<Date | null>(null);
  const [companies, setCompanies] = useState<{ id: number, name: string, contactName?: string, email: string, phone?: string, location?: string, country?: string }[]>([]);

  const addCompany = () => {
    setCompanies(prev => [...prev, { id: Date.now(), name: "", contactName: "", email: "", phone: "", location: "", country: "India" }]);
  };

  const updateCompany = (id: number, field: "name" | "contactName" | "email" | "phone" | "location" | "country", value: string) => {
    setCompanies(companies.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCompany = (id: number) => {
    setCompanies(companies.filter(c => c.id !== id));
  };

  const checkEmail = async (email: string, fieldKey: string) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return;
    try {
      const res = await fetch(`/api/admin/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.exists) {
        setFieldErrors(prev => ({ ...prev, [fieldKey]: "An account with this email already exists." }));
      } else {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next[fieldKey];
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
    if (!name) errors.name = "Partner Name is required.";
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

    const validCompanies = companies.filter(c => c.name.trim() && c.email.trim());

    try {
      form.append("action", "create-ecosystem-partner");
      form.append("timeZone", timeZone);
      if (dateOfIncorporation) {
        form.append("dateOfIncorporation", dateOfIncorporation.toISOString().split('T')[0]);
      }
      form.append("companies", JSON.stringify(validCompanies));

      const res = await fetch("/api/admin/portal", {
        method: "POST",
        body: form,
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        setError(data.error ?? "Failed to create partner.");
        setBusy(false);
        return;
      }

      setSuccess("Ecosystem partner created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/admin/partners");
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
          <h1 className="adm-h1">Add Ecosystem Partner</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>Create a new partner account and optionally link companies instantly.</p>
        </div>
        <Link href="/admin/partners" className="adm-btn ghost" style={{ textDecoration: "none", marginTop: "8px" }}>
          &larr; Back to Partners
        </Link>
      </div>

      <form onSubmit={onSubmit} className="adm-card" noValidate>
        <div className="form-grid">
          {/* Organization Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "0 0 16px", gridColumn: "1 / -1" }}>Organization Details</h2>
          
          <div className="field-row">
            <div className={`field ${fieldErrors.name ? "error" : ""}`}>
              <label htmlFor="name">Full Legal Entity / Individual Name</label>
              <input id="name" name="name" type="text" placeholder="e.g. Global Tech Partners" required />
              {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="tradingName">Trading / Brand Name</label>
              <input id="tradingName" name="tradingName" type="text" placeholder="e.g. GTP" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="partnerType">Partner Type</label>
              <select id="partnerType" name="partnerType" required>
                <option value="Individual Consultant">Individual Consultant</option>
                <option value="Agency">Agency</option>
                <option value="Registered Company">Registered Company</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="industrySector">Industry / Sector of Operation</label>
              <input id="industrySector" name="industrySector" type="text" placeholder="e.g. Staffing, Consulting" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="companyNumber">Business Registration / Company Number</label>
              <input id="companyNumber" name="companyNumber" type="text" placeholder="Required if Company/Agency" />
            </div>
            <div className="field">
              <label htmlFor="dateOfIncorporation">Date of Incorporation / Establishment</label>
              <DatePicker 
                id="dateOfIncorporation" 
                name="dateOfIncorporation" 
                selected={dateOfIncorporation} 
                onChange={(date) => setDateOfIncorporation(date)} 
                dateFormat="yyyy-MM-dd"
                placeholderText="yyyy-mm-dd"
                maxDate={new Date()}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="website">Website URL</label>
              <input id="website" name="website" type="url" placeholder="https://..." />
            </div>
            <div className="field">
              <label htmlFor="linkedinUrl">LinkedIn / Company Profile URL</label>
              <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/..." required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="country">Country of Incorporation / Residence</label>
              <input id="country" name="country" type="text" placeholder="e.g. India" required defaultValue="India" />
            </div>
            <div className="field">
              <label htmlFor="location">City / State</label>
              <input id="location" name="location" type="text" placeholder="e.g. Bengaluru, KA" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="registeredAddress">Registered / Residential Address</label>
            <textarea id="registeredAddress" name="registeredAddress" placeholder="Include city, state/province, postal code" required rows={2} />
          </div>

          <div className="field">
            <label htmlFor="timeZone">Time Zone</label>
            <Select
              id="timeZone"
              instanceId="timeZoneSelect"
              options={timeZoneOptions}
              value={timeZone ? timeZoneOptions.find(o => o.value === timeZone) : null}
              onChange={(option) => setTimeZone(option?.value || "")}
              placeholder="Select a Time Zone..."
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  fontFamily: 'var(--sans)',
                  borderColor: 'var(--rule)',
                  borderRadius: '8px',
                  minHeight: '44px',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: 'var(--seed)'
                  }
                }),
                option: (base, state) => ({
                  ...base,
                  fontFamily: 'var(--sans)',
                  backgroundColor: state.isSelected ? 'var(--seed)' : state.isFocused ? 'var(--paper-3)' : 'transparent',
                  color: state.isSelected ? '#fff' : 'var(--ink-2)',
                  '&:active': {
                    backgroundColor: 'var(--seed)',
                    color: '#fff'
                  }
                })
              }}
            />
          </div>

          {/* Contact Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Contact Information</h2>

          <div className="field-row">
            <div className="field">
              <label htmlFor="contactPerson">Primary Contact Full Name</label>
              <input id="contactPerson" name="contactPerson" type="text" placeholder="e.g. John Smith" required />
            </div>
            <div className="field">
              <label htmlFor="designation">Designation / Title</label>
              <input id="designation" name="designation" type="text" placeholder="e.g. Director" required />
            </div>
          </div>

          <div className="field-row">
            <div className={`field ${fieldErrors.email ? "error" : ""}`}>
              <label htmlFor="email">Business Email Address</label>
              <input 
                id="email" name="email" type="email" placeholder="e.g. hello@globaltech.com" required 
                onBlur={(e) => checkEmail(e.target.value, "email")}
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
              <label htmlFor="altContactName">Alternate / Secondary Contact Name</label>
              <input id="altContactName" name="altContactName" type="text" placeholder="e.g. Jane Doe" />
            </div>
            <div className="field">
              <label htmlFor="altContactEmail">Alternate Contact Email</label>
              <input id="altContactEmail" name="altContactEmail" type="email" placeholder="jane@..." />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="altContactPhone">Alternate Contact Phone</label>
              <input id="altContactPhone" name="altContactPhone" type="tel" placeholder="+91..." />
            </div>
          </div>

          <div className="field">
            <label htmlFor="preferredLanguages">Preferred Language(s) of Communication</label>
            <input id="preferredLanguages" name="preferredLanguages" type="text" placeholder="e.g. English, Hindi" />
          </div>

          {/* Network & Market Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Network & Market Details</h2>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="experienceYears">Years of Experience in Partnership/BD</label>
              <input id="experienceYears" name="experienceYears" type="number" min="0" placeholder="e.g. 5" required />
            </div>
            <div className="field">
              <label htmlFor="estimatedCompanies">Estimated Number of Companies (Year 1)</label>
              <input id="estimatedCompanies" name="estimatedCompanies" type="number" min="0" placeholder="e.g. 10" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="descriptionNetwork">Description of Existing Network</label>
            <textarea id="descriptionNetwork" name="descriptionNetwork" placeholder="Size, industries, geographies covered" required rows={2} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="primaryTargetMarket">Country(ies) / Region of Market Coverage</label>
              <input id="primaryTargetMarket" name="primaryTargetMarket" type="text" placeholder="e.g. UK, Singapore, US" required />
            </div>
            <div className="field">
              <label htmlFor="industryVerticals">Industry Verticals of Focus</label>
              <input id="industryVerticals" name="industryVerticals" type="text" placeholder="e.g. IT, Healthcare" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="priorGccExperience">Prior Experience with India / GCC Ecosystem</label>
            <input id="priorGccExperience" name="priorGccExperience" type="text" placeholder="Yes/No + Details" />
          </div>

          <div className="field">
            <label htmlFor="references">References (Name, Organization, Contact)</label>
            <textarea id="references" name="references" placeholder="Up to 3 references" rows={2} />
          </div>

          {/* Banking & Tax Details */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Banking & Tax Details</h2>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="bankHolderName">Bank Account Holder Name</label>
              <input id="bankHolderName" name="bankHolderName" type="text" placeholder="e.g. Global Tech Partners" required />
            </div>
            <div className="field">
              <label htmlFor="bankName">Bank Name & Branch</label>
              <input id="bankName" name="bankName" type="text" placeholder="e.g. HDFC Bank, Koramangala" required />
            </div>
          </div>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="bankAccount">Account Number / IBAN</label>
              <input id="bankAccount" name="bankAccount" type="text" placeholder="e.g. 50100..." required />
            </div>
            <div className="field">
              <label htmlFor="bankIfsc">SWIFT / BIC Code</label>
              <input id="bankIfsc" name="bankIfsc" type="text" placeholder="e.g. HDFC0001234" required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="preferredCurrency">Preferred Currency</label>
              <select id="preferredCurrency" name="preferredCurrency" required defaultValue="USD">
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="taxId">Tax ID (PAN / EIN / VAT ID)</label>
              <input id="taxId" name="taxId" type="text" placeholder="e.g. ABCDE1234F" required />
            </div>
          </div>
          
          <div className="field">
            <label htmlFor="taxForm">Applicable Tax Form (Optional)</label>
            <input id="taxForm" name="taxForm" type="file" accept=".pdf,.jpg,.png" />
            <span className="field-hint">e.g., W-8BEN / W-9 / local tax residency certificate</span>
          </div>
          
          {/* Supporting Documents */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Supporting Documents</h2>
          
          <div className="field-row">
            <div className="field">
              <label htmlFor="docProfile">Company / Individual Profile</label>
              <input id="docProfile" name="docProfile" type="file" accept=".pdf" required />
            </div>
            <div className="field">
              <label htmlFor="docIncorporation">Certificate of Incorporation</label>
              <input id="docIncorporation" name="docIncorporation" type="file" accept=".pdf" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="docPhotoId">Government-Issued Photo ID</label>
              <input id="docPhotoId" name="docPhotoId" type="file" accept=".pdf,.jpg,.png" required />
            </div>
            <div className="field">
              <label htmlFor="docAddressProof">Proof of Registered Address</label>
              <input id="docAddressProof" name="docAddressProof" type="file" accept=".pdf,.jpg,.png" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="docTaxRegistration">Tax Registration Certificate</label>
              <input id="docTaxRegistration" name="docTaxRegistration" type="file" accept=".pdf" required />
            </div>
            <div className="field">
              <label htmlFor="docBankVerification">Bank Verification Document</label>
              <input id="docBankVerification" name="docBankVerification" type="file" accept=".pdf,.jpg,.png" required />
            </div>
          </div>
          
          <div className="field">
            <label htmlFor="documents">Other / Additional Documents</label>
            <input id="documents" name="documents" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" />
            <span className="field-hint">Signed MoU, Commercial Agreement, Auth letter, etc. Max 10MB per file.</span>
          </div>

          {/* Commission Terms */}
          <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: "24px 0 16px", gridColumn: "1 / -1" }}>Commission Terms</h2>

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

        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--rule)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 className="adm-h1" style={{ fontSize: "1.1rem", margin: 0 }}>Linked Companies (Optional)</h2>
            <button type="button" onClick={addCompany} className="adm-btn ghost" style={{ padding: "6px 12px", fontSize: "0.7rem" }}>
              + Add Company
            </button>
          </div>
          
          {companies.length === 0 ? (
            <p className="adm-sub">No companies linked yet. Click the button to quick-add companies.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {companies.map((c, i) => (
                <div key={c.id} style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "16px", 
                  background: "transparent", 
                  padding: "20px", 
                  borderRadius: "6px",
                  border: "1px solid var(--rule-strong)"
                }}>
                  <div className="field-row">
                    <div className="field">
                      <label>Company {i + 1} Name</label>
                      <input type="text" value={c.name} onChange={e => updateCompany(c.id, "name", e.target.value)} placeholder="e.g. Acme Corp" required />
                    </div>
                    <div className="field">
                      <label>Contact Person Name</label>
                      <input type="text" value={c.contactName || ""} onChange={e => updateCompany(c.id, "contactName", e.target.value)} placeholder="e.g. Jane Doe" required />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className={`field ${fieldErrors[`company_email_${c.id}`] ? "error" : ""}`}>
                      <label>Contact Email</label>
                      <input 
                        type="email" 
                        value={c.email} 
                        onChange={e => updateCompany(c.id, "email", e.target.value)} 
                        onBlur={(e) => checkEmail(e.target.value, `company_email_${c.id}`)}
                        placeholder="e.g. hello@acme.com" 
                        required 
                      />
                      {fieldErrors[`company_email_${c.id}`] && <span className="field-error-text">{fieldErrors[`company_email_${c.id}`]}</span>}
                    </div>
                    <div className="field">
                      <label>Phone Number</label>
                      <input type="text" value={c.phone || ""} onChange={e => updateCompany(c.id, "phone", e.target.value)} placeholder="e.g. +91 98765 43210" required />
                    </div>
                  </div>
                  
                  <div className="field">
                    <label>City / State</label>
                    <input type="text" value={c.location || ""} onChange={e => updateCompany(c.id, "location", e.target.value)} placeholder="e.g. Mumbai, MH" required />
                  </div>
                  <div className="field">
                    <label>Country</label>
                    <input type="text" value={c.country || "India"} onChange={e => updateCompany(c.id, "country", e.target.value)} placeholder="e.g. India" required />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => removeCompany(c.id)} className="adm-btn ghost" style={{ borderColor: "var(--proven)", color: "var(--proven)", opacity: 0.8 }}>
                      Remove Company
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <div className="acts" style={{ marginTop: "32px", borderTop: "1px solid var(--rule)", paddingTop: "24px" }}>
          <button className="act primary" type="submit" disabled={busy || !!success}>
            {busy ? (
              <>
                <span className="spin" aria-hidden="true" /> Saving...
              </>
            ) : (
              "Save Ecosystem Partner"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
