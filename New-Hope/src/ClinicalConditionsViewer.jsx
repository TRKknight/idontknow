import { useState, useMemo } from "react";
import { CLINICAL_DATA } from "./clinical_data.js";

const ALL_TABS = [...new Set(CLINICAL_DATA.map(e => e.tab).filter(Boolean))].sort();

const TAB_COLORS = {
  "Hematology and Immunology": "#c0392b",
  "Cardiovascular System (CVS)": "#e74c3c",
  "Respiratory System": "#2980b9",
  "Gastrointestinal and Metabolic": "#e67e22",
  "Renal and Acid-Base": "#27ae60",
  "Endocrine and Reproductive": "#8e44ad",
  "Integrative Physiology": "#1abc9c",
};

const dotStyle = (tab) => ({
  display: "inline-block", width: 6, height: 6, borderRadius: "50%",
  background: TAB_COLORS[tab] || "#888", marginRight: 5, verticalAlign: "middle",
});

function highlightMatch(text, q) {
  if (!q || !text) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={i} style={{ background: "rgba(255,200,0,.4)", borderRadius: 2, padding: 0 }}>{part}</mark>
      : part
  );
}

function renderFormattedText(text, query) {
  if (!text) return text;
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  let keyCounter = 0;
  return boldParts.map(part => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    const content = isBold ? part.slice(2, -2) : part;
    const highlighted = highlightMatch(content, query);
    const k = keyCounter++;
    return isBold
      ? <strong key={k} style={{ fontWeight: 600 }}>{highlighted}</strong>
      : <span key={k}>{highlighted}</span>;
  });
}

function ClinicalNoteCard({ entry, query }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const fieldKeys = Object.keys(entry.sections);

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "0.875rem 1.125rem",
        cursor: "pointer",
        transition: "border-color 0.15s",
        borderColor: hovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)",
      }}
      onClick={() => setOpen(o => !o)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--color-text-primary)" }}>
          {highlightMatch(entry.name, query)}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {entry.tab && (
            <span style={{
              fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em",
              color: TAB_COLORS[entry.tab] || "var(--color-text-tertiary)",
              background: "var(--color-background-secondary)",
              padding: "2px 7px", borderRadius: 10,
            }}>
              <span style={dotStyle(entry.tab)} />{entry.tab}
            </span>
          )}
          <span style={{
            fontSize: 13, color: "var(--color-text-tertiary)",
            display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}>
            ▾
          </span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 10 }}>
          {fieldKeys.map((key, idx) => (
            <div key={key} style={{ marginBottom: idx < fieldKeys.length - 1 ? 14 : 0 }}>
              <div style={{
                fontWeight: 600, fontSize: 12, color: "var(--color-text-primary)",
                marginBottom: 5,
              }}>
                {key === "Clinical correlation" ? "Clinical Correlation" : key}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {renderFormattedText(entry.sections[key], query)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClinicalConditionsViewer({ data }) {
  const items = data && data.length ? data : CLINICAL_DATA;
  const allTabs = useMemo(() => [...new Set(items.map(e => e.tab).filter(Boolean))].sort(), [items]);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = items;
    if (activeTab !== "All") {
      result = result.filter(e => e.tab === activeTab);
    }
    if (!q) return result;
    return result.filter(e => {
      if (e.name.toLowerCase().includes(q)) return true;
      for (const val of Object.values(e.sections)) {
        if (val.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [query, activeTab, items]);

  const catBtnStyle = (active) => ({
    padding: "5px 11px",
    border: `0.5px solid ${active ? "var(--color-border-primary)" : "var(--color-border-tertiary)"}`,
    borderRadius: 20,
    background: active ? "var(--color-background-secondary)" : "var(--color-background-primary)",
    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    fontWeight: active ? 500 : 400,
    fontSize: 12,
    cursor: "pointer",
  });

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search clinical conditions..."
        style={{
          boxSizing: "border-box", width: "100%", padding: "8px 12px",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)", fontSize: 14, outline: "none",
          marginBottom: "0.75rem",
          background: "var(--color-background-primary)", color: "var(--color-text-primary)",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
        <button
          key="All"
          style={catBtnStyle(activeTab === "All")}
          onClick={() => setActiveTab("All")}
        >
          All ({items.length})
        </button>
        {allTabs.map(t => (
          <button
            key={t}
            style={catBtnStyle(activeTab === t)}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: "0.75rem" }}>
        {filtered.length} of {items.length} clinical conditions
      </p>

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14, padding: "2rem 0" }}>
          No conditions match your search.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map(e => (
            <ClinicalNoteCard key={e.name} entry={e} query={query.trim().toLowerCase()} />
          ))}
        </div>
      )}
    </div>
  );
}
