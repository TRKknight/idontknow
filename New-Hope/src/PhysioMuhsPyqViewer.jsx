import { useState, useMemo } from "react";

const SYSTEM_META = {
  "BLOOD": { c: "#c0392b", short: "Blood" },
  "RESPIRATORY SYSTEM": { c: "#2980b9", short: "Respiratory" },
  "GASTROINTESTINAL SYSTEM": { c: "#e67e22", short: "GI" },
  "ENDOCRINE PHYSIOLOGY": { c: "#8e44ad", short: "Endocrine" },
  "REPRODUCTIVE SYSTEM": { c: "#d35400", short: "Reproductive" },
  "CENTRAL NERVOUS SYSTEM": { c: "#34495e", short: "CNS" },
  "NERVE-MUSCLE PHYSIOLOGY": { c: "#16a085", short: "Nerve-Muscle" },
  "AETCOM (DOCTOR-PATIENT RELATIONSHIP)": { c: "#7f8c8d", short: "AETCOM" },
};

function meta(sys) {
  return SYSTEM_META[sys] || { c: "#888", short: sys };
}

function yearLabel(c) {
  const parts = [c.season, c.year];
  if (c.phase) parts.splice(1, 0, c.phase);
  return parts.filter(Boolean).join(" ");
}

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

function renderAnswer(text, q) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  let keyCounter = 0;
  return parts.map(part => {
    if (!part) return null;
    const isBold = part.startsWith("**") && part.endsWith("**");
    const content = isBold ? part.slice(2, -2) : part;
    return isBold
      ? <strong key={keyCounter++} style={{ fontWeight: 600 }}>{highlightMatch(content, q)}</strong>
      : <span key={keyCounter++}>{highlightMatch(content, q)}</span>;
  });
}

export default function PhysioMuhsPyqViewer({ data }) {
  const [sys, setSys] = useState("All");
  const [q, setQ] = useState("");
  const [year, setYear] = useState("All");
  const [openCode, setOpenCode] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState(null);

  const systems = useMemo(
    () => ["All", ...new Set(data.map(c => c.system))],
    [data]
  );
  const years = useMemo(
    () => [...new Set(data.map(c => c.year))].sort((a, b) => b - a),
    [data]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.filter(c => {
      const sysOk = sys === "All" || c.system === sys;
      const yearOk = year === "All" || c.year === year;
      const searchOk = !query
        || c.title.toLowerCase().includes(query)
        || c.stem.toLowerCase().includes(query)
        || c.questions.join(" ").toLowerCase().includes(query)
        || c.system.toLowerCase().includes(query);
      return sysOk && yearOk && searchOk;
    });
  }, [data, sys, year, q]);

  const open = openCode ? data.find(c => c.code === openCode) : null;

  return (
    <div>
      {/* filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {systems.map(s => {
          const m = meta(s);
          const active = sys === s;
          return (
            <button
              key={s}
              onClick={() => { setSys(s); setOpenCode(null); setRevealed(false); }}
              style={{
                padding: "5px 11px",
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                border: active ? `1.5px solid ${m.c}` : "0.5px solid var(--color-border-tertiary)",
                background: active ? "var(--color-background-secondary)" : "var(--color-background-primary)",
                color: active ? m.c : "var(--color-text-secondary)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {s === "All" ? `All (${data.length})` : m.short}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            fontSize: 14,
            outline: "none",
          }}
          placeholder="Search cases, symptoms, topics…"
          value={q}
          onChange={e => { setQ(e.target.value); setOpenCode(null); setRevealed(false); }}
        />
        <select
          value={year}
          onChange={e => { setYear(e.target.value); setOpenCode(null); setRevealed(false); }}
          style={{
            padding: "8px 10px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            fontSize: 13,
            outline: "none",
          }}
        >
          <option value="All">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: "0.75rem" }}>
        {filtered.length} of {data.length} MUHS clinical cases
      </p>

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14, padding: "2rem 0" }}>
          No cases match your search.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map(c => {
            const m = meta(c.system);
            const isOpen = openCode === c.code;
            return (
              <div
                key={c.code}
                onClick={() => {
                  if (openCode === c.code) { setOpenCode(null); setRevealed(false); }
                  else { setOpenCode(c.code); setRevealed(false); }
                }}
                onMouseEnter={() => setHovered(c.code)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: "var(--color-background-primary)",
                  borderTop: `1px solid ${hovered === c.code ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
                  borderRight: `1px solid ${hovered === c.code ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
                  borderBottom: `1px solid ${hovered === c.code ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
                  borderLeft: `3px solid ${m.c}`,
                  borderRadius: 6,
                  padding: "12px 14px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                      {highlightMatch(c.title, q)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10,
                      color: "var(--color-text-tertiary)",
                      background: "var(--color-background-secondary)",
                      borderRadius: 10,
                      padding: "2px 8px",
                    }}>
                      {yearLabel(c)}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                      {isOpen ? "▾" : "▸"}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 10, paddingTop: 10 }}>
                    <div style={{ fontSize: 13.5, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>
                      {highlightMatch(c.stem, q)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-tertiary)", marginBottom: 6 }}>
                      Questions
                    </div>
                    <ol style={{ margin: "0 0 10px", paddingLeft: 20, fontSize: 13.5, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                      {c.questions.map((question, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          {highlightMatch(question, q)}
                        </li>
                      ))}
                    </ol>

                    {!revealed ? (
                      <button
                        onClick={e => { e.stopPropagation(); setRevealed(true); }}
                        style={{
                          padding: "7px 14px",
                          border: "0.5px solid var(--color-text-primary)",
                          borderRadius: "var(--border-radius-md)",
                          background: "var(--color-background-primary)",
                          color: "var(--color-text-primary)",
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: "pointer",
                          marginBottom: 8,
                        }}
                      >
                        Reveal model answers ↓
                      </button>
                    ) : (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-tertiary)", marginBottom: 6 }}>
                          Model answers
                        </div>
                        {c.modelAnswer.map((blocks, i) => (
                          <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: m.c, marginBottom: 4 }}>
                              {c.questions.length > 1 ? `Q${i + 1}` : "Answer"}
                            </div>
                            {blocks.map((b, j) => (
                              <p key={j} style={{ margin: "0 0 6px", fontSize: 13.5, color: "var(--color-text-primary)", lineHeight: 1.65 }}>
                                {renderAnswer(b, q)}
                              </p>
                            ))}
                          </div>
                        ))}
                        {c.keyPoints && (
                          <div style={{ background: "var(--color-background-secondary)", borderLeft: "3px solid var(--color-text-tertiary)", borderRadius: 4, padding: "8px 10px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                            <strong style={{ fontWeight: 600 }}>Self-check points: </strong>
                            {highlightMatch(c.keyPoints, q)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}