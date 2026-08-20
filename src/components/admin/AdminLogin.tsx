"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin sign-in.
 *
 * The server returns one of two messages - "invalid email or password" or
 * "too many attempts" - and this form shows exactly what it was given. It must
 * not elaborate: distinguishing "no such account" from "wrong password" would
 * turn the form into a way to discover admin addresses.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data.ok !== true) {
        setError(data.error ?? "Sign-in failed. Please try again.");
        setBusy(false);
        return;
      }

      // `next` came from the middleware redirect. Only ever an in-app path -
      // reject anything else so this cannot become an open redirect.
      const next = new URLSearchParams(window.location.search).get("next");
      const target = next && /^\/admin(\/|$)/.test(next) ? next : "/admin/";

      router.replace(target);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <form onSubmit={onSubmit} noValidate>
        <h1>DOS Club Admin</h1>
        <p>Sign in to view enquiries, payments and memberships.</p>

        {error && (
          <div className="adm-err" role="alert">
            {error}
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <div className="acts" style={{ marginTop: 26 }}>
          <button className="act primary" type="submit" data-busy={busy} disabled={busy}>
            {busy ? (
              <>
                <span className="spin" aria-hidden="true" /> Signing in
              </>
            ) : (
              <>Sign in</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
