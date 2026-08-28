"use client";

import React, { useState, useEffect, useRef } from "react";

// Dynamically import CKEditor to prevent SSR issues
import dynamic from "next/dynamic";

const CKEditorWrapper = dynamic(
  () => import("./CKEditorWrapper"),
  { ssr: false, loading: () => <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-soft)" }}>Loading editor...</div> }
);

interface Document {
  id: string;
  document_key: string;
  title: string;
  content_html: string;
  updated_at: string;
}

export default function AgreementsEditor() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch("/api/admin/agreements")
      .then(r => r.json())
      .then(data => {
        if (data.docs) {
          setDocs(data.docs);
          if (data.docs.length > 0) {
            setSelectedKey(data.docs[0].document_key);
            setHtmlContent(data.docs[0].content_html);
          }
        }
        setLoading(false);
      });
  }, []);

  const handleSelect = (key: string) => {
    const doc = docs.find(d => d.document_key === key);
    if (doc) {
      setSelectedKey(key);
      setHtmlContent(doc.content_html);
    }
  };

  const handleSave = async () => {
    if (!selectedKey) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/agreements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_key: selectedKey, content_html: htmlContent }),
      });
      if (res.ok) {
        showToast("Document saved successfully!", "success");
        setDocs(docs.map(d => d.document_key === selectedKey ? { ...d, content_html: htmlContent } : d));
      } else {
        showToast("Failed to save. Please try again.", "error");
      }
    } catch (e) {
      showToast("Error saving document. Check your connection.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading agreements...</div>;

  const currentDoc = docs.find(d => d.document_key === selectedKey);

  return (
    <div style={{ display: "flex", gap: "24px", minHeight: "60vh", alignItems: "flex-start", position: "relative" }}>
      {/* In-app toast notification */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: toast.type === "success" ? "#1a7f4b" : "#c0392b",
          color: "white",
          padding: "14px 20px",
          borderRadius: "10px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          fontSize: "0.9rem",
          fontWeight: 500,
          animation: "slideInUp 0.3s ease",
          maxWidth: "360px"
        }}>
          <span style={{ fontSize: "1.1rem" }}>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Sidebar */}
      <div style={{
        width: "220px",
        borderRight: "1px solid var(--paper-2)",
        paddingRight: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "sticky",
        top: "24px",
        maxHeight: "calc(100vh - 48px)",
        overflowY: "auto"
      }}>
        <h3 style={{ fontSize: "0.75rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 700 }}>Documents</h3>
        {docs.map(doc => (
          <button
            key={doc.document_key}
            onClick={() => handleSelect(doc.document_key)}
            style={{
              padding: "10px 12px",
              textAlign: "left",
              background: selectedKey === doc.document_key ? "var(--paper-1)" : "transparent",
              border: selectedKey === doc.document_key ? "1px solid var(--paper-3)" : "1px solid transparent",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: selectedKey === doc.document_key ? 600 : 400,
              color: "var(--ink)",
              transition: "background 0.2s",
              lineHeight: 1.4
            }}
          >
            {doc.title}
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>

        {/* Sticky Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--paper)",
          padding: "20px 24px 16px 24px",
          height: "112px",
          borderBottom: "1px solid var(--paper-3)",
          marginTop: "-16px"
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 6px 0" }}>{currentDoc?.title}</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.4 }}>
              Use variables: <code>[Company Name]</code>, <code>[Institution Name]</code>, <code>[Ecosystem Partner Name]</code>, <code>[Date]</code>, <code>[Partner Name]</code>, <code>[Address]</code>, <code>[Representative Name]</code>, <code>[Designation]</code> to auto-fill data.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
            <button className="act primary" onClick={handleSave} disabled={saving} style={{ padding: "8px 24px" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <div style={{ display: "flex", gap: "4px", background: "var(--paper-2)", padding: "4px", borderRadius: "6px" }}>
              <button onClick={() => setMode("edit")} style={{ padding: "4px 12px", fontSize: "0.82rem", cursor: "pointer", background: mode === "edit" ? "white" : "transparent", border: "none", borderRadius: "4px", boxShadow: mode === "edit" ? "0 1px 2px rgba(0,0,0,0.1)" : "none", color: mode === "edit" ? "var(--ink)" : "var(--ink-soft)" }}>
                Edit
              </button>
              <button onClick={() => setMode("preview")} style={{ padding: "4px 12px", fontSize: "0.82rem", cursor: "pointer", background: mode === "preview" ? "white" : "transparent", border: "none", borderRadius: "4px", boxShadow: mode === "preview" ? "0 1px 2px rgba(0,0,0,0.1)" : "none", color: mode === "preview" ? "var(--ink)" : "var(--ink-soft)" }}>
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Editor / Preview */}
        {mode === "edit" ? (
          <div style={{ flex: 1, border: "1px solid var(--paper-3)", borderRadius: "8px", background: "#f8f9fa", overflow: "visible" }}>
            {/* Sticky toolbar container — CKEditor DecoupledEditor appends toolbar here */}
            <div
              id="ck-sticky-toolbar"
              className="ck-decoupled-toolbar"
              style={{
                position: "sticky",
                top: "112px",
                zIndex: 99,
                borderBottom: "1px solid #dadce0",
                borderRadius: "8px 8px 0 0",
                minHeight: "48px",
                background: "#f1f3f4",
              }}
            />
            {/* Scrollable editor content */}
            <div style={{ background: "#f8f9fa", padding: "32px 0", borderRadius: "0 0 8px 8px" }}>
              <CKEditorWrapper
                value={htmlContent}
                onChange={setHtmlContent}
                toolbarContainerId="ck-sticky-toolbar"
              />
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1,
            background: "#f8f9fa",
            border: "1px solid var(--paper-3)",
            borderRadius: "8px",
            padding: "32px 0",
            display: "flex",
            justifyContent: "center"
          }}>
            <div
              style={{
                background: "white",
                width: "816px",
                minHeight: "1056px",
                padding: "96px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: "11pt",
                lineHeight: 1.6,
                color: "#000"
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
