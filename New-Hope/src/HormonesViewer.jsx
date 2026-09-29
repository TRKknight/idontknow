import { useState, useMemo } from "react";

const GROUP_META = {
  "HYPOTHALAMUS": { c: "#084A75", bg: "#E1EEF5", short: "Hypothalamus" },
  "ANTERIOR PITUITARY GLAND": { c: "#2D5C1F", bg: "#EBF5E6", short: "Ant. Pituitary" },
  "POSTERIOR PITUITARY GLAND": { c: "#1F4A75", bg: "#E6F0F5", short: "Post. Pituitary" },
  "THYROID & PARATHYROID GLANDS": { c: "#633806", bg: "#FAEEDA", short: "Thyroid & Parathyroid" },
  "ADRENAL CORTEX": { c: "#791F1F", bg: "#FCEBEB", short: "Adrenal Cortex" },
  "ADRENAL MEDULLA": { c: "#5C2D75", bg: "#F0E6F5", short: "Adrenal Medulla" },
  "ENDOCRINE PANCREAS (ISLETS OF LANGERHANS)": { c: "#72243E", bg: "#FBEAF0", short: "Pancreas" },
  "REPRODUCTIVE ORGANS (TESTES & OVARIES)": { c: "#7A1F4A", bg: "#FCE8F0", short: "Reproductive" },
  "PLACENTA": { c: "#751F3C", bg: "#F5E6EB", short: "Placenta" },
  "GASTROINTESTINAL (GI) TRACT": { c: "#3C3489", bg: "#EDEAFB", short: "GI Tract" },
  "KIDNEYS, HEART, LIVER & OTHER TISSUES": { c: "#0F6E56", bg: "#E6F5EE", short: "Kidneys, Heart & Misc" },
};

function groupMeta(g) {
  return GROUP_META[g] || { c: "#444", bg: "#E8E8E8", short: g };
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
  const clean = text.replace(/\s+/g, " ").trim();
  const parts = clean.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  let keyCounter = 0;
  return parts.map(part => {
    if (!part) return null;
    const isBold = part.startsWith("**") && part.endsWith("**");
    const isItalic = !isBold && part.startsWith("*") && part.endsWith("*");
    const content = isBold ? part.slice(2, -2) : isItalic ? part.slice(1, -1) : part;
    const highlighted = highlightMatch(content, query);
    const k = keyCounter++;
    if (isBold) return <strong key={k} style={{ fontWeight: 600 }}>{highlighted}</strong>;
    if (isItalic) return <em key={k} style={{ fontStyle: "italic" }}>{highlighted}</em>;
    return <span key={k}>{highlighted}</span>;
  });
}

