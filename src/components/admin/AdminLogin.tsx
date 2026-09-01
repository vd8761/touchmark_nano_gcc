"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
      const target = next && /^\/admin(\/|$)/.test(next) ? next : "/admin";

      router.replace(target);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: "#ffffff" }}>

      {/* Left Panel - Branding */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "40px",
        position: "relative",
        overflow: "hidden",
        color: "#ffffff"
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, rgba(15, 23, 42, 0) 70%)",
          borderRadius: "50%", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0) 70%)",
          borderRadius: "50%", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "15%", width: "250px", height: "250px",
          border: "1px solid rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "20%", width: "2px", height: "100px",
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
          transform: "rotate(45deg)", opacity: 0.3
        }} />

        {/* Top Logo */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}>
          <img
            src="/brand/touchmark-logo-white.svg"
            alt="Touchmark Logo"
            style={{ height: "36px", display: "block" }}
          />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFFFFF", fontWeight: 700, marginLeft: "20px", paddingLeft: "20px", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>NANO GCC</span>
        </div>

        {/* Hero Text */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "480px" }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "3.5rem", fontWeight: 700, lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-0.02em" }}>
            Ecosystem<br />Management
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#E2E8F0", lineHeight: 1.6, fontWeight: 400 }}>
            Empowering global careers. Streamline operations, track student progress, and connect with corporate partners seamlessly.
          </p>
        </div>

        {/* Footer Text */}
        <div style={{ position: "relative", zIndex: 1, fontSize: "0.85rem", color: "#94A3B8" }}>
          &copy; {new Date().getFullYear()} Touchmark Nano GCC. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        width: "100%",
        maxWidth: "600px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        background: "#ffffff"
      }}>
        <form
          onSubmit={onSubmit}
          noValidate
          style={{ width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column" }}
        >
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "2rem", color: "#0F172A", margin: "0 0 8px" }}>
              Admin Sign In
            </h2>
            <p style={{ fontSize: "0.95rem", color: "#64748B", margin: 0 }}>
              Sign in to manage Touchmark Nano GCC.
            </p>
          </div>

          {error && (
            <div style={{ background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.2)", color: "#EF4444", padding: "12px 16px", borderRadius: "12px", fontSize: "0.9rem", marginBottom: "24px" }} role="alert">
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="name@company.com"
                required
                style={{
                  width: "100%", padding: "14px 16px", background: "#ffffff", border: "1px solid #E2E8F0",
                  borderRadius: "12px", color: "#0F172A", fontSize: "0.95rem", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%", padding: "14px 48px 14px 16px", background: "#ffffff", border: "1px solid #E2E8F0",
                    borderRadius: "12px", color: "#0F172A", fontSize: "0.95rem", outline: "none", boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%", padding: "16px",
                background: busy ? "#CBD5E1" : "#1E293B",
                color: busy ? "#64748B" : "#ffffff",
                border: "1px solid #1E293B",
                borderRadius: "12px", fontSize: "1rem", fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => {
                if (!busy) e.currentTarget.style.backgroundColor = "#0F172A";
              }}
              onMouseOut={(e) => {
                if (!busy) e.currentTarget.style.backgroundColor = "#1E293B";
              }}
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
