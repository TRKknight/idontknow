import { useState, useMemo } from "react";
import { PNC_DATA, PNC_LOOKUP } from "./pnc_data.js";
import { TOPIC_SYSTEM_MAP_FULL as TOPIC_SYSTEM_MAP, SYSTEM_TAG_META } from "./topic_system_map.js";

const LATEX_MAP = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε",
  mu: "μ", rho: "ρ", sigma: "σ", phi: "φ", omega: "ω",
  approx: "≈",
};

const SUB = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

function fixLatex(text) {
  return text
    .replace(/\\([a-z]+)_(\d)/g, (_, name, d) => {
      const g = LATEX_MAP[name];
      return g ? g + SUB[+d] : _;
    })
    .replace(/\\([a-z]+)/g, (_, name) => LATEX_MAP[name] || _)
    .replace(/\\([A-Z])/g, (_, c) => c)
    .replace(/([A-Za-z])_(\d)/g, (_, letter, d) => letter + SUB[+d]);
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

function renderFormattedText(text, query) {
  if (!text) return text;
  const stripped = fixLatex(text.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim());
  const boldParts = stripped.split(/(\*\*[^*]+\*\*)/g);
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

function normalizeName(name) {
  return name.replace(/\s*\(.*?\)\s*/g, "").replace(/[–—−]/g, "-").replace(/[\u2018\u2019\u201A]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
}

function getSystemTags(name) {
  if (TOPIC_SYSTEM_MAP[name]) return TOPIC_SYSTEM_MAP[name];
  const norm = normalizeName(name);
  for (const [key, tags] of Object.entries(TOPIC_SYSTEM_MAP)) {
    if (normalizeName(key) === norm) return tags;
  }
  for (const [key, tags] of Object.entries(TOPIC_SYSTEM_MAP)) {
    const kn = normalizeName(key);
    if (norm.includes(kn) || kn.includes(norm)) return tags;
  }
  return null;
}

function buildSystemsForData(data) {
  const set = new Set();
  const map = {};
  for (const e of (data || PNC_DATA)) {
    const tags = getSystemTags(e.name);
    if (tags) {
      map[e.name] = tags;
      for (const t of tags) set.add(t);
    }
  }
  return { systemMap: map, systemSet: set };
}

const SYSTEMS_CACHE = buildSystemsForData();

const SYSTEM_ORDER = [
  "GENERAL", "NEURO", "SENSES", "CVS", "RESP", "RENAL",
  "GI", "ENDO", "REPRO", "HEME", "MSK", "ANS",
  "BIOCHEM", "PATH", "ENVIRON",
];

const SYSTEM_COLORS = {
  GENERAL:    { bg: "#E8E8E8", color: "#444" },
  NEURO:      { bg: "#E1EEF5", color: "#084A75" },
  SENSES:     { bg: "#F0E6F5", color: "#5C2D75" },
  CVS:        { bg: "#FCEBEB", color: "#791F1F" },
  RESP:       { bg: "#E6F1FB", color: "#0C447C" },
  RENAL:      { bg: "#EBF5E6", color: "#2D5C1F" },
  GI:         { bg: "#FAEEDA", color: "#633806" },
  ENDO:       { bg: "#FBEAF0", color: "#72243E" },
  REPRO:      { bg: "#FCE8F0", color: "#7A1F4A" },
  HEME:       { bg: "#F5E6EB", color: "#751F3C" },
  MSK:        { bg: "#E6F0F5", color: "#1F4A75" },
  ANS:        { bg: "#EEEEDD", color: "#5C5C1A" },
  BIOCHEM:    { bg: "#E6F5EE", color: "#1F5C3C" },
  PATH:       { bg: "#F5E6E6", color: "#751F1F" },
  ENVIRON:    { bg: "#E8F0E0", color: "#3C6B1A" },
};

export function PnCNoteCard({ entry, query }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const availableSections = Object.keys(entry.sections);

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
          {SYSTEMS_CACHE.systemMap[entry.name]?.map(tag => {
            const c = SYSTEM_COLORS[tag] || { bg: "#E8E8E8", color: "#444" };
            return (
              <span key={tag} style={{
                fontSize: 9.5, padding: "1px 7px", borderRadius: 10,
                background: c.bg, color: c.color, fontWeight: 500,
              }}>
                {tag}
              </span>
            );
          })}
          <span style={{
            fontSize: 13, color: "var(--color-text-tertiary)",
            display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s", flexShrink: 0,
          }}>
            ▾
          </span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 10 }}>
          {availableSections.map((s, idx) => (
            <div key={s} style={{ marginBottom: idx < availableSections.length - 1 ? 14 : 0 }}>
              <div style={{
                fontWeight: 600, fontSize: 12, color: "var(--color-text-primary)",
                marginBottom: 5,
              }}>
                {s === "Clinical Correlates" ? "Clinical Correlation" : s}
              </div>
              {entry.sections[s].type === "list" ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {entry.sections[s].items.map((item, i) => (
                    <div key={i}>
                      {item.heading && (
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 1 }}>
                          {renderFormattedText(item.heading, query)}
                        </div>
                      )}
                      {item.text && (
                        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65 }}>
                          {renderFormattedText(item.text, query)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65 }}>
                  {renderFormattedText(entry.sections[s].text, query)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PnCNotesViewer({ data }) {
  const entries = data && data.length ? data : PNC_DATA;
  const lookup = useMemo(() => {
    const m = {};
    entries.forEach((e, i) => { m[e.name] = i; });
    return m;
  }, [entries]);
  const systemsCache = useMemo(() => buildSystemsForData(entries), [entries]);
  const [query, setQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState(null);

  const availableSystems = useMemo(() => {
    return SYSTEM_ORDER.filter(s => systemsCache.systemSet.has(s));
  }, [systemsCache]);

  const systemCounts = useMemo(() => {
    const counts = {};
    for (const s of availableSystems) {
      counts[s] = entries.filter(e => (systemsCache.systemMap[e.name] || []).includes(s)).length;
    }
    return counts;
  }, [availableSystems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = entries;
    if (systemFilter) {
      result = result.filter(e => {
        const tags = systemsCache.systemMap[e.name];
        return tags && tags.includes(systemFilter);
      });
    }
    if (!q) return result;
    return result.filter(e => {
      if (e.name.toLowerCase().includes(q)) return true;
      for (const [, section] of Object.entries(e.sections)) {
        if (section.type === "text" && section.text.toLowerCase().includes(q)) return true;
        if (section.type === "list") {
          for (const item of section.items) {
            if ((item.heading || "").toLowerCase().includes(q)) return true;
            if ((item.text || "").toLowerCase().includes(q)) return true;
          }
        }
      }
      return false;
    });
  }, [query, systemFilter]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search physiology notes..."
        style={{
          boxSizing: "border-box", width: "100%", padding: "8px 12px",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)", fontSize: 14, outline: "none",
          marginBottom: "0.75rem",
          background: "var(--color-background-primary)", color: "var(--color-text-primary)",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "0.75rem" }}>
        {[{ tag: null, label: `All (${entries.length})` }].concat(
          availableSystems.map(s => ({ tag: s, label: `${s} (${systemCounts[s] || 0})` }))
        ).map(({ tag, label }) => {
          const active = systemFilter === tag;
          const colors = tag ? (SYSTEM_COLORS[tag] || { bg: "#E8E8E8", color: "#444" }) : null;
          return (
            <button key={tag || "all"} onClick={() => setSystemFilter(tag)}
              style={{
                padding: "3px 10px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                border: active ? `1.5px solid ${colors ? colors.color : "var(--color-border-primary)"}` : "0.5px solid var(--color-border-tertiary)",
                background: active ? (colors ? colors.bg : "var(--color-background-secondary)") : "transparent",
                color: active ? (colors ? colors.color : "var(--color-text-primary)") : "var(--color-text-secondary)",
                fontWeight: active ? 600 : 400,
              }}>
              {label}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: "0.75rem" }}>
        {filtered.length} of {entries.length}{systemFilter ? ` (${SYSTEM_TAG_META[systemFilter] || systemFilter})` : ""} notes
      </p>

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14, padding: "2rem 0" }}>
          No notes match your search.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map(e => (
            <PnCNoteCard key={e.name} entry={e} query={query.trim().toLowerCase()} />
          ))}
        </div>
      )}
    </div>
  );
}
