"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  documentId: string;
  onSuccess?: () => void;
  apiEndpoint?: string;
  title?: string;
}

export default function SignaturePad({ documentId, onSuccess, apiEndpoint, title }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = async () => {
    if (sigCanvas.current?.isEmpty()) {
      setError("Please provide a signature first.");
      return;
    }

    setLoading(true);
    setError("");

    // Get the base64 image of the signature
    const signatureBase64 = sigCanvas.current?.getCanvas().toDataURL("image/png");

    try {
      const endpoint = apiEndpoint || `/api/sign/${documentId}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit signature");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-card" style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid var(--paper-2)", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", color: "var(--ink)" }}>{title || "E-Signature Required"}</h2>
      
      {success ? (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--success-fade, #ecfdf5)", border: "1px solid var(--success, #10b981)", borderRadius: "8px" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>✅</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--success, #10b981)" }}>Signature Submitted Successfully</h3>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>Your signature has been securely recorded. You can safely close this page.</p>
        </div>
      ) : (
        <>
          <p style={{ margin: "0 0 16px 0", fontSize: "0.95rem", color: "var(--ink-soft)" }}>
            Please sign in the box below to agree to the terms of the document.
          </p>

      <div style={{ border: "2px dashed var(--paper-3)", borderRadius: "8px", overflow: "hidden", background: "var(--paper-1)" }}>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            style: { width: "100%", height: "250px", cursor: "crosshair" }
          }}
          penColor="black"
        />
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: "0.9rem", marginTop: "12px" }}>{error}</p>}

      <div className="acts" style={{ marginTop: "24px", justifyContent: "flex-end" }}>
        <button
          onClick={clear}
          disabled={loading}
          className="act"
          style={{ padding: "14px 22px", border: "1px solid var(--ink-faint)", background: "var(--paper-1)", color: "var(--ink-soft)" }}
        >
          Clear
        </button>
        <button
          onClick={save}
          disabled={loading}
          className="act primary"
        >
          {loading ? "Submitting..." : "Sign Document"}
        </button>
      </div>
    </>
      )}
    </div>
  );
}