function stripMarkup(text) {
  return (text || "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/\s+/g, " ").trim();
}

function blockText(block) {
  return block.t !== "rule" ? (block.tx || "") : "";
}

function buildTree(blocks) {
  if (!blocks || !blocks.length) return [];
  const root = [];
  let depth2 = null;
  let depth3 = null;
  let depth4 = null;
  let orphanBox = null;
  const attachOrphan = (item) => {
    if (!orphanBox) {
      orphanBox = { kind: "sec", d: 3, label: "", items: [], children: [] };
      root.push(orphanBox);
    }
    orphanBox.items.push(item);
  };
  for (const b of blocks) {
    if (b.t === "rule") { orphanBox = null; continue; }
    if (b.t === "sub" || b.t === "sec") {
      const d = b.d || (b.t === "sec" ? 3 : 2);
      const node = { kind: b.t, d, label: b.tx, items: [], children: [] };
      if (d === 2) {
        root.push(node);
        depth2 = node; depth3 = null; depth4 = null;
      } else if (d === 3) {
        (depth2 || { children: root }).children.push(node);
        depth3 = node; depth4 = null;
      } else {
        (depth3 || depth2 || { children: root }).children.push(node);
        depth4 = node;
      }
      orphanBox = null;
      continue;
    }
    if (b.t === "item") {
      const target = depth4 || depth3 || depth2;
      if (target) target.items.push(b);
      else attachOrphan(b);
    }
  }
  return root;
}

function HormoneCard({ entry, query, group, onOpen }) {
  const meta = groupMeta(group || entry.group);
  const secTitles = entry.blocks.filter(b => b.t === "sec").map(b => stripMarkup(b.tx));
  const firstItem = entry.blocks.find(b => b.t === "item");
  const preview = firstItem ? stripMarkup(firstItem.tx) : "";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        borderTop: "1px solid var(--color-border-tertiary)",
        borderRight: "1px solid var(--color-border-tertiary)",
        borderBottom: "1px solid var(--color-border-tertiary)",
        borderLeft: `3px solid ${meta.c}`,
        borderRadius: 6,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onClick={() => onOpen(entry)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", fontFamily: "monospace", marginBottom: 3 }}>
          {meta.short} · {entry.group.split(" ")[0]}
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: "bold", color: "var(--color-text-primary)", marginBottom: 3, lineHeight: 1.3 }}>
        {highlightMatch(entry.name, query)}
      </div>
      <div style={{
        fontSize: 12, color: meta.c, marginBottom: 2,
        overflow: "hidden", textOverflow: "ellipsis",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        wordBreak: "break-word",
      }}>
        {highlightMatch(preview, query)}
      </div>
      <div style={{
        fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4, lineHeight: 1.4,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {secTitles.slice(0, 2).map(t => highlightMatch(t, query)).reduce((acc, el, i, arr) => acc.concat(i < arr.length - 1 ? el : []).concat(<span key={"s" + i} style={{ marginRight: 4 }}> · </span>), [])}
        {secTitles.length > 2 ? ` +${secTitles.length - 2} more` : ""}
      </div>
    </div>
  );
}

function HormoneModal({ entry, group, onClose }) {
  const meta = groupMeta(group || entry.group);
  const tree = useMemo(() => buildTree(entry.blocks || []), [entry]);

  const renderItems = (items) => items.map((b, i) => (
    <div key={i} style={{
      display: "flex", gap: 6, marginBottom: 4,
      marginLeft: Math.min(b.l || 0, 3) * 16,
    }}>
      {(b.l || 0) > 0 && (
        <span style={{ color: "var(--color-text-tertiary)", fontSize: 11, userSelect: "none", marginTop: 4, flexShrink: 0 }}>
          {(b.l || 0) === 1 ? "–" : "·"}
        </span>
      )}
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        {renderFormattedText(b.tx)}
      </div>
    </div>
  ));

  const renderNode = (node, key) => {
    if (node.kind === "sub") {
      const depth = node.d === 4;
      return (
        <div key={key} style={{
          marginBottom: 10, padding: `${depth ? 8 : 10}px 12px`, borderRadius: 8,
          borderLeft: `3px solid ${meta.c}`,
          background: depth ? "var(--color-background-secondary)" : meta.bg + "33",
        }}>
          <div style={{
            fontSize: depth ? 12.5 : 13.5, fontWeight: 700,
            color: meta.c, marginBottom: 6, lineHeight: 1.4,
          }}>
            {renderFormattedText(node.label)}
          </div>
          {node.items.length > 0 && renderItems(node.items)}
          {node.children.length > 0 && <div style={{ marginTop: 6 }}>{node.children.map((c, i) => renderNode(c, "c" + i))}</div>}
        </div>
      );
    }
    return (
      <div key={key} style={{
        marginBottom: 14, padding: 12, borderRadius: 8,
        background: "var(--color-background-secondary)",
        border: "1px solid var(--color-border-tertiary)",
      }}>
        {node.label && (
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1, color: meta.c, marginBottom: 6,
          }}>
            {renderFormattedText(node.label)}
          </div>
        )}
        {node.items.length > 0 && renderItems(node.items)}
        {node.children.length > 0 && (
          <div style={{ marginTop: node.items.length > 0 ? 8 : 0 }}>
            {node.children.map((c, i) => renderNode(c, "k" + i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "var(--color-background-primary)",
        borderRadius: "14px 14px 0 0", padding: "24px 24px 32px",
        width: "100%", maxWidth: 680, maxHeight: "82vh", overflowY: "auto",
        boxSizing: "border-box",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{
              display: "inline-block", fontSize: 11, padding: "2px 12px", borderRadius: 20,
              background: meta.bg, color: meta.c, marginBottom: 14, fontFamily: "monospace",
            }}>
              {meta.short} · {entry.group}
            </span>
            <div style={{ fontSize: 22, fontWeight: "bold", color: "var(--color-text-primary)", marginBottom: 12, lineHeight: 1.3 }}>
              {entry.name}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", borderTop: "none", borderRight: "none", borderLeft: "none",
            color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: 22, padding: "0 0 0 12px",
          }}>×</button>
        </div>

        {tree.length > 0 && tree.map((n, i) => renderNode(n, "n" + i))}
      </div>
    </div>
  );
}

export default function HormonesViewer({ data }) {
  const entries = data && data.length ? data : [];
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState(null);
  const [sel, setSel] = useState(null);

  const groups = useMemo(() => {
    const counts = {};
    for (const e of entries) {
      const g = e.group || "UNCATEGORIZED";
      counts[g] = (counts[g] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = entries;
    if (groupFilter) result = result.filter(e => (e.group || "UNCATEGORIZED") === groupFilter);
    if (!q) return result;
    return result.filter(e => {
      if (e.name && e.name.toLowerCase().includes(q)) return true;
      if (e.group && e.group.toLowerCase().includes(q)) return true;
      return (e.blocks || []).some(b => blockText(b).toLowerCase().includes(q));
    });
  }, [query, groupFilter, entries]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search hormones..."
        style={{
          boxSizing: "border-box", width: "100%", padding: "8px 12px",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)", fontSize: 14, outline: "none",
          marginBottom: "0.75rem",
          background: "var(--color-background-primary)", color: "var(--color-text-primary)",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "0.75rem" }}>
        {[{ g: null, label: `All (${entries.length})` }].concat(
          groups.map(([g, c]) => ({ g, label: `${groupMeta(g).short} (${c})` }))
        ).map(({ g, label }) => {
          const active = groupFilter === g;
          const meta = g ? groupMeta(g) : null;
          return (
            <button key={g || "all"} onClick={() => setGroupFilter(g)}
              style={{
                padding: "3px 10px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                border: active ? `1.5px solid ${meta ? meta.c : "var(--color-border-primary)"}` : "0.5px solid var(--color-border-tertiary)",
                background: active ? (meta ? meta.bg : "var(--color-background-secondary)") : "transparent",
                color: active ? (meta ? meta.c : "var(--color-text-primary)") : "var(--color-text-secondary)",
                fontWeight: active ? 600 : 400,
              }}>
              {label}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: "0.75rem" }}>
        {filtered.length} of {entries.length} hormones
      </p>

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14, padding: "2rem 0" }}>
          No hormones match your search.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
          {filtered.map(e => (
            <HormoneCard
              key={e.id ?? `${e.group}:${e.name}`}
              entry={e}
              query={query.trim().toLowerCase()}
              group={groupFilter}
              onOpen={setSel}
            />
          ))}
        </div>
      )}

      {sel && <HormoneModal entry={sel} group={groupFilter} onClose={() => setSel(null)} />}
    </div>
  );
}