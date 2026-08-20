"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

/**
 * Filter bar. Submits as a plain GET-style navigation so the filtered view is
 * a real, shareable, bookmarkable URL rather than hidden component state.
 */
export default function EnquiryFilters({
  kind,
  status,
  search,
}: {
  kind: string | null;
  status: string | null;
  search: string;
}) {
  const router = useRouter();

  const apply = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const query = new URLSearchParams();

    for (const key of ["kind", "status", "q"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) query.set(key, value);
    }

    router.push(`/admin/enquiries/${query.toString() ? `?${query}` : ""}`);
  };

  return (
    <form className="adm-tools" onSubmit={apply}>
      <div className="field">
        <label htmlFor="kind">Type</label>
        <select id="kind" name="kind" defaultValue={kind ?? ""}>
          <option value="">All</option>
          <option value="institution">Institution</option>
          <option value="organisation">Company</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={status ?? ""}>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="won">Won</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="field" style={{ flex: 1, minWidth: 220 }}>
        <label htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={search} placeholder="Name, email or organisation" />
      </div>

      <button className="adm-btn" type="submit">
        Apply
      </button>
      <a className="adm-btn ghost" href="/admin/enquiries/">
        Clear
      </a>
      <a className="adm-btn ghost" href="/api/admin/export?type=enquiries">
        Export CSV
      </a>
    </form>
  );
}
