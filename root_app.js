const {
  useState,
  useCallback,
  useEffect,
  useRef
} = React;

// \u2500\u2500 Dark mode style injection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('biochem-dark') === '1');
  useEffect(() => {
    document.body.style.background = dark ? '#0f0f0f' : '';
    localStorage.setItem('biochem-dark', dark ? '1' : '0');
  }, [dark]);
  return [dark, setDark];
}
const DK = {
  bg: d => d ? '#0f0f0f' : '#faf7f2',
  surface: d => d ? '#1a1a1a' : '#fff',
  border: d => d ? '#2a2a2a' : '#e8e2d9',
  text: d => d ? '#f0f0f0' : '#1a1a1a',
  sub: d => d ? '#999' : '#666',
  muted: d => d ? '#555' : '#999',
  hdr: d => d ? '#111' : '#1a1a1a',
  input: d => d ? '#222' : '#111',
  card: d => d ? '#1e1e1e' : '#fff',
  cardBdr: d => d ? '#2a2a2a' : '#e8e2d9'
};
const CAT_META = {
  A: {
    label: "Carbohydrate Metabolism",
    color: "#e07b39"
  },
  B: {
    label: "Glycogen Storage Diseases",
    color: "#c0392b"
  },
  C: {
    label: "Lipid Metabolism",
    color: "#8e44ad"
  },
  D: {
    label: "Amino Acid Metabolism",
    color: "#2980b9"
  },
  E: {
    label: "Urea Cycle Disorders",
    color: "#16a085"
  },
  F: {
    label: "Organic Acidemias",
    color: "#27ae60"
  },
  G: {
    label: "Purine & Pyrimidine",
    color: "#d35400"
  },
  H: {
    label: "Porphyrin & Heme",
    color: "#7f8c8d"
  },
  I: {
    label: "Hemoglobin & RBC",
    color: "#c0392b"
  },
  J: {
    label: "Vitamin Deficiencies",
    color: "#f39c12"
  },
  K: {
    label: "Minerals & Trace Elements",
    color: "#1abc9c"
  },
  L: {
    label: "Lysosomal Storage",
    color: "#6c3483"
  },
  M: {
    label: "Mucopolysaccharidoses",
    color: "#154360"
  },
  N: {
    label: "Miscellaneous / High-Yield",
    color: "#1a5276"
  },
  O: {
    label: "Toxic & Applied Biochemistry",
    color: "#922b21"
  }
};
const CAT_KEYS = Object.keys(CAT_META);
const FIELDS = [{
  key: "defect",
  label: "Enzyme / Defect"
}, {
  key: "pathway",
  label: "Pathway"
}, {
  key: "keyFeature",
  label: "Key Clinical Feature"
}, {
  key: "basis",
  label: "Biochemical Basis"
}, {
  key: "diagnosis",
  label: "Diagnosis"
}, {
  key: "treatment",
  label: "Treatment"
}];
function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function sanitizeData(obj) {
  if (typeof obj === 'string') return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').substring(0, 50000);
  if (Array.isArray(obj)) return obj.map(sanitizeData);
  if (obj && typeof obj === 'object') { const r = {}; for (const k of Object.keys(obj)) r[k] = sanitizeData(obj[k]); return r; }
  return obj;
}

// \u2500\u2500 GitHub API \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function ghFetch(owner, repo, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/data.json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${res.statusText}`);
  const json = await res.json();
  const data = JSON.parse(atob(json.content.replace(/\n/g, '')));
  return {
    data,
    sha: json.sha
  };
}
async function ghSave(owner, repo, token, sha, data, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/data.json`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(sanitizeData(data), null, 2))));
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content,
      sha
    })
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.message || `Save failed ${res.status}`);
  }
  const json = await res.json();
  return json.content.sha;
}
async function ghUploadImage(owner, repo, token, filename, base64data) {
  // Check if file already exists (to get its sha)
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/images/${filename}`;
  let sha;
  try {
    const check = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });
    if (check.ok) {
      const j = await check.json();
      sha = j.sha;
    }
  } catch (_) {}
  const body = {
    message: `Add image: ${filename}`,
    content: base64data
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.message || 'Image upload failed');
  }
  const json = await res.json();
  return json.content.download_url;
}

// \u2500\u2500 Image Lightbox \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function ImageLightbox({
  src,
  onClose
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({
    x: 0,
    y: 0
  });
  const lastTap = React.useRef(0);
  const lastDist = React.useRef(null);
  const dragging = React.useRef(false);
  const dragStart = React.useRef({
    x: 0,
    y: 0,
    px: 0,
    py: 0
  });
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      lastDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Double-tap: toggle zoom
        setScale(s => s > 1 ? 1 : 2.5);
        setPos({
          x: 0,
          y: 0
        });
      }
      lastTap.current = now;
      dragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        px: pos.x,
        py: pos.y
      };
    }
  }
  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 2 && lastDist.current !== null) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = dist / lastDist.current;
      setScale(s => Math.min(5, Math.max(1, s * delta)));
      lastDist.current = dist;
    } else if (e.touches.length === 1 && dragging.current && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setPos({
        x: dragStart.current.px + dx,
        y: dragStart.current.py + dy
      });
    }
  }
  function onTouchEnd() {
    dragging.current = false;
    lastDist.current = null;
  }
  return /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      if (scale <= 1) onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      touchAction: 'none'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      position: 'absolute',
      top: 16,
      right: 16,
      background: 'rgba(255,255,255,0.15)',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#fff',
      fontSize: 22,
      width: 40,
      height: 40,
      borderRadius: 20,
      cursor: 'pointer',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: 'rgba(255,255,255,0.4)',
      fontSize: 12,
      pointerEvents: 'none'
    }
  }, scale <= 1 ? 'Double-tap or pinch to zoom' : 'Double-tap to reset \u00B7 drag to pan'), /*#__PURE__*/React.createElement("img", {
    src: src,
    onTouchStart: onTouchStart,
    onTouchMove: onTouchMove,
    onTouchEnd: onTouchEnd,
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: '100%',
      maxHeight: '90vh',
      objectFit: 'contain',
      transform: `scale(${scale}) translate(${pos.x / scale}px,${pos.y / scale}px)`,
      transition: dragging.current ? 'none' : 'transform 0.2s ease',
      transformOrigin: 'center center',
      userSelect: 'none',
      WebkitUserSelect: 'none'
    },
    draggable: false,
    alt: "Disorder diagram"
  }));
}

// \u2500\u2500 GitHub API (Pathways) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function ghFetchPathways(owner, repo, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/pathways.json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });
  if (!res.ok) throw new Error(`GitHub error ${res.status}`);
  const json = await res.json();
  const data = JSON.parse(atob(json.content.replace(/\n/g, '')));
  return {
    data,
    sha: json.sha
  };
}
async function ghSavePathways(owner, repo, token, sha, data, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/pathways.json`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(sanitizeData(data), null, 2))));
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content,
      sha
    })
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.message || `Save failed ${res.status}`);
  }
  return (await res.json()).content.sha;
}
const BIO_CATS = [{
  key: "Carbohydrates",
  color: "#e07b39",
  icon: "\uD83C\uDF6B"
}, {
  key: "Lipids",
  color: "#8e44ad",
  icon: "\uD83E\uDDC8"
}, {
  key: "Amino Acids",
  color: "#2980b9",
  icon: "\uD83D\uDD24"
}, {
  key: "Nucleotides",
  color: "#d35400",
  icon: "\uD83E\uDDEC"
}, {
  key: "Heme",
  color: "#c0392b",
  icon: "\uD83E\uDE78"
}];

// \u2500\u2500 Pathway Step Viewer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function PathwayViewer({
  pathway,
  allDisorders,
  allPathways,
  onBack,
  onOpenDisorder,
  dark,
  darkToggle
}) {
  const [revealed, setRevealed] = useState(pathway.jumpToStep || 1);
  const [showAll, setShowAll] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState(null);
  const bottomRef = useRef(null);
  useEffect(() => {
    if (pathway.jumpToStep) setRevealed(pathway.jumpToStep);
  }, [pathway.id, pathway.jumpToStep]);
  const steps = pathway.steps || [];
  const total = steps.length;
  const visible = showAll ? total : revealed;
  const color = pathway.color || "#2980b9";
  function nextStep() {
    if (revealed < total) {
      setRevealed(r => r + 1);
      setTimeout(() => bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      }), 80);
    }
  }
  function reset() {
    setRevealed(1);
    setShowAll(false);
    setExpandedBranch(null);
  }
  const nodeStyle = {
    background: DK.card(dark),
    border: `2px solid ${color}`,
    borderRadius: 12,
    padding: '10px 18px',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    color: DK.text(dark),
    boxShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
    minWidth: 180,
    maxWidth: 280,
    margin: '0 auto'
  };
  const arrowCol = dark ? '#555' : '#888';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      color: '#fff',
      padding: '13px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 'bold'
    }
  }, pathway.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888'
    }
  }, pathway.biomolecule)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: '#888'
    }
  }, Math.min(visible, total), "/", total, " steps"), darkToggle), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      background: '#333',
      borderRadius: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      borderRadius: 2,
      background: color,
      width: `${Math.min(visible, total) / total * 100}%`,
      transition: 'width 0.3s'
    }
  }))), pathway.description && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      background: DK.surface(dark),
      borderBottom: `1px solid ${DK.border(dark)}`,
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, pathway.description), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '20px 16px 140px',
      overflowY: 'auto'
    }
  }, steps.slice(0, visible).map((step, idx) => {
    const isLast = idx === steps.length - 1;
    const branchKey = `${pathway.id}-${idx}`;
    const branchOpen = expandedBranch === branchKey;
    const hasDisorder = !!step.disorder;
    const linkedDis = hasDisorder ? allDisorders.find(d => d.id === step.disorder.disorderId) : null;
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: showAll || idx < visible ? 1 : 0,
        transition: 'opacity 0.4s'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        display: 'inline-block',
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...nodeStyle,
        borderColor: hasDisorder ? '#e67e22' : idx === 0 ? color : '#ddd',
        background: hasDisorder ? dark ? '#1a0f00' : '#fff8f0' : DK.card(dark),
        animation: !showAll && idx === visible - 1 ? 'fadeIn 0.4s ease' : 'none'
      }
    }, step.molecule)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 2,
        height: 10,
        background: arrowCol
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        background: dark ? '#252010' : '#f5f0e8',
        border: `1px solid ${dark ? '#3a3010' : '#e0d8cc'}`,
        borderRadius: 8,
        padding: '7px 12px',
        margin: '2px 0',
        width: '100%',
        boxSizing: 'border-box'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        color: DK.text(dark),
        marginBottom: step.cofactors ? 3 : 0
      }
    }, step.enzyme), step.cofactors && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: DK.sub(dark),
        fontStyle: 'italic'
      }
    }, step.cofactors), step.location && step.location !== 'Not specified' && step.energy && step.energy !== '0' && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginTop: 3,
        fontSize: 10,
        color: DK.muted(dark)
      }
    }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCD ", step.location), /*#__PURE__*/React.createElement("span", null, "\u26A1 ", step.energy)), step.location && step.location !== 'Not specified' && (step.energy === '0' || !step.energy) && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 10,
        color: DK.muted(dark)
      }
    }, "\uD83D\uDCCD ", step.location), step.energy && step.energy !== '0' && (!step.location || step.location === 'Not specified') && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 10,
        color: DK.muted(dark)
      }
    }, "\u26A1 ", step.energy), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: DK.muted(dark),
        marginTop: 2
      }
    }, step.reversible ? '\u21CC Reversible' : '\u2192 Irreversible'), step.activators && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#27ae60',
        fontWeight: 'bold'
      }
    }, "\uD83D\uDFE2 "), /*#__PURE__*/React.createElement("span", {
      style: {
        color: DK.sub(dark)
      }
    }, step.activators)), step.inhibitors && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        marginTop: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#c0392b',
        fontWeight: 'bold'
      }
    }, "\uD83D\uDD34 "), /*#__PURE__*/React.createElement("span", {
      style: {
        color: DK.sub(dark)
      }
    }, step.inhibitors)), hasDisorder && /*#__PURE__*/React.createElement("button", {
      onClick: () => setExpandedBranch(branchOpen ? null : branchKey),
      style: {
        marginTop: 6,
        padding: '4px 10px',
        borderRadius: 20,
        border: '1px solid #e67e22',
        background: branchOpen ? '#e67e22' : '#fff8f0',
        color: branchOpen ? '#fff' : '#e67e22',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif',
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, "\u26A0\uFE0F ", step.disorder.name, " ", branchOpen ? '\u25B2' : '\u25BC')), !isLast && /*#__PURE__*/React.createElement(React.Fragment, null, step.reversible && /*#__PURE__*/React.createElement("div", {
      style: {
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: `8px solid ${arrowCol}`
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 2,
        height: 10,
        background: arrowCol
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `8px solid ${arrowCol}`
      }
    })))), hasDisorder && branchOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        maxWidth: 400,
        margin: '4px auto 4px',
        background: dark ? '#1a1005' : '#fff8f0',
        border: '1px solid #e67e22',
        borderRadius: 10,
        padding: '12px 14px',
        animation: 'fadeIn 0.3s ease'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#e67e22',
        marginBottom: 8
      }
    }, "\u26A0\uFE0F If ", step.enzyme, " is deficient:"), (step.disorder.branch || []).map((b, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 12,
        color: DK.sub(dark),
        marginBottom: 4,
        paddingLeft: 8,
        borderLeft: '2px solid #f0b97d',
        lineHeight: 1.5
      }
    }, b)), linkedDis && /*#__PURE__*/React.createElement("button", {
      onClick: () => onOpenDisorder(linkedDis),
      style: {
        marginTop: 10,
        padding: '7px 14px',
        borderRadius: 6,
        border: '1px solid #e67e22',
        background: '#e67e22',
        color: '#fff',
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif',
        width: '100%'
      }
    }, "View ", linkedDis.disorder, " Card \u2192")));
  }), pathway.finalMolecule && visible >= total && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 2,
      height: 16,
      background: color
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...nodeStyle,
      borderColor: color,
      background: dark ? color + '33' : color + '18',
      color: color,
      fontWeight: 'bold'
    }
  }, "\uD83C\uDFC1 ", pathway.finalMolecule), (pathway.nextPathways || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: DK.muted(dark),
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8
    }
  }, "Continues into"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center'
    }
  }, (pathway.nextPathways || []).map(link => {
    const nid = link.id || link;
    const entryStep = link.entryStep || 1;
    const np = (allPathways || []).find(p => p.id === nid);
    if (!np) return null;
    const meta = BIO_CATS.find(b => b.key === np.biomolecule);
    return /*#__PURE__*/React.createElement("button", {
      key: nid,
      onClick: () => onBack({
        ...np,
        jumpToStep: entryStep
      }),
      style: {
        padding: '7px 14px',
        borderRadius: 20,
        border: `1px solid ${np.color || meta?.color || '#888'}`,
        background: dark ? (np.color || meta?.color || '#888') + '22' : (np.color || meta?.color || '#888') + '15',
        color: np.color || meta?.color || '#888',
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif'
      }
    }, meta?.icon, " ", np.name, " \u2192 Step ", entryStep);
  })))), /*#__PURE__*/React.createElement("div", {
    ref: bottomRef
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '12px 16px',
      background: dark ? 'rgba(15,15,15,0.97)' : 'rgba(250,247,242,0.97)',
      borderTop: `1px solid ${DK.border(dark)}`,
      display: 'flex',
      gap: 10,
      zIndex: 10
    }
  }, !showAll && visible < total ? /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    style: {
      flex: 2,
      padding: 13,
      borderRadius: 8,
      border: 'none',
      background: color,
      color: '#fff',
      fontSize: 15,
      fontFamily: 'Georgia,serif',
      cursor: 'pointer',
      fontWeight: 'bold'
    }
  }, "Next Step \u2193") : !showAll ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 2,
      padding: 13,
      borderRadius: 8,
      background: '#e8f5ee',
      color: '#2d8a4e',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      textAlign: 'center',
      fontWeight: 'bold'
    }
  }, "\u2705 Complete!") : null, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowAll(s => !s);
      if (!showAll) setRevealed(total);
    },
    style: {
      flex: 1,
      padding: 13,
      borderRadius: 8,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderLeft: `1px solid ${DK.border(dark)}`,
      background: DK.surface(dark),
      color: DK.sub(dark),
      fontSize: 13,
      fontFamily: 'Georgia,serif',
      cursor: 'pointer'
    }
  }, showAll ? 'Step by Step' : 'View All'), /*#__PURE__*/React.createElement("button", {
    onClick: reset,
    style: {
      padding: 13,
      borderRadius: 8,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderLeft: `1px solid ${DK.border(dark)}`,
      background: DK.surface(dark),
      color: DK.muted(dark),
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "\u21BA")), /*#__PURE__*/React.createElement("style", null, `@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`));
}

// \u2500\u2500 Pathway Browser \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function PathwayBrowser({
  pathways,
  allDisorders,
  onBack,
  onOpenDisorder,
  dark,
  darkToggle,
  initialPathway,
  onPathwayChange
}) {
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const [selPathway, setSelPathway] = useState(initialPathway || null);
  useEffect(() => {
    if (initialPathway) setSelPathway(initialPathway);
  }, [initialPathway]);
  useEffect(() => {
    onPathwayChange?.(selPathway);
  }, [selPathway]);
  if (selPathway) {
    return /*#__PURE__*/React.createElement(PathwayViewer, {
      key: selPathway.id,
      pathway: selPathway,
      allDisorders: allDisorders,
      allPathways: pathways,
      dark: dark,
      darkToggle: darkToggle,
      onBack: nextP => {
        if (nextP && nextP.id) {
          const jts = nextP.jumpToStep;
          setSelPathway(jts ? {
            ...nextP,
            jumpToStep: jts
          } : nextP);
        } else setSelPathway(null);
      },
      onOpenDisorder: d => {
        onOpenDisorder(d, selPathway);
        setSelPathway(null);
      }
    });
  }
  const cats = ['All', ...BIO_CATS.map(c => c.key)];
  const visible = pathways.filter(p => {
    if (activeCat !== 'All' && p.biomolecule !== activeCat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if ((p.name || '').toLowerCase().includes(q)) return true;
    if ((p.description || '').toLowerCase().includes(q)) return true;
    if ((p.biomolecule || '').toLowerCase().includes(q)) return true;
    return (p.steps || []).some(s => (s.molecule || '').toLowerCase().includes(q) || (s.enzyme || '').toLowerCase().includes(q) || (s.cofactors || '').toLowerCase().includes(q));
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      color: '#fff',
      padding: '14px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1
    }
  }, "Biochemical Pathways"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 20,
      background: '#333',
      color: '#aaa',
      fontFamily: 'monospace'
    }
  }, pathways.length), darkToggle), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search pathways\u2026",
    style: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: 8,
      border: '1px solid #444',
      background: '#222',
      color: '#faf7f2',
      fontSize: 13,
      fontFamily: 'Georgia,serif',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, cats.map(c => {
    const meta = BIO_CATS.find(b => b.key === c);
    const active = activeCat === c;
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      onClick: () => setActiveCat(c),
      style: {
        padding: '5px 12px',
        borderRadius: 20,
        border: `1px solid ${active ? meta?.color || '#e8c56a' : '#444'}`,
        background: active ? (meta?.color || '#e8c56a') + '22' : 'transparent',
        color: active ? meta?.color || '#e8c56a' : '#aaa',
        fontSize: 12,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'Georgia,serif',
        flexShrink: 0
      }
    }, meta?.icon, " ", c);
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '16px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
      gap: 12,
      alignContent: 'start'
    }
  }, visible.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: DK.muted(dark),
      padding: 40,
      textAlign: 'center',
      gridColumn: '1/-1'
    }
  }, "No pathways found."), visible.map(p => {
    const meta = BIO_CATS.find(b => b.key === p.biomolecule);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      onClick: () => setSelPathway(p),
      style: {
        background: DK.card(dark),
        borderTop: `1px solid ${DK.border(dark)}`,
        borderRight: `1px solid ${DK.border(dark)}`,
        borderBottom: `1px solid ${DK.border(dark)}`,
        borderLeft: `4px solid ${p.color || meta?.color || '#888'}`,
        borderRadius: 8,
        padding: '14px 16px',
        cursor: 'pointer',
        boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: DK.muted(dark),
        marginBottom: 4
      }
    }, meta?.icon, " ", p.biomolecule, " \xB7 ", p.steps?.length || 0, " steps"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 'bold',
        color: DK.text(dark),
        marginBottom: 4
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: DK.sub(dark),
        lineHeight: 1.5
      }
    }, p.description));
  })));
}

// \u2500\u2500 Admin Panel Pathways Tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function PathwayStepForm({
  step,
  onSave,
  onCancel,
  allDisorders
}) {
  const [form, setForm] = useState(step || {
    stepNum: '',
    molecule: '',
    enzyme: '',
    cofactors: '',
    reversible: false,
    inhibitors: '',
    activators: '',
    disorder: null
  });
  const [hasDisorder, setHasDisorder] = useState(!!step?.disorder);
  const [branch, setBranch] = useState((step?.disorder?.branch || []).join('\n'));
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const inp = {
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 13,
    fontFamily: 'Georgia,serif',
    marginBottom: 4,
    boxSizing: 'border-box',
    outline: 'none'
  };
  const area = {
    ...inp,
    minHeight: 60,
    resize: 'vertical'
  };
  const lbl = {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    display: 'block',
    fontFamily: 'Georgia,serif'
  };
  function save() {
    if (!form.molecule.trim()) {
      alert('Molecule name required');
      return;
    }
    const disorder = hasDisorder ? {
      name: form.disorder?.name || '',
      disorderId: form.disorder?.disorderId || null,
      branch: branch.split('\n').map(s => s.trim()).filter(Boolean)
    } : null;
    onSave({
      ...form,
      inhibitors: form.inhibitors || '',
      activators: form.activators || '',
      disorder
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 130,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 18,
      maxWidth: 520,
      margin: '16px auto',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 15,
      fontFamily: 'Georgia,serif'
    }
  }, "Edit Step"), /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      fontSize: 22,
      cursor: 'pointer',
      color: '#aaa'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Step Number"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.stepNum,
    onChange: e => set('stepNum', e.target.value),
    placeholder: "1"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Molecule Name *"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.molecule,
    onChange: e => set('molecule', e.target.value),
    placeholder: "Glucose"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Enzyme"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.enzyme || '',
    onChange: e => set('enzyme', e.target.value),
    placeholder: "Hexokinase"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Cofactors"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.cofactors || '',
    onChange: e => set('cofactors', e.target.value),
    placeholder: "ATP \u2192 ADP"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "\uD83D\uDFE2 Activators"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.activators || '',
    onChange: e => set('activators', e.target.value),
    placeholder: "AMP, ADP, Pi"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "\uD83D\uDD34 Inhibitors"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.inhibitors || '',
    onChange: e => set('inhibitors', e.target.value),
    placeholder: "ATP, Citrate"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...lbl,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.reversible || false,
    onChange: e => set('reversible', e.target.checked)
  }), "Reversible step"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 12,
      background: '#fff8f0',
      borderRadius: 8,
      border: '1px solid #f0d0b0'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...lbl,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: hasDisorder,
    onChange: e => setHasDisorder(e.target.checked)
  }), "Link a disorder to this step"), hasDisorder && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Disorder Name"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.disorder?.name || '',
    onChange: e => set('disorder', {
      ...form.disorder,
      name: e.target.value
    }),
    placeholder: "e.g. Tarui Disease"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Link to Disorder Card"), /*#__PURE__*/React.createElement("select", {
    style: inp,
    value: form.disorder?.disorderId || '',
    onChange: e => set('disorder', {
      ...form.disorder,
      disorderId: Number(e.target.value) || null
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 None \u2014"), allDisorders.map(d => /*#__PURE__*/React.createElement("option", {
    key: d.id,
    value: d.id
  }, "#", d.num, " ", d.disorder))), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Branch effects (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: branch,
    onChange: e => setBranch(e.target.value),
    placeholder: "\u2191 Substrate accumulates\n\u2192 Clinical effect"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    style: {
      flex: 1,
      padding: 10,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#555',
      fontSize: 13,
      fontFamily: 'Georgia,serif',
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    style: {
      flex: 2,
      padding: 10,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#1a1a1a',
      color: '#fff',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      cursor: 'pointer'
    }
  }, "\uD83D\uDCBE Save Step"))));
}
function PathwayAdminPanel({
  config,
  pathways,
  onPathwaysChange
}) {
  const [sha, setSha] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({
    text: '',
    ok: true
  });
  const [selPathway, setSelPathway] = useState(null);
  const [editStep, setEditStep] = useState(null);
  const [addingPath, setAddingPath] = useState(false);
  const [addPathId, setAddPathId] = useState(0);
  const [addEntryStep, setAddEntryStep] = useState(1);
  const [newPathForm, setNewPathForm] = useState({
    name: '',
    biomolecule: 'Carbohydrates',
    color: '#e07b39',
    description: ''
  });
  useEffect(() => {
    ghFetchPathways(config.owner, config.repo, config.token).then(({
      sha
    }) => setSha(sha)).catch(() => {});
  }, []);
  async function persist(newData, commitMsg) {
    setSaving(true);
    try {
      const newSha = await ghSavePathways(config.owner, config.repo, config.token, sha, newData, commitMsg);
      setSha(newSha);
      onPathwaysChange(newData);
      setMsg({
        text: '\u2705 Saved!',
        ok: true
      });
    } catch (e) {
      setMsg({
        text: '\u274C ' + e.message,
        ok: false
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({
        text: '',
        ok: true
      }), 4000);
    }
  }
  function addPathway() {
    if (!newPathForm.name.trim()) {
      alert('Pathway name required');
      return;
    }
    const p = {
      id: Date.now(),
      ...newPathForm,
      steps: [],
      finalMolecule: ''
    };
    persist([...pathways, p], `Add pathway: ${p.name}`);
    setAddingPath(false);
    setNewPathForm({
      name: '',
      biomolecule: 'Carbohydrates',
      color: '#e07b39',
      description: ''
    });
  }
  function deletePathway(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    persist(pathways.filter(x => x.id !== p.id), `Delete pathway: ${p.name}`);
    if (selPathway?.id === p.id) setSelPathway(null);
  }
  function saveStep(form) {
    const updated = selPathway.steps.map(s => s.stepNum === editStep.stepNum ? form : s);
    const newPath = {
      ...selPathway,
      steps: updated
    };
    const newData = pathways.map(p => p.id === selPathway.id ? newPath : p);
    setSelPathway(newPath);
    persist(newData, `Edit step ${form.stepNum} in ${selPathway.name}`);
    setEditStep(null);
  }
  function addStep() {
    const newStep = {
      stepNum: (selPathway.steps?.length || 0) + 1,
      molecule: 'New Molecule',
      enzyme: '',
      cofactors: '',
      reversible: false,
      disorder: null
    };
    const newPath = {
      ...selPathway,
      steps: [...(selPathway.steps || []), newStep]
    };
    const newData = pathways.map(p => p.id === selPathway.id ? newPath : p);
    setSelPathway(newPath);
    persist(newData, `Add step to ${selPathway.name}`);
  }
  function deleteStep(stepNum) {
    if (!window.confirm('Delete this step?')) return;
    const newSteps = selPathway.steps.filter(s => s.stepNum !== stepNum).map((s, i) => ({
      ...s,
      stepNum: i + 1
    }));
    const newPath = {
      ...selPathway,
      steps: newSteps
    };
    const newData = pathways.map(p => p.id === selPathway.id ? newPath : p);
    setSelPathway(newPath);
    persist(newData, `Delete step from ${selPathway.name}`);
  }
  function updateFinalMolecule(val) {
    const newPath = {
      ...selPathway,
      finalMolecule: val
    };
    const newData = pathways.map(p => p.id === selPathway.id ? newPath : p);
    setSelPathway(newPath);
    persist(newData, `Update final molecule in ${selPathway.name}`);
  }
  const inp = {
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 13,
    fontFamily: 'Georgia,serif',
    marginBottom: 8,
    boxSizing: 'border-box',
    outline: 'none'
  };
  const lbl = {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
    display: 'block',
    fontFamily: 'Georgia,serif'
  };

  // Pathway list view
  if (!selPathway) return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
  }, (saving || msg.text) && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px',
      background: msg.ok ? '#e8f5ee' : '#fdf0f0',
      color: msg.ok ? '#2d8a4e' : '#c0392b',
      fontSize: 12,
      marginBottom: 8,
      borderRadius: 6,
      textAlign: 'center'
    }
  }, saving ? '\u23F3 Saving\u2026' : msg.text), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddingPath(true),
    style: {
      width: '100%',
      padding: 11,
      borderRadius: 8,
      border: '2px dashed #ccc',
      background: '#fafafa',
      color: '#888',
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      marginBottom: 12
    }
  }, "\u2795 Add New Pathway"), addingPath && /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
      border: '1px solid #ddd'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Pathway Name"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: newPathForm.name,
    onChange: e => setNewPathForm(f => ({
      ...f,
      name: e.target.value
    })),
    placeholder: "e.g. Glycolysis"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Biomolecule Category"), /*#__PURE__*/React.createElement("select", {
    style: inp,
    value: newPathForm.biomolecule,
    onChange: e => setNewPathForm(f => ({
      ...f,
      biomolecule: e.target.value
    }))
  }, BIO_CATS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.key,
    value: c.key
  }, c.icon, " ", c.key))), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Color"), /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: newPathForm.color,
    onChange: e => setNewPathForm(f => ({
      ...f,
      color: e.target.value
    })),
    style: {
      marginBottom: 8,
      height: 36,
      width: '100%',
      cursor: 'pointer',
      borderRadius: 6,
      border: '1px solid #ddd'
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Description"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: newPathForm.description,
    onChange: e => setNewPathForm(f => ({
      ...f,
      description: e.target.value
    })),
    placeholder: "Brief description\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAddingPath(false),
    style: {
      flex: 1,
      padding: 9,
      borderRadius: 6,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#555',
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: addPathway,
    style: {
      flex: 2,
      padding: 9,
      borderRadius: 6,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#1a1a1a',
      color: '#fff',
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "Add Pathway"))), pathways.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      background: '#fff',
      borderRadius: 8,
      padding: '11px 13px',
      marginBottom: 8,
      borderLeft: `3px solid ${p.color || '#888'}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#aaa',
      marginBottom: 2
    }
  }, p.biomolecule, " \xB7 ", p.steps?.length || 0, " steps"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1a1a1a'
    }
  }, p.name)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelPathway(p),
    style: {
      padding: '5px 12px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "Edit Steps"), /*#__PURE__*/React.createElement("button", {
    onClick: () => deletePathway(p),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1"))), pathways.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#bbb',
      textAlign: 'center',
      padding: 30
    }
  }, "No pathways yet."));

  // Step editor view
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelPathway(null),
    style: {
      marginBottom: 12,
      padding: '6px 14px',
      borderRadius: 6,
      border: '1px solid #ccc',
      background: '#fff',
      color: '#555',
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\u2190 Back to Pathways"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 4
    }
  }, selPathway.name), (saving || msg.text) && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px',
      background: msg.ok ? '#e8f5ee' : '#fdf0f0',
      color: msg.ok ? '#2d8a4e' : '#c0392b',
      fontSize: 12,
      marginBottom: 8,
      borderRadius: 6,
      textAlign: 'center'
    }
  }, saving ? '\u23F3 Saving\u2026' : msg.text), (selPathway.steps || []).map((step, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: '#fff',
      borderRadius: 8,
      padding: '10px 13px',
      marginBottom: 8,
      border: '1px solid #e8e2d9',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#aaa',
      marginBottom: 2
    }
  }, "Step ", step.stepNum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1a1a1a'
    }
  }, step.molecule), step.enzyme && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#666'
    }
  }, step.enzyme), step.disorder && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#e67e22',
      marginTop: 2
    }
  }, "\u26A0\uFE0F ", step.disorder.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditStep(step),
    style: {
      padding: '4px 10px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteStep(step.stepNum),
    style: {
      padding: '4px 10px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1")))), /*#__PURE__*/React.createElement("button", {
    onClick: addStep,
    style: {
      width: '100%',
      padding: 10,
      borderRadius: 8,
      border: '2px dashed #ccc',
      background: '#fafafa',
      color: '#888',
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      marginBottom: 12
    }
  }, "\u2795 Add Step"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 8,
      padding: 12,
      border: '1px solid #e8e2d9'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Final Product (end of pathway)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inp,
      marginBottom: 0
    },
    value: selPathway.finalMolecule || '',
    onBlur: e => updateFinalMolecule(e.target.value),
    onChange: e => setSelPathway(p => ({
      ...p,
      finalMolecule: e.target.value
    })),
    placeholder: "e.g. Pyruvate (\xD72)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 8,
      padding: 12,
      border: '1px solid #e8e2d9',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "\uD83D\uDD17 Final Product Links To (Next Pathways)"), (selPathway.nextPathways || []).map((link, idx) => {
    const lid = link.id || link;
    const entryStep = link.entryStep || 1;
    const np = pathways.find(p => p.id === lid);
    if (!np) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: lid,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #e0e0e0',
        marginBottom: 6,
        background: '#fafafa'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: '#333'
      }
    }, np.name, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#999'
      }
    }, "(Step ", entryStep, ")")), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        const newNext = (selPathway.nextPathways || []).filter((_, i) => i !== idx);
        const newPath = {
          ...selPathway,
          nextPathways: newNext
        };
        const newData = pathways.map(p => p.id === selPathway.id ? newPath : p);
        setSelPathway(newPath);
        persist(newData, `Remove next pathway link in ${selPathway.name}`);
      },
      style: {
        padding: '3px 10px',
        borderRadius: 5,
        border: '1px solid #c0392b',
        background: '#fdf0f0',
        color: '#c0392b',
        fontSize: 12,
        cursor: 'pointer'
      }
    }, "Remove"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("select", {
    defaultValue: "",
    onChange: e => {
      setAddPathId(Number(e.target.value));
    },
    style: {
      ...inp,
      marginBottom: 0,
      flex: 2,
      color: '#555'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2795 Add a pathway link\u2026"), pathways.filter(p => p.id !== selPathway.id && !(selPathway.nextPathways || []).some(l => (l.id || l) === p.id)).map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      ...lbl,
      marginBottom: 2
    }
  }, "Entry Step"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    value: addEntryStep,
    onChange: e => setAddEntryStep(Math.max(1, Number(e.target.value))),
    style: {
      ...inp,
      marginBottom: 0,
      padding: '6px 8px',
      textAlign: 'center'
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const nid = addPathId;
      if (!nid) return;
      if ((selPathway.nextPathways || []).some(l => (l.id || l) === nid)) return;
      const newNext = [...(selPathway.nextPathways || []), {
        id: nid,
        entryStep: addEntryStep
      }];
      const newPath = {
        ...selPathway,
        nextPathways: newNext
      };
      const newData = pathways.map(p => p.id === selPathway.id ? newPath : p);
      setSelPathway(newPath);
      persist(newData, `Add next pathway link in ${selPathway.name}`);
      setAddPathId(0);
      setAddEntryStep(1);
    },
    style: {
      padding: '8px 14px',
      borderRadius: 6,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#1a1a1a',
      color: '#fff',
      fontSize: 13,
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, "Add"))), editStep && /*#__PURE__*/React.createElement(PathwayStepForm, {
    step: editStep,
    onSave: saveStep,
    onCancel: () => setEditStep(null),
    allDisorders: config.allDisorders || []
  }));
}

// \u2500\u2500 Admin Login \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function AdminLogin({
  onLogin,
  onClose,
  allData
}) {
  const [owner, setOwner] = useState(sessionStorage.getItem('gh_owner') || '');
  const [repo, setRepo] = useState(sessionStorage.getItem('gh_repo') || '');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  React.useEffect(() => { if (cooldown <= 0) return; const t = setTimeout(() => setCooldown(c => c - 1), 1000); return () => clearTimeout(t); }, [cooldown]);
  async function handleLogin() {
    if (!owner || !repo || !token) {
      setError('All three fields are required.');
      return;
    }
    if (cooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const {
        data,
        sha
      } = await ghFetch(owner, repo, token);
      sessionStorage.setItem('gh_owner', owner);
      sessionStorage.setItem('gh_repo', repo);
      setAttempts(0);
      onLogin({
        owner,
        repo,
        token,
        sha,
        data
      });
    } catch (e) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setCooldown(30);
        setAttempts(0);
        setError('Too many failed attempts. Please wait 30 seconds.');
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }
  const inp = {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14,
    fontFamily: 'Georgia,serif',
    marginBottom: 12,
    boxSizing: 'border-box',
    outline: 'none'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 14,
      padding: 28,
      width: '100%',
      maxWidth: 400,
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 18,
      fontFamily: 'Georgia,serif'
    }
  }, "\uD83D\uDD12 Admin Login"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      fontSize: 24,
      cursor: 'pointer',
      color: '#aaa',
      lineHeight: 1
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      color: '#888',
      fontFamily: 'Georgia,serif',
      marginBottom: 4,
      display: 'block'
    }
  }, "GitHub Username"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: owner,
    onChange: e => setOwner(e.target.value),
    placeholder: "your-username",
    autoCapitalize: "none",
    spellCheck: "false"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      color: '#888',
      fontFamily: 'Georgia,serif',
      marginBottom: 4,
      display: 'block'
    }
  }, "Repository Name"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: repo,
    onChange: e => setRepo(e.target.value),
    placeholder: "my-widget",
    autoCapitalize: "none",
    spellCheck: "false"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      color: '#888',
      fontFamily: 'Georgia,serif',
      marginBottom: 4,
      display: 'block'
    }
  }, "Personal Access Token"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    type: "password",
    value: token,
    onChange: e => setToken(e.target.value),
    placeholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
    autoCapitalize: "none",
    spellCheck: "false"
  }), error && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#c0392b',
      fontSize: 13,
      marginBottom: 12,
      padding: '8px 12px',
      background: '#fdf0f0',
      borderRadius: 6,
      lineHeight: 1.5
    }
  }, error), /*#__PURE__*/React.createElement("button", {
    onClick: handleLogin,
    disabled: loading || cooldown > 0,
    style: {
      width: '100%',
      padding: 13,
      borderRadius: 8,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: (loading || cooldown > 0) ? '#bbb' : '#1a1a1a',
      color: '#fff',
      fontSize: 15,
      fontFamily: 'Georgia,serif',
      cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer',
      marginBottom: 12
    }
  }, cooldown > 0 ? `Wait ${cooldown}s\u2026` : loading ? 'Connecting\u2026' : 'Connect & Login'), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: '#bbb',
      margin: 0,
      textAlign: 'center',
      lineHeight: 1.6
    }
  }, "Token needs ", /*#__PURE__*/React.createElement("strong", null, "Contents: Read & Write"), ".", /*#__PURE__*/React.createElement("br", null), "Never stored permanently \u2014 clears when you close the browser.")));
}

// \u2500\u2500 Edit / Add Form \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function EditForm({
  disorder,
  onSave,
  onCancel,
  adminConfig
}) {
  const isNew = !disorder;
  const [form, setForm] = useState(isNew ? {
    id: Date.now(),
    cat: 'A',
    num: '',
    disorder: '',
    defect: '',
    pathway: '',
    keyFeature: '',
    basis: '',
    diagnosis: '',
    treatment: '',
    imageUrl: ''
  } : {
    ...disorder,
    imageUrl: disorder.imageUrl || ''
  });
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImgError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImgError('Image must be under 5 MB.');
      return;
    }
    setImgUploading(true);
    setImgError('');
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = () => rej(new Error('Read failed'));
        r.readAsDataURL(file);
      });
      const ext = file.name.split('.').pop();
      const filename = `${form.id || Date.now()}.${ext}`;
      const url = await ghUploadImage(adminConfig.owner, adminConfig.repo, adminConfig.token, filename, base64);
      set('imageUrl', url);
    } catch (err) {
      setImgError(err.message);
    } finally {
      setImgUploading(false);
    }
  }
  const inp = {
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 13,
    fontFamily: 'Georgia,serif',
    marginBottom: 4,
    boxSizing: 'border-box',
    outline: 'none'
  };
  const area = {
    ...inp,
    minHeight: 68,
    resize: 'vertical'
  };
  const lbl = {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    display: 'block',
    fontFamily: 'Georgia,serif'
  };
  function handleSave() {
    if (!form.disorder.trim()) {
      alert('Disorder name is required.');
      return;
    }
    const numVal = isNaN(Number(form.num)) || form.num === '' ? form.num : Number(form.num);
    onSave({
      ...form,
      num: numVal
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 115,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 560,
      margin: '16px auto',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontFamily: 'Georgia,serif'
    }
  }, isNew ? '\u2795 Add Disorder' : '\u00E2\u0153\u008F\u00EF\u00B8\u008F Edit Disorder'), /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      fontSize: 24,
      cursor: 'pointer',
      color: '#aaa'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Category"), /*#__PURE__*/React.createElement("select", {
    value: form.cat,
    onChange: e => set('cat', e.target.value),
    style: inp
  }, CAT_KEYS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c, " \u2014 ", CAT_META[c].label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Number / Code"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.num,
    onChange: e => set('num', e.target.value),
    placeholder: "1 or D+"
  }))), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Disorder Name *"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inp,
      marginBottom: 12,
      fontSize: 14
    },
    value: form.disorder,
    onChange: e => set('disorder', e.target.value),
    placeholder: "e.g. Diabetes Mellitus"
  }), FIELDS.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.key,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, f.label), /*#__PURE__*/React.createElement("textarea", {
    style: area,
    value: form[f.key] || '',
    onChange: e => set(f.key, e.target.value),
    placeholder: `Enter ${f.label.toLowerCase()}\u2026`
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12,
      padding: '14px',
      background: '#f8f8f8',
      borderRadius: 8,
      border: '1px dashed #ddd'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "\uD83D\uDCF7 Diagram / Image"), form.imageUrl ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: form.imageUrl,
    alt: "preview",
    style: {
      width: '100%',
      maxHeight: 160,
      objectFit: 'contain',
      borderRadius: 6,
      background: '#fff',
      border: '1px solid #eee'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => set('imageUrl', ''),
    style: {
      marginTop: 6,
      padding: '4px 12px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\uD83D\uDDD1 Remove image")) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      padding: '9px 12px',
      borderRadius: 6,
      border: '1px solid #ccc',
      background: '#fff',
      color: '#555',
      fontSize: 13,
      cursor: 'pointer',
      textAlign: 'center',
      fontFamily: 'Georgia,serif'
    }
  }, imgUploading ? '\u00E2\u008F\u00B3 Uploading\u2026' : '\u00F0\u0178\u201C\u0081 Choose file', /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: handleImageUpload,
    style: {
      display: 'none'
    },
    disabled: imgUploading
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 11,
      color: '#bbb'
    }
  }, "\u2014 or paste a URL \u2014"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inp,
      marginBottom: 0
    },
    value: form.imageUrl || '',
    onChange: e => set('imageUrl', e.target.value),
    placeholder: "https://\u2026",
    autoCapitalize: "none"
  })), imgError && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#c0392b',
      fontSize: 12,
      marginTop: 6
    }
  }, imgError)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#555',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSave,
    style: {
      flex: 2,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#1a1a1a',
      color: '#fff',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      cursor: 'pointer'
    }
  }, isNew ? '\u2795 Add Disorder' : '\uD83D\uDCBE Save Changes'))));
}

// \u2500\u2500 Admin Panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function AdminPanel({
  config,
  allData,
  onDataChange,
  pathways,
  onPathwaysChange,
  vitamins,
  onVitaminsChange,
  normalValues,
  onNormalValuesChange,
  minerals,
  onMineralsChange,
  vignettes,
  onVignettesChange,
  cases,
  onCasesChange,
  visibility,
  onVisibilityChange,
  physioViva,
  onPhysioVivaChange,
  physioReflexDetails,
  onPhysioReflexDetailsChange,
  physioNotes,
  onPhysioNotesChange,
  physioClinical,
  onPhysioClinicalChange,
  onLogout
}) {
  const [adminCat, setAdminCat] = useState('biochem');
  const [tab, setTab] = useState('disorders');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sha, setSha] = useState(config.sha);
  const [msg, setMsg] = useState({
    text: '',
    ok: true
  });
  const [vitEditing, setVitEditing] = useState(null);
  const [vitDel, setVitDel] = useState(null);
  const [vitSaving, setVitSaving] = useState(false);
  const [vitMsg, setVitMsg] = useState({
    text: '',
    ok: true
  });
  const [vitSha, setVitSha] = useState(null);
  const [nvSaving, setNvSaving] = useState(false);
  const [nvMsg, setNvMsg] = useState({
    text: '',
    ok: true
  });
  const [nvSha, setNvSha] = useState(null);
  const [nvEditSec, setNvEditSec] = useState(null);
  const [nvEditEnt, setNvEditEnt] = useState(null);
  const [nvForm, setNvForm] = useState({
    id: '',
    name: '',
    icon: '\uD83D\uDCCB'
  });
  const [nvEntForm, setNvEntForm] = useState({
    name: '',
    abbr: '',
    sample: '',
    range: '',
    unit: '',
    si: '',
    siUnit: '',
    note: ''
  });
  const [minSaving, setMinSaving] = useState(false);
  const [minMsg, setMinMsg] = useState({ text: '', ok: true });
  const [minSha, setMinSha] = useState(null);
  const [minEditing, setMinEditing] = useState(null);
  const [minDel, setMinDel] = useState(null);
  const [vigSaving, setVigSaving] = useState(false);
  const [vigMsg, setVigMsg] = useState({ text: '', ok: true });
  const [vigSha, setVigSha] = useState(null);
  const [vigEditing, setVigEditing] = useState(null);
  const [vigDel, setVigDel] = useState(null);
  const [caseSaving, setCaseSaving] = useState(false);
  const [caseMsg, setCaseMsg] = useState({ text: '', ok: true });
  const [caseSha, setCaseSha] = useState(null);
  const [caseEditing, setCaseEditing] = useState(null);
  const [caseDel, setCaseDel] = useState(null);
  const [visSaving, setVisSaving] = useState(false);
  const [visMsg, setVisMsg] = useState({ text: '', ok: true });
  const [visSha, setVisSha] = useState(null);
  const [minForm, setMinForm] = useState({ name: '', alias: '', type: 'macromineral', coenzyme: '', defName: '', toxicity: '', normalRange: '', mnemonic: '', important: false });
  const [vigForm, setVigForm] = useState({ title: '', presentation: '', diagnosis: '', disorderId: '' });
  const [caseForm, setCaseForm] = useState({ stem: '', question: '', optA: '', optB: '', optC: '', optD: '', answer: 'A', explanation: '', difficulty: 'easy', tags: '', disorderId: '' });
const [pVivaForm, setPVivaForm] = useState({ cat: '', name: '', def: '' });
  const [pVivaEditing, setPVivaEditing] = useState(null);
  const [pVivaDel, setPVivaDel] = useState(null);
  const [pRefDetEditing, setPRefDetEditing] = useState(null);
  const [pRefDetDel, setPRefDetDel] = useState(null);
  const pVivaMgr = useDataManager('physio/viva.json', onPhysioVivaChange);
  const pRefDetMgr = useDataManager('physio/reflex_details.json', onPhysioReflexDetailsChange);
  const pNoteMgr = useDataManager('physio/notes.json', onPhysioNotesChange);
  const pClinMgr = useDataManager('physio/clinical.json', onPhysioClinicalChange);
  const [pRefDetForm, setPRefDetForm] = useState({ name: '', sys: '', receptor: '', center: '', nucleus: '', stimulus: '', response: '', purpose: '' });
  const [pNoteForm, setPNoteForm] = useState({ name: '', sections: [] });
  const [pClinForm, setPClinForm] = useState({ name: '', tab: '', sections: [] });
  function useDataManager(fileName, onChange) {
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', ok: true });
    const [sha, setSha] = useState(null);
    const [editing, setEditing] = useState(null);
    const [del, setDel] = useState(null);
    const loadSha = React.useCallback(async () => {
      try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${fileName}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${config.token}`, Accept: "application/vnd.github+json" } });
        if (res.ok) { const json = await res.json(); setSha(json.sha); }
      } catch (e) {}
    }, [config.owner, config.repo, config.token, fileName]);
    const persist = React.useCallback(async (newData, commitMsg) => {
      setSaving(true);
      try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${fileName}`;
        const clean = sanitizeData(newData);
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(clean, null, 2))));
        const body = { message: commitMsg, content };
        if (sha) body.sha = sha;
        const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${config.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Save failed ${res.status}`); }
        const json = await res.json();
        setSha(json.content.sha);
        onChange(newData);
        setMsg({ text: '\u2705 Saved!', ok: true });
      } catch (e) { setMsg({ text: '\u274C ' + e.message, ok: false }); }
      finally { setSaving(false); setTimeout(() => setMsg({ text: '', ok: true }), 4000); }
    }, [config.owner, config.repo, config.token, fileName, sha, onChange]);
    return { saving, msg, setMsg, sha, editing, setEditing, del, setDel, persist, loadSha };
  }
  function makeSave(mgr, data, editing, setEditing, getId) { return form => { let nd; if (editing === 'new') { const mx = data.reduce((m,v)=>Math.max(m,v.id),0); nd = [...data, {...form, id: mx+1}]; } else { nd = data.map(v => v.id === form.id ? form : v); } mgr.persist(nd, `${editing === 'new' ? 'Add' : 'Edit'}: ${getId(form)}`); setEditing(null); }; }
  function makeDelete(mgr, data, del, setDel, getId) { return () => { const nd = data.filter(v => v.id !== del.id); mgr.persist(nd, `Delete: ${getId(del)}`); setDel(null); }; }
  const enrichedConfig = {
    ...config,
    allDisorders: allData
  };
  const filteredVitamins = vitamins.filter(v => {
    const q = search.toLowerCase();
    return !q || (v.name || '').toLowerCase().includes(q) || (v.alias || '').toLowerCase().includes(q) || (v.coenzyme || '').toLowerCase().includes(q) || (v.deficiency?.name || '').toLowerCase().includes(q);
  });
  const filtered = allData.filter(d => {
    const q = search.toLowerCase();
    return !q || (d.disorder || '').toLowerCase().includes(q) || (d.defect || '').toLowerCase().includes(q) || (CAT_META[d.cat]?.label || '').toLowerCase().includes(q);
  });
  const filteredMinerals = minerals.filter(v => {
    const q = search.toLowerCase();
    return !q || (v.name || '').toLowerCase().includes(q) || (v.alias || '').toLowerCase().includes(q) || (v.coenzyme || '').toLowerCase().includes(q) || (v.deficiency?.name || '').toLowerCase().includes(q);
  });
  const filteredVignettes = vignettes.filter(v => {
    const q = search.toLowerCase();
    return !q || (v.title || '').toLowerCase().includes(q) || (v.diagnosis || '').toLowerCase().includes(q);
  });
  const filteredCases = cases.filter(v => {
    const q = search.toLowerCase();
    return !q || (v.stem || '').toLowerCase().includes(q) || (v.question || '').toLowerCase().includes(q) || (v.explanation || '').toLowerCase().includes(q);
  });
  async function persist(newData, commitMsg) {
    setSaving(true);
    try {
      const newSha = await ghSave(config.owner, config.repo, config.token, sha, newData, commitMsg);
      setSha(newSha);
      onDataChange(newData);
      setMsg({
        text: '\u2705 Saved! Site will update in ~30 seconds.',
        ok: true
      });
    } catch (e) {
      setMsg({
        text: '\u274C ' + e.message,
        ok: false
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({
        text: '',
        ok: true
      }), 5000);
    }
  }
  async function persistVitamins(newData, commitMsg) {
    setVitSaving(true);
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/vitamins.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
      const body = {
        message: commitMsg,
        content
      };
      if (vitSha) body.sha = vitSha;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || `Save failed ${res.status}`);
      }
      const json = await res.json();
      setVitSha(json.content.sha);
      onVitaminsChange(newData);
      setVitMsg({
        text: '\u2705 Saved! Site will update in ~30 seconds.',
        ok: true
      });
    } catch (e) {
      setVitMsg({
        text: '\u274C ' + e.message,
        ok: false
      });
    } finally {
      setVitSaving(false);
      setTimeout(() => setVitMsg({
        text: '',
        ok: true
      }), 5000);
    }
  }
  async function loadVitaminsSha() {
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/vitamins.json`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setVitSha(json.sha);
      }
    } catch (e) {}
  }
  async function loadNormalValsSha() {
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/normal_values.json`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setNvSha(json.sha);
      }
    } catch (e) {}
  }
  async function loadMineralsSha() {
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/minerals.json`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setMinSha(json.sha);
      }
    } catch (e) {}
  }
  async function loadVignettesSha() {
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/vignettes.json`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setVigSha(json.sha);
      }
    } catch (e) {}
  }
  async function loadCasesSha() {
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/cases.json`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setCaseSha(json.sha);
      }
    } catch (e) {}
  }
  async function loadVisibilitySha() {
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/visibility.json`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setVisSha(json.sha);
      }
    } catch (e) {}
  }
  async function persistNormalVals(newData, commitMsg) {
    setNvSaving(true);
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/normal_values.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
      const body = {
        message: commitMsg,
        content
      };
      if (nvSha) body.sha = nvSha;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || `Save failed ${res.status}`);
      }
      const json = await res.json();
      setNvSha(json.content.sha);
      onNormalValuesChange(newData);
      setNvMsg({
        text: '\u2705 Saved!',
        ok: true
      });
    } catch (e) {
      setNvMsg({
        text: '\u274C ' + e.message,
        ok: false
      });
    } finally {
      setNvSaving(false);
      setTimeout(() => setNvMsg({
        text: '',
        ok: true
      }), 4000);
    }
  }
  async function persistMinerals(newData, commitMsg) {
    setMinSaving(true);
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/minerals.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
      const body = { message: commitMsg, content };
      if (minSha) body.sha = minSha;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || `Save failed ${res.status}`);
      }
      const json = await res.json();
      setMinSha(json.content.sha);
      onMineralsChange(newData);
      setMinMsg({ text: '\u2705 Saved!', ok: true });
    } catch (e) {
      setMinMsg({ text: '\u274C ' + e.message, ok: false });
    } finally {
      setMinSaving(false);
      setTimeout(() => setMinMsg({ text: '', ok: true }), 4000);
    }
  }
  async function persistVignettes(newData, commitMsg) {
    setVigSaving(true);
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/vignettes.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
      const body = { message: commitMsg, content };
      if (vigSha) body.sha = vigSha;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || `Save failed ${res.status}`);
      }
      const json = await res.json();
      setVigSha(json.content.sha);
      onVignettesChange(newData);
      setVigMsg({ text: '\u2705 Saved!', ok: true });
    } catch (e) {
      setVigMsg({ text: '\u274C ' + e.message, ok: false });
    } finally {
      setVigSaving(false);
      setTimeout(() => setVigMsg({ text: '', ok: true }), 4000);
    }
  }
  async function persistCases(newData, commitMsg) {
    setCaseSaving(true);
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/cases.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
      const body = { message: commitMsg, content };
      if (caseSha) body.sha = caseSha;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || `Save failed ${res.status}`);
      }
      const json = await res.json();
      setCaseSha(json.content.sha);
      onCasesChange(newData);
      setCaseMsg({ text: '\u2705 Saved!', ok: true });
    } catch (e) {
      setCaseMsg({ text: '\u274C ' + e.message, ok: false });
    } finally {
      setCaseSaving(false);
      setTimeout(() => setCaseMsg({ text: '', ok: true }), 4000);
    }
  }
  async function persistVisibility(newData, commitMsg) {
    setVisSaving(true);
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/visibility.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
      const body = { message: commitMsg, content };
      if (visSha) body.sha = visSha;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || `Save failed ${res.status}`);
      }
      const json = await res.json();
      setVisSha(json.content.sha);
      onVisibilityChange(newData);
      setVisMsg({ text: '\u2705 Saved!', ok: true });
    } catch (e) {
      setVisMsg({ text: '\u274C ' + e.message, ok: false });
    } finally {
      setVisSaving(false);
      setTimeout(() => setVisMsg({ text: '', ok: true }), 4000);
    }
  }
  useEffect(() => {
    loadVitaminsSha();
    loadNormalValsSha();
    loadMineralsSha();
    loadVignettesSha();
    loadCasesSha();
    loadVisibilitySha();
    pVivaMgr.loadSha();
    pRefDetMgr.loadSha();
    pNoteMgr.loadSha();
    pClinMgr.loadSha();
  }, []);
  useEffect(() => {
    if (nvEditSec && typeof nvEditSec === 'object') setNvForm({
      id: nvEditSec.id || '',
      name: nvEditSec.name || '',
      icon: nvEditSec.icon || '\uD83D\uDCCB'
    });else if (nvEditSec === 'new') setNvForm({
      id: '',
      name: '',
      icon: '\uD83D\uDCCB'
    });
  }, [nvEditSec]);
  useEffect(() => {
    if (nvEditEnt && nvEditEnt.entry) setNvEntForm({
      ...nvEditEnt.entry
    });else if (nvEditEnt && !nvEditEnt.entry) setNvEntForm({
      name: '',
      abbr: '',
      sample: '',
      range: '',
      unit: '',
      si: '',
      siUnit: '',
      note: ''
    });
  }, [nvEditEnt]);
  useEffect(() => {
    if (minEditing && minEditing !== 'new') setMinForm({ name: minEditing.name || '', alias: minEditing.alias || '', type: minEditing.type || 'macromineral', coenzyme: minEditing.coenzyme || '', defName: (minEditing.deficiency && minEditing.deficiency.name) || '', toxicity: minEditing.toxicity || '', normalRange: minEditing.normalRange || '', mnemonic: minEditing.mnemonic || '', important: minEditing.important || false });else if (minEditing === 'new') setMinForm({ name: '', alias: '', type: 'macromineral', coenzyme: '', defName: '', toxicity: '', normalRange: '', mnemonic: '', important: false });
  }, [minEditing]);
  useEffect(() => {
    if (vigEditing && vigEditing !== 'new') setVigForm({ title: vigEditing.title || '', presentation: vigEditing.presentation || '', diagnosis: vigEditing.diagnosis || '', disorderId: vigEditing.disorderId || '' });else if (vigEditing === 'new') setVigForm({ title: '', presentation: '', diagnosis: '', disorderId: '' });
  }, [vigEditing]);
  useEffect(() => {
    if (caseEditing && caseEditing !== 'new') {
      const opts = caseEditing.options || [];
      setCaseForm({ stem: caseEditing.stem || '', question: caseEditing.question || '', optA: opts[0]?.text || '', optB: opts[1]?.text || '', optC: opts[2]?.text || '', optD: opts[3]?.text || '', answer: caseEditing.answer || 'A', explanation: caseEditing.explanation || '', difficulty: caseEditing.difficulty || 'easy', tags: Array.isArray(caseEditing.tags) ? caseEditing.tags.join(', ') : (caseEditing.tags || ''), disorderId: caseEditing.disorderId || '' });
    } else if (caseEditing === 'new') setCaseForm({ stem: '', question: '', optA: '', optB: '', optC: '', optD: '', answer: 'A', explanation: '', difficulty: 'easy', tags: '', disorderId: '' });
  }, [caseEditing]);
  function handleSave(form) {
    let newData;
    if (editing === 'new') {
      newData = [...allData, form];
      persist(newData, `Add: ${form.disorder}`);
    } else {
      newData = allData.map(d => d.id === form.id ? form : d);
      persist(newData, `Edit: ${form.disorder}`);
    }
    setEditing(null);
  }
  function handleDelete() {
    const newData = allData.filter(d => d.id !== deleting.id);
    persist(newData, `Delete: ${deleting.disorder}`);
    setDeleting(null);
  }
  function handleVitSave(form) {
    let newData;
    if (vitEditing === 'new') {
      const maxId = vitamins.reduce((m, v) => Math.max(m, v.id), 0);
      newData = [...vitamins, {
        ...form,
        id: maxId + 1
      }];
      persistVitamins(newData, `Add: ${form.name}`);
    } else {
      newData = vitamins.map(v => v.id === form.id ? form : v);
      persistVitamins(newData, `Edit: ${form.name}`);
    }
    setVitEditing(null);
  }
  function handleVitDelete() {
    const newData = vitamins.filter(v => v.id !== vitDel.id);
    persistVitamins(newData, `Delete: ${vitDel.name}`);
    setVitDel(null);
  }
  function handleMinSave(form) {
    let newData;
    if (minEditing === 'new') {
      const maxId = minerals.reduce((m, v) => Math.max(m, v.id), 0);
      newData = [...minerals, { ...form, id: maxId + 1 }];
      persistMinerals(newData, `Add: ${form.name}`);
    } else {
      newData = minerals.map(v => v.id === form.id ? form : v);
      persistMinerals(newData, `Edit: ${form.name}`);
    }
    setMinEditing(null);
  }
  function handleMinDelete() {
    const newData = minerals.filter(v => v.id !== minDel.id);
    persistMinerals(newData, `Delete: ${minDel.name}`);
    setMinDel(null);
  }
  function handleVigSave(form) {
    let newData;
    if (vigEditing === 'new') {
      const maxId = vignettes.reduce((m, v) => Math.max(m, v.id), 0);
      newData = [...vignettes, { ...form, id: maxId + 1 }];
      persistVignettes(newData, `Add: ${form.title}`);
    } else {
      newData = vignettes.map(v => v.id === form.id ? form : v);
      persistVignettes(newData, `Edit: ${form.title}`);
    }
    setVigEditing(null);
  }
  function handleVigDelete() {
    const newData = vignettes.filter(v => v.id !== vigDel.id);
    persistVignettes(newData, `Delete: ${vigDel.title}`);
    setVigDel(null);
  }
  function handleCaseSave(form) {
    let newData;
    if (caseEditing === 'new') {
      const maxId = cases.reduce((m, v) => Math.max(m, v.id), 0);
      newData = [...cases, { ...form, id: maxId + 1 }];
      persistCases(newData, `Add: case #${maxId + 1}`);
    } else {
      newData = cases.map(v => v.id === form.id ? form : v);
      persistCases(newData, `Edit: case #${form.id}`);
    }
    setCaseEditing(null);
  }
  function handleCaseDelete() {
    const newData = cases.filter(v => v.id !== caseDel.id);
    persistCases(newData, `Delete: case #${caseDel.id}`);
    setCaseDel(null);
  }
  const handlePVivaSave = makeSave(pVivaMgr, physioViva, pVivaEditing, setPVivaEditing, f => f.name);
  const handlePVivaDelete = makeDelete(pVivaMgr, physioViva, pVivaDel, setPVivaDel, v => v.name);
  const handlePRefDetSave = makeSave(pRefDetMgr, physioReflexDetails, pRefDetEditing, setPRefDetEditing, f => f.name);
  const handlePRefDetDelete = makeDelete(pRefDetMgr, physioReflexDetails, pRefDetDel, setPRefDetDel, v => v.name);
  const [pNoteEditing, setPNoteEditing] = useState(null);
  const [pNoteDel, setPNoteDel] = useState(null);
  const [pClinEditing, setPClinEditing] = useState(null);
  const [pClinDel, setPClinDel] = useState(null);
  function handlePNoteSave(form) {
  let nd;
  const secArr = form.sections || [];
  const sec = Object.fromEntries(secArr.filter(s => s.key).map(s => [s.key, { type: 'text', text: s.value }]));
  if (pNoteEditing === 'new') { const mx = physioNotes.reduce((m,v) => Math.max(m, v.id), 0); nd = [...physioNotes, {...form, id: mx+1, sections: sec}]; pNoteMgr.persist(nd, `Add: ${form.name}`); }
  else { nd = physioNotes.map(v => v.id === form.id ? {...v, ...form, sections: sec} : v); pNoteMgr.persist(nd, `Edit: ${form.name}`); }
  setPNoteEditing(null);
}
function handlePNoteDelete() { const nd = physioNotes.filter(v => v.id !== pNoteDel.id); pNoteMgr.persist(nd, `Delete: ${pNoteDel.name}`); setPNoteDel(null); }
function handlePClinSave(form) {
  let nd;
  const secArr = form.sections || [];
  const sec = Object.fromEntries(secArr.filter(s => s.key).map(s => [s.key, s.value]));
  if (pClinEditing === 'new') { const mx = physioClinical.reduce((m,v) => Math.max(m, v.id), 0); nd = [...physioClinical, {...form, id: mx+1, sections: sec}]; pClinMgr.persist(nd, `Add: ${form.name}`); }
  else { nd = physioClinical.map(v => v.id === form.id ? {...v, ...form, sections: sec} : v); pClinMgr.persist(nd, `Edit: ${form.name}`); }
  setPClinEditing(null);
}
function handlePClinDelete() { const nd = physioClinical.filter(v => v.id !== pClinDel.id); pClinMgr.persist(nd, `Delete: ${pClinDel.name}`); setPClinDel(null); }
  const cc = cat => CAT_META[cat]?.color || '#666';
  const inp = { display: 'block', width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, fontFamily: 'Georgia,serif', marginBottom: 8, boxSizing: 'border-box', outline: 'none' };
  const lbl = { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3, display: 'block', fontFamily: 'Georgia,serif' };
  function PhysioTabContent({ label, data, onEdit, onDelete }) {
    const filtered = data.filter(v => { const q = search.toLowerCase(); return !q || (v.name || '').toLowerCase().includes(q) || (v.description || v.def || '').toLowerCase().includes(q); });
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: { padding: '10px 14px', background: '#fff', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }
    }, /*#__PURE__*/React.createElement("input", {
      value: search,
      onChange: e => setSearch(e.target.value),
      placeholder: 'Search ' + label + '\u2026',
      style: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, fontFamily: 'Georgia,serif', boxSizing: 'border-box', outline: 'none' }
    })), /*#__PURE__*/React.createElement("div", {
      style: { flex: 1, overflowY: 'auto', padding: '10px 14px 60px' }
    }, filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: { color: '#bbb', textAlign: 'center', padding: 40 }
    }, 'No ' + label + ' found.'), filtered.map(v => /*#__PURE__*/React.createElement("div", {
      key: v.id,
      style: { background: '#fff', borderRadius: 8, padding: '11px 13px', marginBottom: 8, borderLeft: '3px solid #9b59b6', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
    }, /*#__PURE__*/React.createElement("div", {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }
    }, /*#__PURE__*/React.createElement("div", {
      style: { flex: 1, minWidth: 0 }
    }, /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 }
    }, v.name), /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
    }, v.description || v.def || v.tab || v.sys || v.cat || Object.values(v).filter(x => typeof x === 'string' && x !== v.name && !['id','sys','receptor','center','nucleus','stimulus','response','purpose','cat','tab','def','sections'].includes(x)).join(', ') || '')), /*#__PURE__*/React.createElement("div", {
      style: { display: 'flex', gap: 5, flexShrink: 0, marginLeft: 8 }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => onEdit(v),
      style: { padding: '5px 11px', borderRadius: 5, border: '1px solid #2980b9', background: '#eaf4fb', color: '#2980b9', fontSize: 12, cursor: 'pointer' }
    }, '\u270F\uFE0F'), /*#__PURE__*/React.createElement("button", {
      onClick: () => onDelete(v),
      style: { padding: '5px 11px', borderRadius: 5, border: '1px solid #c0392b', background: '#fdf0f0', color: '#c0392b', fontSize: 12, cursor: 'pointer' }
      }, '\uD83D\uDDD1')))))));
  }
  function PhysioEditModal({ editing, setEditing, form, setForm, onSave, label }) {
    if (!editing) return null;
    const isNew = editing === 'new';
    const fields = Object.keys(form).filter(k => k !== 'id');
    return /*#__PURE__*/React.createElement("div", {
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
    }, /*#__PURE__*/React.createElement("div", {
      style: { background: '#fff', borderRadius: 12, padding: 18, maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'Georgia,serif' }
    }, /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 15, fontWeight: 'bold', marginBottom: 14 }
    }, isNew ? 'Add ' + label : 'Edit ' + label), fields.map(k => /*#__PURE__*/React.createElement(React.Fragment, { key: k }, /*#__PURE__*/React.createElement("label", { style: lbl }, k.charAt(0).toUpperCase() + k.slice(1)), k === 'sections' && Array.isArray(form[k]) ? /*#__PURE__*/React.createElement("div", null, form[k].map((item, i) => /*#__PURE__*/React.createElement("div", { key: i, style: { marginBottom: 10, padding: 8, border: '1px solid #eee', borderRadius: 6 } }, /*#__PURE__*/React.createElement("div", { style: { display: 'flex', gap: 6, marginBottom: 4 } }, /*#__PURE__*/React.createElement("input", { style: { ...inp, marginBottom: 0, flex: 1 }, placeholder: "Section heading", value: item.key, onChange: e => { const s = [...form[k]]; s[i] = { ...s[i], key: e.target.value }; setForm(f => ({ ...f, [k]: s })); } }), /*#__PURE__*/React.createElement("button", { style: { padding: '4px 10px', border: '1px solid #c0392b', background: '#fdf0f0', color: '#c0392b', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia,serif' }, onClick: () => { const s = [...form[k]]; s.splice(i, 1); setForm(f => ({ ...f, [k]: s })); } }, '\u2715')), /*#__PURE__*/React.createElement("textarea", { style: { ...inp, minHeight: 80, resize: 'vertical' }, value: item.value, onChange: e => { const s = [...form[k]]; s[i] = { ...s[i], value: e.target.value }; setForm(f => ({ ...f, [k]: s })); } }))), /*#__PURE__*/React.createElement("button", { style: { padding: '6px 14px', border: '1px dashed #2980b9', background: '#eaf4fb', color: '#2980b9', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia,serif' }, onClick: () => setForm(f => ({ ...f, [k]: [...f[k], { key: '', value: '' }] })) }, '+ Add Section')) : /sections|content|description/.test(k) && (typeof form[k] === 'string' && form[k].length > 80 || k === 'sections') ? /*#__PURE__*/React.createElement("textarea", {
      style: { ...inp, minHeight: ['sections','content'].includes(k) ? 100 : 50, resize: 'vertical', fontFamily: ['sections','content'].includes(k) ? 'monospace' : 'Georgia,serif' }, value: form[k],
      onChange: e => setForm(f => ({ ...f, [k]: e.target.value }))
    }) : /*#__PURE__*/React.createElement("input", {
      style: inp, value: form[k],
      onChange: e => setForm(f => ({ ...f, [k]: e.target.value }))
    }))), /*#__PURE__*/React.createElement("div", {
      style: { display: 'flex', gap: 10, marginTop: 14 }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setEditing(null),
      style: { flex: 1, padding: 11, borderRadius: 7, border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia,serif' }
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      onClick: () => onSave(form),
      style: { flex: 2, padding: 11, borderRadius: 7, borderTop: 'none', borderRight: 'none', borderLeft: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia,serif' }
    }, isNew ? '\u2795 Add ' + label : '\uD83D\uDCBE Save'))));
  }
  function PhysioDelModal({ del, setDel, onConfirm, label }) {
    if (!del) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
    }, /*#__PURE__*/React.createElement("div", {
      style: { background: '#fff', borderRadius: 12, padding: 26, maxWidth: 340, width: '100%', textAlign: 'center', fontFamily: 'Georgia,serif' }
    }, /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 }
    }, 'Delete ' + del.name + '?'), /*#__PURE__*/React.createElement("div", {
      style: { display: 'flex', gap: 10 }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDel(null),
      style: { flex: 1, padding: 11, borderRadius: 7, border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer' }
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      onClick: onConfirm,
      style: { flex: 1, padding: 11, borderRadius: 7, border: 'none', background: '#c0392b', color: '#fff', fontSize: 14, cursor: 'pointer' }
    }, "Delete"))));
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: '#f0f0f0',
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#1a1a1a',
      color: '#fff',
      padding: '13px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1
    }
  }, "\u2699\uFE0F Admin Panel"), (tab === 'disorders' || tab === 'vitamins' || tab === 'normal-values' || tab === 'minerals' || tab === 'vignettes' || tab === 'cases' || tab === 'physio-viva' || tab === 'physio-reflex-detail' || tab === 'physio-notes' || tab === 'physio-clinical') && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (tab === 'disorders') setEditing('new');else if (tab === 'vitamins') setVitEditing('new');else if (tab === 'minerals') setMinEditing('new');else if (tab === 'vignettes') setVigEditing('new');else if (tab === 'cases') setCaseEditing('new');else if (tab === 'normal-values') setNvEditSec('new');else if (tab === 'physio-viva') setPVivaEditing('new');else if (tab === 'physio-reflex-detail') setPRefDetEditing('new');else if (tab === 'physio-notes') setPNoteEditing('new');else if (tab === 'physio-clinical') setPClinEditing('new');
    },
    style: {
      padding: '7px 14px',
      borderRadius: 6,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#4caf7d',
      color: '#fff',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "\u2795 Add"), /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    style: {
      padding: '7px 14px',
      borderRadius: 6,
      border: '1px solid #444',
      background: 'transparent',
      color: '#aaa',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "Logout")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      background: '#1a1a1a',
      flexShrink: 0,
      borderBottom: '1px solid #333'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdminCat('biochem'),
    style: {
      flex: 1,
      padding: '8px 0',
      border: 'none',
      background: adminCat === 'biochem' ? '#333' : 'transparent',
      color: adminCat === 'biochem' ? '#fff' : '#888',
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      fontWeight: adminCat === 'biochem' ? 'bold' : 'normal'
    }
  }, "\uD83E\uDDEC Biochemistry"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdminCat('physiology'),
    style: {
      flex: 1,
      padding: '8px 0',
      border: 'none',
      background: adminCat === 'physiology' ? '#333' : 'transparent',
      color: adminCat === 'physiology' ? '#fff' : '#888',
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      fontWeight: adminCat === 'physiology' ? 'bold' : 'normal'
    }
  }, "\uD83E\uDDE0 Physiology")), adminCat === 'biochem' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      background: '#111',
      flexShrink: 0
    }
  }, ['disorders', 'pathways', 'vitamins', 'normal-values', 'minerals', 'vignettes', 'cases', 'visibility'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => { setTab(t); setSearch(''); },
    style: {
      flex: 1,
      padding: '10px 0',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: tab === t ? '#222' : 'transparent',
      color: tab === t ? '#fff' : '#666',
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      borderBottom: tab === t ? '2px solid #e8c56a' : '2px solid transparent',
      textTransform: 'capitalize'
    }
  }, t === 'disorders' ? '\uD83E\uDDEC Disorders' : t === 'pathways' ? '\uD83D\uDD2C Pathways' : t === 'vitamins' ? '\uD83D\uDC8A Vitamins' : t === 'normal-values' ? '\uD83C\uDF4E Normals' : t === 'minerals' ? '\u26A1 Minerals' : t === 'vignettes' ? '\uD83D\uDCCB Vignettes' : t === 'cases' ? '\uD83D\uDCDD Cases' : '\uD83D\uDD27 Visibility'))), adminCat === 'physiology' && /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', background: '#111', flexShrink: 0 }
  }, ['physio-viva', 'physio-reflex-detail', 'physio-notes', 'physio-clinical'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => { setTab(t); setSearch(''); },
    style: {
      flex: 1,
      padding: '10px 0',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: tab === t ? '#222' : 'transparent',
      color: tab === t ? '#fff' : '#666',
      fontSize: 12,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      borderBottom: tab === t ? '2px solid #e8c56a' : '2px solid transparent',
      textTransform: 'capitalize'
    }
  }, t === 'physio-viva' ? '\uD83D\uDD03 Viva' : t === 'physio-reflex-detail' ? '\uD83D\uDCA1 RxDetail' : t === 'physio-notes' ? '\uD83D\uDCDD Notes' : '\uD83D\uDCC4 Clinical'))), (tab === 'disorders' && (saving || msg.text)) || (tab === 'vitamins' && (vitSaving || vitMsg.text)) || (tab === 'normal-values' && (nvSaving || nvMsg.text)) || (tab === 'minerals' && (minSaving || minMsg.text)) || (tab === 'vignettes' && (vigSaving || vigMsg.text)) || (tab === 'cases' && (caseSaving || caseMsg.text)) || (tab === 'visibility' && (visSaving || visMsg.text)) || (tab === 'physio-viva' && (pVivaMgr.saving || pVivaMgr.msg.text)) || (tab === 'physio-reflex-detail' && (pRefDetMgr.saving || pRefDetMgr.msg.text)) || (tab === 'physio-notes' && (pNoteMgr.saving || pNoteMgr.msg.text)) || (tab === 'physio-clinical' && (pClinMgr.saving || pClinMgr.msg.text)) ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '9px 16px',
      background: tab === 'vitamins' && vitSaving || tab === 'disorders' && saving || tab === 'minerals' && minSaving || tab === 'vignettes' && vigSaving || tab === 'cases' && caseSaving || tab === 'visibility' && visSaving || tab === 'physio-viva' && pVivaMgr.saving || tab === 'physio-reflex-detail' && pRefDetMgr.saving || tab === 'physio-notes' && pNoteMgr.saving || tab === 'physio-clinical' && pClinMgr.saving ? '#fff8e1' : (tab === 'vitamins' ? vitMsg.ok : tab === 'minerals' ? minMsg.ok : tab === 'vignettes' ? vigMsg.ok : tab === 'cases' ? caseMsg.ok : tab === 'visibility' ? visMsg.ok : tab === 'physio-viva' ? pVivaMgr.msg.ok : tab === 'physio-reflex-detail' ? pRefDetMgr.msg.ok : tab === 'physio-notes' ? pNoteMgr.msg.ok : tab === 'physio-clinical' ? pClinMgr.msg.ok : msg.ok) ? '#e8f5ee' : '#fdf0f0',
      color: tab === 'vitamins' && vitSaving || tab === 'disorders' && saving || tab === 'minerals' && minSaving || tab === 'vignettes' && vigSaving || tab === 'cases' && caseSaving || tab === 'visibility' && visSaving || tab === 'physio-viva' && pVivaMgr.saving || tab === 'physio-reflex-detail' && pRefDetMgr.saving || tab === 'physio-notes' && pNoteMgr.saving || tab === 'physio-clinical' && pClinMgr.saving ? '#856404' : (tab === 'vitamins' ? vitMsg.ok : tab === 'minerals' ? minMsg.ok : tab === 'vignettes' ? vigMsg.ok : tab === 'cases' ? caseMsg.ok : tab === 'visibility' ? visMsg.ok : tab === 'physio-viva' ? pVivaMgr.msg.ok : tab === 'physio-reflex-detail' ? pRefDetMgr.msg.ok : tab === 'physio-notes' ? pNoteMgr.msg.ok : tab === 'physio-clinical' ? pClinMgr.msg.ok : msg.ok) ? '#2d8a4e' : '#c0392b',
      fontSize: 13,
      textAlign: 'center',
      flexShrink: 0
    }
  }, tab === 'vitamins' ? vitSaving ? '\u23F3 Saving\u2026' : vitMsg.text : tab === 'normal-values' ? nvSaving ? '\u23F3 Saving\u2026' : nvMsg.text : tab === 'minerals' ? minSaving ? '\u23F3 Saving\u2026' : minMsg.text : tab === 'vignettes' ? vigSaving ? '\u23F3 Saving\u2026' : vigMsg.text : tab === 'cases' ? caseSaving ? '\u23F3 Saving\u2026' : caseMsg.text : tab === 'visibility' ? visSaving ? '\u23F3 Saving\u2026' : visMsg.text : tab === 'physio-viva' ? pVivaMgr.saving ? '\u23F3 Saving\u2026' : pVivaMgr.msg.text : tab === 'physio-reflex-detail' ? pRefDetMgr.saving ? '\u23F3 Saving\u2026' : pRefDetMgr.msg.text : tab === 'physio-notes' ? pNoteMgr.saving ? '\u23F3 Saving\u2026' : pNoteMgr.msg.text : tab === 'physio-clinical' ? pClinMgr.saving ? '\u23F3 Saving\u2026' : pClinMgr.msg.text : saving ? '\u23F3 Saving\u2026' : msg.text) : null, tab === 'disorders' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search disorders\u2026",
    style: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid #ddd',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      boxSizing: 'border-box',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
  }, filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#bbb',
      textAlign: 'center',
      padding: 40
    }
  }, "No results."), filtered.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.id,
    style: {
      background: d.important ? '#fffde7' : '#fff',
      borderRadius: 8,
      padding: '11px 13px',
      marginBottom: 8,
      borderLeft: `3px solid ${d.important ? '#f1c40f' : cc(d.cat)}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#aaa',
      marginBottom: 2
    }
  }, "#", d.num, " \xB7 ", CAT_META[d.cat]?.label, d.important ? ' \u00B7 \u00E2\u00AD\u0090 Important' : ''), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, d.disorder), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, d.defect)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const newData = allData.map(x => x.id === d.id ? {
        ...x,
        important: !x.important
      } : x);
      persist(newData, `${d.important ? 'Unmark' : 'Mark'} important: ${d.disorder}`);
    },
    title: d.important ? "Remove important tag" : "Mark as important",
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: `1px solid ${d.important ? '#f1c40f' : '#ccc'}`,
      background: d.important ? '#fffde7' : '#fafafa',
      color: d.important ? '#d4a017' : '#aaa',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "\u2B50"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditing(d),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDeleting(d),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1")))))), tab === 'pathways' && /*#__PURE__*/React.createElement(PathwayAdminPanel, {
    config: enrichedConfig,
    pathways: pathways,
    onPathwaysChange: onPathwaysChange
  }), tab === 'vitamins' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search vitamins\u2026",
    style: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid #ddd',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      boxSizing: 'border-box',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
  }, filteredVitamins.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#bbb',
      textAlign: 'center',
      padding: 40
    }
  }, "No results."), filteredVitamins.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    style: {
      background: v.important ? '#fffde7' : '#fff',
      borderRadius: 8,
      padding: '11px 13px',
      marginBottom: 8,
      borderLeft: `3px solid ${v.important ? '#f1c40f' : v.type === 'fat-soluble' ? '#e67e22' : '#27ae60'}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#aaa',
      marginBottom: 2
    }
  }, "#", v.id, " \xB7 ", v.name, " (", v.alias, ") \xB7 ", v.type, v.important ? ' \u00B7 \u00E2\u00AD\u0090 Important' : ''), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 2
    }
  }, v.coenzyme), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, (v.enzymes || []).join(', ')), v.deficiency && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#c0392b',
      marginTop: 2
    }
  }, "\u26A0\uFE0F ", v.deficiency.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const newData = vitamins.map(x => x.id === v.id ? {
        ...x,
        important: !x.important
      } : x);
      persistVitamins(newData, `${v.important ? 'Unmark' : 'Mark'} important: ${v.name}`);
    },
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: `1px solid ${v.important ? '#f1c40f' : '#ccc'}`,
      background: v.important ? '#fffde7' : '#fafafa',
      color: v.important ? '#d4a017' : '#aaa',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "\u2B50"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setVitEditing(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setVitDel(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1"))))), editing && /*#__PURE__*/React.createElement(EditForm, {
    disorder: editing === 'new' ? null : editing,
    onSave: handleSave,
    onCancel: () => setEditing(null),
    adminConfig: config
  }), deleting && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 26,
      maxWidth: 340,
      width: '100%',
      textAlign: 'center',
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83D\uDDD1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8
    }
  }, "Delete Disorder?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#666',
      marginBottom: 20,
      lineHeight: 1.5
    }
  }, "\"", /*#__PURE__*/React.createElement("strong", null, deleting.disorder), "\" will be permanently removed from the live site."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDeleting(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleDelete,
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#c0392b',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
    }, "Delete"))))), tab === 'normal-values' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
   }, (nvSaving || nvMsg.text) && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px',
      background: nvMsg.ok ? '#e8f5ee' : '#fdf0f0',
      color: nvMsg.ok ? '#2d8a4e' : '#c0392b',
      fontSize: 12,
      marginBottom: 8,
      borderRadius: 6,
      textAlign: 'center'
    }
  }, nvSaving ? '\u23F3 Saving\u2026' : nvMsg.text), normalValues.map((sec, si) => /*#__PURE__*/React.createElement("div", {
    key: sec.id,
    style: {
      background: '#fff',
      borderRadius: 8,
      marginBottom: 10,
      border: '1px solid #e8e2d9',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 13px',
      borderBottom: '1px solid #eee',
      background: '#fafafa'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, sec.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 'bold',
      color: '#1a1a1a'
    }
  }, sec.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: '#aaa'
    }
  }, sec.entries.length), /*#__PURE__*/React.createElement("button", {
    onClick: () => setNvEditSec(sec),
    style: {
      padding: '4px 10px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const name = sec.name;
      if (!confirm(`Delete section "${name}" and all its entries?`)) return;
      persistNormalVals(normalValues.filter((_, i) => i !== si), `Delete section: ${name}`);
    },
    style: {
      padding: '4px 10px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 13px 10px'
    }
  }, sec.entries.map((e, ei) => /*#__PURE__*/React.createElement("div", {
    key: e.name + ei,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 0',
      borderBottom: ei < sec.entries.length - 1 ? '1px solid #f0f0f0' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#333'
    }
  }, e.name, e.abbr && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: '#999',
      marginLeft: 4
    }
  }, "(", e.abbr, ")")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888'
    }
  }, e.sample && /*#__PURE__*/React.createElement("span", null, e.sample, " \xB7 "), e.range, " ", e.unit, e.note && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#6a8'
    }
  }, " \xB7 ", e.note))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setNvEditEnt({
      secIdx: si,
      entry: e,
      entryIdx: ei
    }),
    style: {
      padding: '3px 9px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 11,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!confirm(`Delete "${e.name}"?`)) return;
      const newSecs = normalValues.map((s, i) => i === si ? {
        ...s,
        entries: s.entries.filter((_, j) => j !== ei)
      } : s);
      persistNormalVals(newSecs, `Delete entry: ${e.name}`);
    },
    style: {
      padding: '3px 9px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 11,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setNvEditEnt({
      secIdx: si,
      entry: null,
      entryIdx: -1
    }),
    style: {
      width: '100%',
      padding: 8,
      marginTop: 6,
      borderRadius: 6,
      border: '2px dashed #ddd',
      background: '#fafafa',
      color: '#888',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u2795 Add Entry")))), normalValues.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#bbb',
      textAlign: 'center',
      padding: 30
    }
  }, "No sections yet."))), tab === 'minerals' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search minerals\u2026",
    style: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid #ddd',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      boxSizing: 'border-box',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
   }, filteredMinerals.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#bbb',
      textAlign: 'center',
      padding: 40
    }
  }, "No results."), filteredMinerals.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    style: {
      background: v.important ? '#fffde7' : '#fff',
      borderRadius: 8,
      padding: '11px 13px',
      marginBottom: 8,
      borderLeft: `3px solid ${v.important ? '#f1c40f' : '#3498db'}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#aaa',
      marginBottom: 2
    }
  }, "#", v.id, " \xB7 ", v.type, v.important ? ' \xB7 \u2B50 Important' : ''), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, v.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, v.coenzyme || '')), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      const updated = minerals.map(x => x.id === v.id ? {
        ...x,
        important: !x.important
      } : x);
      persistMinerals(updated, `${v.important ? 'Unstar' : 'Star'}: ${v.name}`);
      onMineralsChange(updated);
    },
    style: {
      background: 'none',
      border: `1px solid ${v.important ? '#f1c40f' : '#ccc'}`,
      borderRadius: 5,
      padding: '4px 8px',
      cursor: 'pointer',
      color: v.important ? '#d4a017' : '#aaa',
      fontSize: 14
    }
  }, "\u2B50"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMinEditing(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMinDel(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1"))))), tab === 'vignettes' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search vignettes\u2026",
    style: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid #ddd',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      boxSizing: 'border-box',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
   }, filteredVignettes.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#bbb',
      textAlign: 'center',
      padding: 40
    }
  }, "No results."), filteredVignettes.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    style: {
      background: '#fff',
      borderRadius: 8,
      padding: '11px 13px',
      marginBottom: 8,
      borderLeft: '3px solid #9b59b6',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#aaa',
      marginBottom: 2
    }
  }, "#", v.id, " \xB7 ", v.diagnosis || 'No diagnosis'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, v.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, v.presentation ? v.presentation.substring(0, 80) + '\u2026' : '')), /*#__PURE__*/React.createElement("button", {
    onClick: () => setVigEditing(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setVigDel(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1"))))), tab === 'cases' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      background: '#fff',
      borderBottom: '1px solid #e0e0e0',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search clinical cases\u2026",
    style: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid #ddd',
      fontSize: 14,
      fontFamily: 'Georgia,serif',
      boxSizing: 'border-box',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 14px 60px'
    }
   }, filteredCases.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#bbb',
      textAlign: 'center',
      padding: 40
    }
  }, "No results."), filteredCases.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    style: {
      background: '#fff',
      borderRadius: 8,
      padding: '11px 13px',
      marginBottom: 8,
      borderLeft: '3px solid #16a085',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#aaa',
      marginBottom: 2
    }
  }, "#", v.id, " \xB7 ", v.difficulty || 'unknown', " \xB7 answer: ", v.answer || '?'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, v.question || 'No question'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#888',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, v.stem ? v.stem.substring(0, 80) + '\u2026' : '')), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCaseEditing(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCaseDel(v),
    style: {
      padding: '5px 11px',
      borderRadius: 5,
      border: '1px solid #c0392b',
      background: '#fdf0f0',
      color: '#c0392b',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "\uD83D\uDDD1"))))), tab === 'visibility' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      background: '#fff',
      flex: 1,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333'
    }
  }, "\uD83D\uDD32 Toggle Frontend Visibility"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888',
      marginBottom: 18,
      lineHeight: 1.5
    }
  }, "Hidden sections are removed from the home screen and blocked from direct URL access. Changes take effect after you log out."), Object.keys(visibility).map(key => /*#__PURE__*/React.createElement("div", {
    key: key,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      marginBottom: 6,
      borderRadius: 8,
      background: visibility[key] ? '#e8f5ee' : '#f5f5f5',
      border: `1px solid ${visibility[key] ? '#4caf7d' : '#ddd'}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: visibility[key] ? '#2d8a4e' : '#999',
      fontWeight: visibility[key] ? 'bold' : 'normal',
      textTransform: 'capitalize'
    }
  }, key.replace('-', ' ')), /*#__PURE__*/React.createElement("label", {
    style: {
      position: 'relative',
      display: 'inline-block',
      width: 44,
      height: 24,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: visibility[key],
    onChange: () => {
      const next = { ...visibility, [key]: !visibility[key] };
      persistVisibility(next, `Toggle: ${key} ${!visibility[key] ? 'visible' : 'hidden'}`);
    },
    style: {
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      background: visibility[key] ? '#4caf7d' : '#ccc',
      borderRadius: 24,
      transition: 'all 0.3s',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: visibility[key] ? 22 : 2,
      top: 2,
      width: 20,
      height: 20,
      background: '#fff',
      borderRadius: '50%',
      transition: 'all 0.3s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      fontSize: 11,
      color: '#aaa',
      textAlign: 'center',
      borderTop: '1px solid #eee'
    }
  }, "Toggles auto-save to GitHub.")),
  tab === 'physio-viva' && adminCat === 'physiology' && /*#__PURE__*/React.createElement(PhysioTabContent, { label: 'Viva', data: physioViva, onEdit: v => { setPVivaEditing(v); setPVivaForm({ cat: v.cat || '', name: v.name || '', def: v.def || '' }); }, onDelete: v => setPVivaDel(v) }),
  tab === 'physio-reflex-detail' && adminCat === 'physiology' && /*#__PURE__*/React.createElement(PhysioTabContent, { label: 'Reflex Detail', data: physioReflexDetails, onEdit: v => { setPRefDetEditing(v); setPRefDetForm({ name: v.name || '', sys: v.sys || '', receptor: v.receptor || '', center: v.center || '', nucleus: v.nucleus || '', stimulus: v.stimulus || '', response: v.response || '', purpose: v.purpose || '' }); }, onDelete: v => setPRefDetDel(v) }),
  tab === 'physio-notes' && adminCat === 'physiology' && /*#__PURE__*/React.createElement(PhysioTabContent, { label: 'Note', data: physioNotes, onEdit: v => { setPNoteEditing(v); setPNoteForm({ name: v.name || '', sections: Object.entries(v.sections || {}).map(([key, val]) => ({ key, value: (typeof val === 'object' && val) ? (val.text || (val.items || []).map(i => typeof i === 'string' ? i : (i.heading ? i.heading + ': ' + (i.text || '') : i.text || '')).join(', ') || '') : val })) }); }, onDelete: v => setPNoteDel(v) }),
  tab === 'physio-clinical' && adminCat === 'physiology' && /*#__PURE__*/React.createElement(PhysioTabContent, { label: 'Clinical', data: physioClinical, onEdit: v => { setPClinEditing(v); setPClinForm({ name: v.name || '', tab: v.tab || '', sections: Object.entries(v.sections || {}).map(([key, val]) => ({ key, value: typeof val === 'object' && val ? (val.text || (val.items || []).map(i => typeof i === 'string' ? i : (i.heading ? i.heading + ': ' + (i.text || '') : i.text || '')).join(', ') || '') : val })) }); }, onDelete: v => setPClinDel(v) }),
  /*#__PURE__*/React.createElement(PhysioEditModal, { editing: pVivaEditing, setEditing: setPVivaEditing, form: pVivaForm, setForm: setPVivaForm, onSave: handlePVivaSave, label: 'Viva Entry' }),
  /*#__PURE__*/React.createElement(PhysioEditModal, { editing: pRefDetEditing, setEditing: setPRefDetEditing, form: pRefDetForm, setForm: setPRefDetForm, onSave: handlePRefDetSave, label: 'Reflex Detail' }),
  /*#__PURE__*/React.createElement(PhysioEditModal, { editing: pNoteEditing, setEditing: setPNoteEditing, form: pNoteForm, setForm: setPNoteForm, onSave: handlePNoteSave, label: 'Note' }),
  /*#__PURE__*/React.createElement(PhysioEditModal, { editing: pClinEditing, setEditing: setPClinEditing, form: pClinForm, setForm: setPClinForm, onSave: handlePClinSave, label: 'Clinical' }),
  /*#__PURE__*/React.createElement(PhysioDelModal, { del: pVivaDel, setDel: setPVivaDel, onConfirm: handlePVivaDelete, label: 'Viva Entry' }),
  /*#__PURE__*/React.createElement(PhysioDelModal, { del: pRefDetDel, setDel: setPRefDetDel, onConfirm: handlePRefDetDelete, label: 'Reflex Detail' }),
  /*#__PURE__*/React.createElement(PhysioDelModal, { del: pNoteDel, setDel: setPNoteDel, onConfirm: handlePNoteDelete, label: 'Note' }),
  /*#__PURE__*/React.createElement(PhysioDelModal, { del: pClinDel, setDel: setPClinDel, onConfirm: handlePClinDelete, label: 'Clinical' })),
  nvEditSec && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 130,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 18,
      maxWidth: 480,
      margin: '16px auto',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 15
    }
  }, nvEditSec === 'new' ? 'Add Section' : 'Edit Section'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setNvEditSec(null),
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      fontSize: 22,
      cursor: 'pointer',
      color: '#aaa'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Section ID"), /*#__PURE__*/React.createElement("input", {
    value: nvForm.id,
    onChange: e => setNvForm(f => ({
      ...f,
      id: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    value: nvForm.name,
    onChange: e => setNvForm(f => ({
      ...f,
      name: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Icon (emoji)"), /*#__PURE__*/React.createElement("input", {
    value: nvForm.icon,
    onChange: e => setNvForm(f => ({
      ...f,
      icon: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 12,
      boxSizing: 'border-box'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setNvEditSec(null),
    style: {
      flex: 1,
      padding: 10,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#555',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!nvForm.id.trim() || !nvForm.name.trim()) {
        alert('ID and Name required');
        return;
      }
      const newSec = {
        id: nvForm.id,
        name: nvForm.name,
        icon: nvForm.icon,
        entries: []
      };
      if (nvEditSec === 'new') {
        persistNormalVals([...normalValues, newSec], `Add section: ${nvForm.name}`);
      } else {
        const idx = normalValues.findIndex(s => s.id === nvEditSec.id);
        if (idx >= 0) {
          const newData = [...normalValues];
          newData[idx] = {
            ...newData[idx],
            ...nvForm
          };
          persistNormalVals(newData, `Edit section: ${nvForm.name}`);
        }
      }
      setNvEditSec(null);
    },
    style: {
      flex: 2,
      padding: 10,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#1a1a1a',
      color: '#fff',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "\uD83D\uDCBE Save")))), nvEditEnt && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 130,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 18,
      maxWidth: 480,
      margin: '16px auto',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 15
    }
  }, nvEditEnt.entry ? 'Edit Entry' : 'Add Entry'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setNvEditEnt(null),
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      fontSize: 22,
      cursor: 'pointer',
      color: '#aaa'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Analyte Name *"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.name,
    onChange: e => setNvEntForm(f => ({
      ...f,
      name: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    },
    placeholder: "e.g. Sodium"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Abbreviation"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.abbr,
    onChange: e => setNvEntForm(f => ({
      ...f,
      abbr: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    },
    placeholder: "Na\u207A"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Sample"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.sample,
    onChange: e => setNvEntForm(f => ({
      ...f,
      sample: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    },
    placeholder: "S / P / B"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 2
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Range"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.range,
    onChange: e => setNvEntForm(f => ({
      ...f,
      range: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    },
    placeholder: "136-145"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Unit"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.unit,
    onChange: e => setNvEntForm(f => ({
      ...f,
      unit: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    },
    placeholder: "mEq/L"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 2
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "SI Range"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.si,
    onChange: e => setNvEntForm(f => ({
      ...f,
      si: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    },
    placeholder: "136-145"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "SI Unit"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.siUnit,
    onChange: e => setNvEntForm(f => ({
      ...f,
      siUnit: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 8,
      boxSizing: 'border-box'
    },
    placeholder: "mmol/L"
  }))), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 3
    }
  }, "Biochemical Note"), /*#__PURE__*/React.createElement("input", {
    value: nvEntForm.note,
    onChange: e => setNvEntForm(f => ({
      ...f,
      note: e.target.value
    })),
    style: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: 6,
      border: '1px solid #ddd',
      fontSize: 13,
      marginBottom: 12,
      boxSizing: 'border-box'
    },
    placeholder: "Major extracellular cation"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setNvEditEnt(null),
    style: {
      flex: 1,
      padding: 10,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#555',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!nvEntForm.name.trim()) {
        alert('Name required');
        return;
      }
      const newData = [...normalValues];
      const sec = {
        ...newData[nvEditEnt.secIdx]
      };
      if (nvEditEnt.entry) {
        sec.entries = sec.entries.map((e, i) => i === nvEditEnt.entryIdx ? {
          ...nvEntForm
        } : e);
      } else {
        sec.entries = [...sec.entries, {
          ...nvEntForm
        }];
      }
      newData[nvEditEnt.secIdx] = sec;
      persistNormalVals(newData, nvEditEnt.entry ? `Edit: ${nvEntForm.name}` : `Add: ${nvEntForm.name}`);
      setNvEditEnt(null);
    },
    style: {
      flex: 2,
      padding: 10,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#1a1a1a',
      color: '#fff',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "\uD83D\uDCBE Save")))), vitEditing && /*#__PURE__*/React.createElement(VitaminEditForm, {
    vitamin: vitEditing === 'new' ? null : vitEditing,
    onSave: handleVitSave,
    onCancel: () => setVitEditing(null)
  }), vitDel && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 26,
      maxWidth: 340,
      width: '100%',
      textAlign: 'center',
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83D\uDDD1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8
    }
  }, "Delete Vitamin?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#666',
      marginBottom: 20,
      lineHeight: 1.5
    }
  }, "\"", /*#__PURE__*/React.createElement("strong", null, vitDel.name), "\" will be permanently removed from the live site."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setVitDel(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleVitDelete,
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#c0392b',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Delete")))), minEditing && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 130,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      margin: '40px auto',
      maxWidth: 500,
      borderRadius: 12,
      padding: 24,
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 16
    }
  }, minEditing === 'new' ? 'Add Mineral' : 'Edit Mineral'), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    value: minForm.name,
    onChange: e => setMinForm(f => ({...f, name: e.target.value})),
    style: inp,
    placeholder: "Calcium (Ca)"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Alias"), /*#__PURE__*/React.createElement("input", {
    value: minForm.alias,
    onChange: e => setMinForm(f => ({...f, alias: e.target.value})),
    style: inp,
    placeholder: "Ca"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    value: minForm.type,
    onChange: e => setMinForm(f => ({...f, type: e.target.value})),
    style: {...inp, background: '#fff'}
  }, /*#__PURE__*/React.createElement("option", {value: "macromineral"}, "Macromineral"), /*#__PURE__*/React.createElement("option", {value: "micromineral"}, "Micromineral"), /*#__PURE__*/React.createElement("option", {value: "toxic"}, "Toxic")), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Coenzyme Form"), /*#__PURE__*/React.createElement("input", {
    value: minForm.coenzyme,
    onChange: e => setMinForm(f => ({...f, coenzyme: e.target.value})),
    style: inp,
    placeholder: "Ionized Ca\u00b2\u207a"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Deficiency Name"), /*#__PURE__*/React.createElement("input", {
    value: minForm.defName,
    onChange: e => setMinForm(f => ({...f, defName: e.target.value})),
    style: inp,
    placeholder: "Tetany / Rickets / Osteomalacia"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Toxicity"), /*#__PURE__*/React.createElement("input", {
    value: minForm.toxicity,
    onChange: e => setMinForm(f => ({...f, toxicity: e.target.value})),
    style: inp,
    placeholder: "Hypercalcemia"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Normal Range"), /*#__PURE__*/React.createElement("input", {
    value: minForm.normalRange,
    onChange: e => setMinForm(f => ({...f, normalRange: e.target.value})),
    style: inp,
    placeholder: "9 to 11 mg/dl"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Mnemonic"), /*#__PURE__*/React.createElement("textarea", {
    value: minForm.mnemonic,
    onChange: e => setMinForm(f => ({...f, mnemonic: e.target.value})),
    style: {...inp, minHeight: 50, resize: 'vertical'},
    placeholder: "Memory aid"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      color: '#555',
      marginBottom: 16,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: minForm.important,
    onChange: e => setMinForm(f => ({...f, important: e.target.checked}))
  }), "Important (High-Yield)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMinEditing(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!minForm.name.trim()) return;
      const formData = minEditing === 'new' ? { id: 0, ...minForm, deficiency: { name: minForm.defName, findings: [], clinical: '' }, relatedDisorderIds: [], pathwayIds: [], functions: [], enzymes: [] } : { ...minEditing, ...minForm, deficiency: { ...(minEditing.deficiency || {}), name: minForm.defName } };
      delete formData.defName;
      handleMinSave(formData);
    },
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#4caf7d',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, minSaving ? '\u23F3 Saving\u2026' : '\uD83D\uDCBE Save')))), minDel && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 26,
      maxWidth: 340,
      width: '100%',
      textAlign: 'center',
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83D\uDDD1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8
    }
  }, "Delete Mineral?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#666',
      marginBottom: 20,
      lineHeight: 1.5
    }
  }, "\"", /*#__PURE__*/React.createElement("strong", null, minDel.name), "\" will be permanently removed."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMinDel(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleMinDelete,
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#c0392b',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Delete")))), vigEditing && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 130,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      margin: '40px auto',
      maxWidth: 500,
      borderRadius: 12,
      padding: 24,
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 16
    }
  }, vigEditing === 'new' ? 'Add Vignette' : 'Edit Vignette'), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Title"), /*#__PURE__*/React.createElement("input", {
    value: vigForm.title,
    onChange: e => setVigForm(f => ({...f, title: e.target.value})),
    style: inp,
    placeholder: "Hypoglycaemic Infant with Massive Hepatomegaly"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Diagnosis"), /*#__PURE__*/React.createElement("input", {
    value: vigForm.diagnosis,
    onChange: e => setVigForm(f => ({...f, diagnosis: e.target.value})),
    style: inp,
    placeholder: "Von Gierke Disease (GSD I)"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Disorder ID"), /*#__PURE__*/React.createElement("input", {
    value: vigForm.disorderId,
    onChange: e => setVigForm(f => ({...f, disorderId: e.target.value})),
    style: inp,
    placeholder: "11",
    type: "number"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Presentation"), /*#__PURE__*/React.createElement("textarea", {
    value: vigForm.presentation,
    onChange: e => setVigForm(f => ({...f, presentation: e.target.value})),
    style: {...inp, minHeight: 100, resize: 'vertical'},
    placeholder: "Clinical scenario text\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setVigEditing(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!vigForm.title.trim()) return;
      handleVigSave(vigEditing === 'new' ? { ...vigForm, id: 0, actions: [], critical_ids: [], differentials: [] } : { ...vigEditing, ...vigForm });
    },
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#4caf7d',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, vigSaving ? '\u23F3 Saving\u2026' : '\uD83D\uDCBE Save')))), vigDel && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 26,
      maxWidth: 340,
      width: '100%',
      textAlign: 'center',
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83D\uDDD1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8
    }
  }, "Delete Vignette?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#666',
      marginBottom: 20,
      lineHeight: 1.5
    }
  }, "\"", /*#__PURE__*/React.createElement("strong", null, vigDel.title), "\" will be permanently removed."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setVigDel(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleVigDelete,
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#c0392b',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Delete")))), caseEditing && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 130,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      margin: '40px auto',
      maxWidth: 500,
      borderRadius: 12,
      padding: 24,
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 16
    }
  }, caseEditing === 'new' ? 'Add Case' : 'Edit Case'), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Question"), /*#__PURE__*/React.createElement("input", {
    value: caseForm.question,
    onChange: e => setCaseForm(f => ({...f, question: e.target.value})),
    style: inp,
    placeholder: "What is the most likely diagnosis?"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Stem"), /*#__PURE__*/React.createElement("textarea", {
    value: caseForm.stem,
    onChange: e => setCaseForm(f => ({...f, stem: e.target.value})),
    style: {...inp, minHeight: 100, resize: 'vertical'},
    placeholder: "Clinical scenario\u2026"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Option A"), /*#__PURE__*/React.createElement("input", {
    value: caseForm.optA,
    onChange: e => setCaseForm(f => ({...f, optA: e.target.value})),
    style: inp
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Option B"), /*#__PURE__*/React.createElement("input", {
    value: caseForm.optB,
    onChange: e => setCaseForm(f => ({...f, optB: e.target.value})),
    style: inp
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Option C"), /*#__PURE__*/React.createElement("input", {
    value: caseForm.optC,
    onChange: e => setCaseForm(f => ({...f, optC: e.target.value})),
    style: inp
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Option D"), /*#__PURE__*/React.createElement("input", {
    value: caseForm.optD,
    onChange: e => setCaseForm(f => ({...f, optD: e.target.value})),
    style: inp
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Answer"), /*#__PURE__*/React.createElement("select", {
    value: caseForm.answer,
    onChange: e => setCaseForm(f => ({...f, answer: e.target.value})),
    style: {...inp, background: '#fff'}
  }, /*#__PURE__*/React.createElement("option", {value: "A"}, "A"), /*#__PURE__*/React.createElement("option", {value: "B"}, "B"), /*#__PURE__*/React.createElement("option", {value: "C"}, "C"), /*#__PURE__*/React.createElement("option", {value: "D"}, "D")), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Explanation"), /*#__PURE__*/React.createElement("textarea", {
    value: caseForm.explanation,
    onChange: e => setCaseForm(f => ({...f, explanation: e.target.value})),
    style: {...inp, minHeight: 80, resize: 'vertical'},
    placeholder: "Explanation for the correct answer\u2026"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Difficulty"), /*#__PURE__*/React.createElement("select", {
    value: caseForm.difficulty,
    onChange: e => setCaseForm(f => ({...f, difficulty: e.target.value})),
    style: {...inp, background: '#fff'}
  }, /*#__PURE__*/React.createElement("option", {value: "easy"}, "Easy"), /*#__PURE__*/React.createElement("option", {value: "medium"}, "Medium"), /*#__PURE__*/React.createElement("option", {value: "hard"}, "Hard")), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Tags (comma-separated)"), /*#__PURE__*/React.createElement("input", {
    value: caseForm.tags,
    onChange: e => setCaseForm(f => ({...f, tags: e.target.value})),
    style: inp,
    placeholder: "A, B, C"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Disorder ID"), /*#__PURE__*/React.createElement("input", {
    value: caseForm.disorderId,
    onChange: e => setCaseForm(f => ({...f, disorderId: e.target.value})),
    style: inp,
    placeholder: "1",
    type: "number"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCaseEditing(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!caseForm.question.trim()) return;
      const opts = [{letter: 'A', text: caseForm.optA}, {letter: 'B', text: caseForm.optB}, {letter: 'C', text: caseForm.optC}, {letter: 'D', text: caseForm.optD}];
      const cleanedTags = caseForm.tags.split(',').map(s => s.trim()).filter(Boolean);
      handleCaseSave(caseEditing === 'new' ? { ...caseForm, id: 0, options: opts, tags: cleanedTags, disorderId: Number(caseForm.disorderId) || 0 } : { ...caseEditing, ...caseForm, options: opts, tags: cleanedTags, disorderId: Number(caseForm.disorderId) || 0 });
    },
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#4caf7d',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, caseSaving ? '\u23F3 Saving\u2026' : '\uD83D\uDCBE Save')))), caseDel && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 12,
      padding: 26,
      maxWidth: 340,
      width: '100%',
      textAlign: 'center',
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83D\uDDD1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8
    }
  }, "Delete Case?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#666',
      marginBottom: 20,
      lineHeight: 1.5
    }
  }, "Case #", /*#__PURE__*/React.createElement("strong", null, caseDel.id), " will be permanently removed."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCaseDel(null),
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#333',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCaseDelete,
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#c0392b',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, "Delete")))));
}

// \u2500\u2500 Vitamin Edit Form \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function VitaminEditForm({
  vitamin,
  onSave,
  onCancel
}) {
  const isNew = !vitamin;
  const inp = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14,
    fontFamily: 'Georgia,serif',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: 10
  };
  const lbl = {
    fontSize: 11,
    color: '#888',
    marginBottom: 3,
    fontFamily: 'Georgia,serif',
    fontWeight: 'bold'
  };
  const [form, setForm] = useState(vitamin || {
    name: '',
    alias: '',
    type: 'water-soluble',
    coenzyme: '',
    enzymes: [],
    pathwayIds: [],
    deficiency: null,
    toxicity: '',
    mnemonic: '',
    relatedDisorderIds: [],
    important: false
  });
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const [defName, setDefName] = useState(vitamin?.deficiency?.name || '');
  const [defFindings, setDefFindings] = useState((vitamin?.deficiency?.findings || []).join('\n'));
  const [defClinical, setDefClinical] = useState(vitamin?.deficiency?.clinical || '');
  const [enzymesStr, setEnzymesStr] = useState((vitamin?.enzymes || []).join('\n'));
  const [pathwayIdsStr, setPathwayIdsStr] = useState((vitamin?.pathwayIds || []).join('\n'));
  const [relDisorderIdsStr, setRelDisorderIdsStr] = useState((vitamin?.relatedDisorderIds || []).join('\n'));
  function handleSave() {
    const def = defName.trim() ? {
      name: defName.trim(),
      findings: defFindings.split('\n').filter(Boolean).map(s => s.trim()),
      clinical: defClinical.trim()
    } : null;
    onSave({
      ...form,
      enzymes: enzymesStr.split('\n').filter(Boolean).map(s => s.trim()),
      pathwayIds: pathwayIdsStr.split('\n').filter(Boolean).map(s => Number(s.trim())).filter(n => !isNaN(n)),
      deficiency: def,
      relatedDisorderIds: relDisorderIdsStr.split('\n').filter(Boolean).map(s => Number(s.trim())).filter(n => !isNaN(n)),
      mnemonic: form.mnemonic || '',
      toxicity: form.toxicity || ''
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: '14px 14px 0 0',
      padding: '24px 24px 32px',
      width: '100%',
      maxWidth: 680,
      maxHeight: '85vh',
      overflowY: 'auto',
      fontFamily: 'Georgia,serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16
    }
  }, isNew ? '\u2795 Add Vitamin' : `\u00E2\u0153\u008F\u00EF\u00B8\u008F Edit: ${vitamin.name}`), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.name,
    onChange: e => set('name', e.target.value),
    placeholder: "e.g. Thiamine"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Alias"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.alias,
    onChange: e => set('alias', e.target.value),
    placeholder: "e.g. B1"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Type"), /*#__PURE__*/React.createElement("select", {
    style: inp,
    value: form.type,
    onChange: e => set('type', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "water-soluble"
  }, "Water-soluble"), /*#__PURE__*/React.createElement("option", {
    value: "fat-soluble"
  }, "Fat-soluble")), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Coenzyme Form"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.coenzyme,
    onChange: e => set('coenzyme', e.target.value),
    placeholder: "e.g. TPP (Thiamine Pyrophosphate)"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Enzymes (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 70,
      resize: 'vertical'
    },
    value: enzymesStr,
    onChange: e => setEnzymesStr(e.target.value),
    placeholder: "Pyruvate Dehydrogenase\n\u03B1-KG Dehydrogenase\nTransketolase"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Pathway IDs (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 50,
      resize: 'vertical'
    },
    value: pathwayIdsStr,
    onChange: e => setPathwayIdsStr(e.target.value),
    placeholder: "5\n6\n7"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...lbl,
      marginTop: 6
    }
  }, "Deficiency"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px',
      background: '#f9f9f9',
      borderRadius: 6,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999'
    }
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: defName,
    onChange: e => setDefName(e.target.value),
    placeholder: "e.g. Beriberi"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999'
    }
  }, "Findings/Labs (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 50,
      resize: 'vertical'
    },
    value: defFindings,
    onChange: e => setDefFindings(e.target.value),
    placeholder: "\u2191 Pyruvate\n\u2193 ATP"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: '#999'
    }
  }, "Clinical Notes"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 60,
      resize: 'vertical'
    },
    value: defClinical,
    onChange: e => setDefClinical(e.target.value),
    placeholder: "Wet beriberi (cardiac), Dry beriberi (neuro)..."
  })), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Toxicity"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 50,
      resize: 'vertical'
    },
    value: form.toxicity,
    onChange: e => set('toxicity', e.target.value),
    placeholder: "Rare \u2014 excess excreted..."
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Mnemonic"), /*#__PURE__*/React.createElement("input", {
    style: inp,
    value: form.mnemonic,
    onChange: e => set('mnemonic', e.target.value),
    placeholder: "B1 = BeriBeri = needs TPP"
  }), /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "Related Disorder IDs (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inp,
      minHeight: 50,
      resize: 'vertical'
    },
    value: relDisorderIdsStr,
    onChange: e => setRelDisorderIdsStr(e.target.value),
    placeholder: "12\n45"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      ...lbl,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.important,
    onChange: e => set('important', e.target.checked)
  }), "Important (\u2B50)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    style: {
      flex: 1,
      padding: 11,
      borderRadius: 7,
      border: '1px solid #ddd',
      background: '#fff',
      color: '#555',
      fontSize: 14,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSave,
    style: {
      flex: 2,
      padding: 11,
      borderRadius: 7,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#1a1a1a',
      color: '#fff',
      fontSize: 14,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, isNew ? '\u2795 Add Vitamin' : '\uD83D\uDCBE Save Changes'))));
}

// \u2500\u2500 Clinical Vignette Simulator (Diagnostic Game) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function ClinicalVignetteView({
  vignette,
  onBack,
  dark,
  allDisorders,
  onOpenDisorder
}) {
  const [taken, setTaken] = useState(new Set());
  const [score, setScore] = useState(100);
  const [picked, setPicked] = useState(null);
  const [showPicker, setShow] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [wrongMsg, setWrongMsg] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const pickerRef = useRef(null);
  useEffect(() => {
    if (showPicker && pickerRef.current) pickerRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [showPicker]);
  const actions = vignette.actions || [];
  const rawDiffs = vignette.differentials || [];
  const criticals = new Set(vignette.critical_ids || []);
  const linkedDis = vignette.disorderId ? (allDisorders || []).find(d => d.id === vignette.disorderId || d.num === vignette.disorderId) : null;
  const takenArr = actions.filter(a => taken.has(a.id));
  const remaining = actions.filter(a => !taken.has(a.id));
  const [shuffledDiffs, setShuffledDiffs] = useState(() => {
    const arr = [...rawDiffs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const diffs = shuffledDiffs || rawDiffs;
  const confirmedDx = diffs.find(d => d.status === 'confirmed');
  const finalDiagnosis = confirmedDx ? confirmedDx.disease : vignette.diagnosis;
  function shuffleDiffs() {
    const arr = [...rawDiffs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledDiffs(arr);
  }
  function takeAction(a) {
    if (taken.has(a.id)) return;
    if (a.cost >= 3 && !attempted) return;
    setTaken(new Set([...taken, a.id]));
    setScore(s => Math.max(0, s - a.cost * 8));
  }
  function handlePickDiagnosis() {
    const correctAnswer = finalDiagnosis;
    if (picked === correctAnswer) {
      setCorrect(true);
      setShow(false);
    } else {
      setWrongMsg(`Not correct. Score -15!`);
      setScore(s => Math.max(0, s - 15));
      setPicked(null);
      setAttempted(true);
    }
  }
  const totalPossible = actions.reduce((s, a) => s + a.cost * 8, 0);
  const maxScore = 100;
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';
  const gradeColor = score >= 80 ? '#27ae60' : score >= 60 ? '#e8c56a' : score >= 40 ? '#e67e22' : '#c0392b';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '6px 10px',
      marginLeft: -10,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#fff'
    }
  }, "Clinical Vignette"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#888',
      marginTop: 1
    }
  }, vignette.title)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      color: correct ? gradeColor : '#e8c56a'
    }
  }, correct ? grade : score), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: '#666',
      textTransform: 'uppercase',
      letterSpacing: 1
    }
  }, "Score", correct && ` (Grade ${grade})`))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 12px 160px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.card(dark),
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderLeft: '3px solid #e8c56a',
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 16,
      fontSize: 13,
      color: DK.text(dark),
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#e8c56a',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6
    }
  }, "\uD83D\uDCCB Case Presentation"), vignette.presentation), takenArr.length > 0 && !correct && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 'bold',
      color: DK.sub(dark),
      marginBottom: 8
    }
  }, "\uD83D\uDD0D Findings (", takenArr.length, ")"), takenArr.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      background: DK.card(dark),
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderLeft: '3px solid #e67e22',
      borderRadius: 6,
      padding: '10px 12px',
      marginBottom: 8,
      animation: 'fadeIn 0.3s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#e67e22',
      marginBottom: 4
    }
  }, a.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: DK.text(dark),
      lineHeight: 1.6
    }
  }, a.clue), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: DK.sub(dark),
      marginTop: 6,
      borderTop: `1px solid ${dark ? '#222' : '#eee'}`,
      paddingTop: 5
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Summary:"), " ", a.finding)))), remaining.length > 0 && !correct && score > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 'bold',
      color: DK.sub(dark),
      marginBottom: 8
    }
  }, "\u2695\uFE0F Choose an action:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, remaining.map(a => {
    const locked = a.cost >= 3 && !attempted;
    return /*#__PURE__*/React.createElement("button", {
      key: a.id,
      onClick: () => takeAction(a),
      disabled: locked,
      style: {
        padding: '10px 8px',
        borderRadius: 8,
        borderTop: `1px solid ${DK.border(dark)}`,
        borderRight: `1px solid ${DK.border(dark)}`,
        borderBottom: `1px solid ${DK.border(dark)}`,
        background: locked ? (dark ? '#151515' : '#f5f3ef') : (dark ? '#1a1a1a' : '#fefefe'),
        color: locked ? DK.muted(dark) : DK.text(dark),
        fontSize: 11,
        cursor: locked ? 'not-allowed' : 'pointer',
        fontFamily: 'Georgia,serif',
        textAlign: 'left',
        lineHeight: 1.4,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'all 0.15s'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, locked ? "\uD83D\uDD12 " + a.label : a.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: DK.muted(dark)
      }
    }, locked ? "Requires a diagnosis attempt" : "\u23F1 " + a.cost + " \xD7 8 pts"));
  }))), score <= 0 && !correct && /*#__PURE__*/React.createElement("div", {
    style: {
      background: dark ? '#2a1a1a' : '#fdf0f0',
      border: `1px solid ${dark ? '#4a2a2a' : '#e8c8c8'}`,
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 12,
      textAlign: 'center',
      fontSize: 13,
      color: '#c0392b',
      fontWeight: 'bold'
    }
  }, "\u26D4 Score depleted! Make your diagnosis now."), wrongMsg && !correct && /*#__PURE__*/React.createElement("div", {
    style: {
      background: dark ? '#2a1a1a' : '#fdf0f0',
      border: `1px solid ${dark ? '#4a2a2a' : '#e8c8c8'}`,
      borderRadius: 8,
      padding: '10px 14px',
      marginTop: 12,
      textAlign: 'center',
      fontSize: 13,
      color: '#c0392b',
      fontWeight: 'bold',
      animation: 'fadeIn 0.3s ease'
    }
  }, wrongMsg), showPicker && !correct && /*#__PURE__*/React.createElement("div", {
    ref: pickerRef,
    style: {
      marginTop: 12,
      animation: 'fadeIn 0.3s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.card(dark),
      border: `2px solid #27ae60`,
      borderRadius: 8,
      padding: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 4
    }
  }, "What is your diagnosis?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: DK.sub(dark),
      marginBottom: 12
    }
  }, "Select the most likely condition."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, diffs.map(d => /*#__PURE__*/React.createElement("button", {
    key: d.disease,
    onClick: () => {
      setPicked(d.disease);
      setWrongMsg(null);
    },
    style: {
      padding: '10px 12px',
      borderRadius: 6,
      border: picked === d.disease ? '2px solid #27ae60' : '1px solid ' + DK.border(dark),
      background: picked === d.disease ? dark ? '#1a2a1a' : '#e8f5ee' : DK.card(dark),
      color: DK.text(dark),
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      textAlign: 'left',
      transition: 'all 0.15s'
    }
  }, d.disease))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShow(false);
      setPicked(null);
    },
    style: {
      flex: 1,
      padding: '10px',
      borderRadius: 6,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      background: 'transparent',
      color: DK.text(dark),
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handlePickDiagnosis,
    disabled: !picked,
    style: {
      flex: 1,
      padding: '10px',
      borderRadius: 6,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: picked ? '#27ae60' : '#555',
      color: picked ? '#fff' : '#888',
      fontSize: 13,
      fontWeight: 'bold',
      cursor: picked ? 'pointer' : 'not-allowed',
      fontFamily: 'Georgia,serif'
    }
  }, "Confirm")))), correct && /*#__PURE__*/React.createElement("div", {
    style: {
      animation: 'fadeIn 0.5s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: dark ? '#1a2a1a' : '#e8f5ee',
      border: `1px solid ${dark ? '#2a4a2a' : '#c8e8d8'}`,
      borderRadius: 12,
      padding: '16px',
      marginBottom: 16,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 'bold',
      color: dark ? '#8d8' : '#2a6a4a',
      marginBottom: 4
    }
  }, "\u2705 Correct!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: DK.text(dark),
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("strong", null, finalDiagnosis)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 24,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 'bold',
      color: gradeColor
    }
  }, score), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: DK.sub(dark)
    }
  }, "FINAL SCORE")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 'bold',
      color: gradeColor
    }
  }, grade), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: DK.sub(dark)
    }
  }, "GRADE")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 'bold',
      color: gradeColor
    }
  }, takenArr.length, "/", actions.length), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: DK.sub(dark)
    }
  }, "ACTIONS"))), linkedDis && /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenDisorder(linkedDis),
    style: {
      marginTop: 10,
      fontSize: 11,
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      borderBottom: '1px solid #e8c56a',
      color: '#e8c56a',
      cursor: 'pointer',
      fontFamily: 'Georgia,serif',
      padding: 0
    }
  }, "View ", linkedDis.disorder, " Card \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 'bold',
      color: DK.sub(dark),
      marginBottom: 8
    }
  }, "\uD83D\uDD0D Diagnostic Workup"), actions.map((a, i) => {
    const wasTaken = taken.has(a.id);
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      style: {
        background: DK.card(dark),
        borderTop: `1px solid ${DK.border(dark)}`,
        borderRight: `1px solid ${DK.border(dark)}`,
        borderBottom: `1px solid ${DK.border(dark)}`,
        borderLeft: `3px solid ${a.critical ? '#e8c56a' : '#555'}`,
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 8,
        opacity: wasTaken ? 1 : 0.5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: wasTaken ? '#e67e22' : DK.muted(dark),
        marginBottom: 3
      }
    }, a.label, " ", wasTaken ? '\u2713' : '(not performed)'), wasTaken ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: DK.text(dark),
        lineHeight: 1.6,
        marginBottom: 6
      }
    }, a.clue), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: DK.sub(dark),
        borderTop: `1px solid ${dark ? '#222' : '#eee'}`,
        paddingTop: 5
      }
    }, /*#__PURE__*/React.createElement("strong", null, "Finding:"), " ", a.finding)) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: DK.muted(dark),
        fontStyle: 'italic'
      }
    }, "You did not select this action."));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 'bold',
      color: DK.sub(dark),
      marginBottom: 8,
      marginTop: 16
    }
  }, "\uD83D\uDCCB Differential Breakdown"), diffs.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.disease,
    style: {
      background: DK.card(dark),
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderLeft: `3px solid ${d.status === 'confirmed' ? '#27ae60' : '#c0392b'}`,
      borderRadius: 6,
      padding: '10px 12px',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 'bold',
      color: d.status === 'confirmed' ? '#27ae60' : DK.muted(dark)
    }
  }, d.disease), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: d.status === 'confirmed' ? '#27ae60' : '#c0392b',
      textTransform: 'uppercase',
      padding: '1px 6px',
      borderRadius: 10,
      background: d.status === 'confirmed' ? dark ? '#1a3a1a' : '#e8f5ee' : dark ? '#3a1a1a' : '#fdf0f0'
    }
  }, d.status)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: DK.sub(dark),
      lineHeight: 1.5
    }
  }, d.reason))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '12px 16px',
      background: dark ? 'rgba(15,15,15,0.97)' : 'rgba(250,247,242,0.97)',
      borderTop: `1px solid ${DK.border(dark)}`,
      zIndex: 10
    }
  }, correct ? /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      width: '100%',
      padding: 13,
      borderRadius: 8,
      border: '1px solid ' + DK.border(dark),
      background: DK.surface(dark),
      color: DK.text(dark),
      fontSize: 14,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\u2190 Back to Vignettes") : showPicker ? null : takenArr.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      shuffleDiffs();
      setShow(true);
      setWrongMsg(null);
    },
    style: {
      width: '100%',
      padding: 13,
      borderRadius: 8,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#27ae60',
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\uD83C\uDFE5 Attempt Diagnosis \u2192")), /*#__PURE__*/React.createElement("style", null, `@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`));
}

// \u2500\u2500 Clinical Cases Viewer (MCQ Mode) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];
const TAG_NAMES = {
  A: 'Carbohydrate Disorders',
  B: 'Glycogen Storage Diseases',
  C: 'Lipid & FA Oxidation',
  D: 'Amino Acid Disorders',
  E: 'Urea Cycle Defects',
  F: 'Organic Acidemias',
  G: 'Purine & Pyrimidine',
  H: 'Porphyrias',
  I: 'Hemoglobinopathies & RBC',
  J: 'Vitamin Deficiencies',
  K: 'Minerals & Trace Elements',
  L: 'Lysosomal Storage Diseases',
  M: 'Mucopolysaccharidoses',
  N: 'Neuro-Endocrine',
  O: 'Toxicology & Miscellaneous'
};
function CasesView({
  cases,
  allDisorders,
  onBack,
  dark
}) {
  const [setup, setSetup] = useState(true);
  const [difficulty, setDifficulty] = useState('all');
  const [tag, setTag] = useState('all');
  const [shuffle, setShuffle] = useState(false);
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({
    c: 0,
    t: 0
  });
  const [showFilters, setShow] = useState(false);
  const [showDisorder, setShowDisorder] = useState(null);
  const allTags = [...new Set(cases.flatMap(c => c.tags))].sort();
  const filtered = cases.filter(c => (difficulty === 'all' || c.difficulty === difficulty) && (tag === 'all' || c.tags.includes(tag)));
  function shuffleOptions(c) {
    const opts = c.options.map((o, i) => ({
      ...o,
      origIdx: i
    }));
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    const letters = 'ABCDEFGH';
    const newOpts = opts.map((o, i) => ({
      ...o,
      letter: letters[i]
    }));
    const newAnswer = letters[opts.findIndex(o => o.letter === c.answer)];
    return {
      ...c,
      options: newOpts,
      answer: newAnswer
    };
  }
  function buildQueue() {
    return (shuffle ? [...filtered].sort(() => Math.random() - 0.5) : [...filtered]).map(shuffleOptions);
  }
  function startQuiz() {
    setQueue(buildQueue());
    setIdx(0);
    setAnswered(false);
    setSelected(null);
    setSetup(false);
  }
  const current = queue[idx] || filtered[0];
  const isCorrect = answered && selected === current?.answer;
  useEffect(() => {
    if (setup) return;
    setAnswered(false);
    setSelected(null);
  }, [current]);
  function handleSelect(letter) {
    if (answered) return;
    setSelected(letter);
    setAnswered(true);
    const correct = letter === current.answer;
    setScore(s => ({
      c: s.c + (correct ? 1 : 0),
      t: s.t + 1
    }));
  }
  function handleNext() {
    if (idx + 1 >= queue.length) {
      setQueue([]);
      setIdx(0);
      setAnswered(false);
      setSelected(null);
      return;
    }
    setIdx(i => i + 1);
    setAnswered(false);
    setSelected(null);
  }
  function handleViewDisorder(id) {
    const d = allDisorders.find(x => x.id === id || x.num === id);
    if (d) setShowDisorder(d);
  }

  /* \u2500\u2500 SETUP SCREEN \u2500\u2500 */
  if (setup) {
    const counts = {};
    DIFFICULTIES.forEach(d => {
      counts[d] = cases.filter(c => d === 'all' || c.difficulty === d).length;
    });
    const tagCounts = {};
    allTags.forEach(t => {
      tagCounts[t] = cases.filter(c => c.tags.includes(t)).length;
    });
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100vh',
        background: DK.bg(dark),
        fontFamily: 'Georgia,serif',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: DK.hdr(dark),
        padding: '13px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onBack,
      style: {
        background: 'none',
        borderTop: 'none',
        borderRight: 'none',
        borderLeft: 'none',
        color: '#aaa',
        fontSize: 24,
        cursor: 'pointer',
        padding: '10px 14px',
        marginLeft: -14,
        lineHeight: 1
      }
    }, "\u2190"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1
      }
    }, "Clinical Cases"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: '#888'
      }
    }, cases.length, " total")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px 120px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 'bold',
        color: DK.text(dark),
        marginBottom: 4
      }
    }, "Configure Your Quiz"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: DK.sub(dark),
        marginBottom: 20,
        lineHeight: 1.5
      }
    }, "Select difficulty, unit, and playback options."), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        color: DK.text(dark),
        marginBottom: 8
      }
    }, "Difficulty"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginBottom: 20
      }
    }, DIFFICULTIES.map(d => /*#__PURE__*/React.createElement("button", {
      key: d,
      onClick: () => setDifficulty(d),
      style: {
        flex: 1,
        padding: '10px 6px',
        borderRadius: 8,
        border: difficulty === d ? '2px solid #e8c56a' : '1px solid ' + DK.border(dark),
        background: difficulty === d ? dark ? '#2a2a1a' : '#fef8e8' : DK.card(dark),
        color: DK.text(dark),
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 'bold'
      }
    }, d === 'all' ? 'Mixed' : d.charAt(0).toUpperCase() + d.slice(1)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: DK.sub(dark),
        marginTop: 3
      }
    }, counts[d], " cases")))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        color: DK.text(dark),
        marginBottom: 8
      }
    }, "Topic"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setTag('all'),
      style: {
        padding: '6px 12px',
        borderRadius: 6,
        border: tag === 'all' ? '2px solid #e8c56a' : '1px solid ' + DK.border(dark),
        background: tag === 'all' ? dark ? '#2a2a1a' : '#fef8e8' : DK.card(dark),
        color: DK.text(dark),
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif'
      }
    }, "All Topics ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: DK.sub(dark)
      }
    }, "(", cases.length, ")")), allTags.map(t => /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => setTag(t),
      style: {
        padding: '6px 12px',
        borderRadius: 6,
        border: tag === t ? '2px solid #e8c56a' : '1px solid ' + DK.border(dark),
        background: tag === t ? dark ? '#2a2a1a' : '#fef8e8' : DK.card(dark),
        color: DK.text(dark),
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif'
      }
    }, TAG_NAMES[t] || t, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: DK.sub(dark)
      }
    }, "(", tagCounts[t], ")")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setShuffle(v => !v),
      style: {
        padding: '8px 16px',
        borderRadius: 6,
        borderTop: 'none',
        borderRight: 'none',
        borderLeft: 'none',
        background: shuffle ? '#e8c56a' : dark ? '#333' : '#eee',
        color: shuffle ? '#1a1a1a' : DK.text(dark),
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif'
      }
    }, "\uD83D\uDD00 Shuffle Questions ", shuffle ? 'ON' : 'OFF')), filtered.length > 0 ? /*#__PURE__*/React.createElement("button", {
      onClick: startQuiz,
      style: {
        width: '100%',
        padding: 14,
        borderRadius: 8,
        borderTop: 'none',
        borderRight: 'none',
        borderLeft: 'none',
        background: '#e8c56a',
        color: '#1a1a1a',
        fontSize: 16,
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'Georgia,serif'
      }
    }, "Start Quiz \u2014 ", filtered.length, " case", filtered.length !== 1 ? 's' : '') : /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: 14,
        color: '#c0392b',
        fontSize: 13
      }
    }, "No cases match these selections.")));
  }

  /* \u2500\u2500 PLAYING SCREEN \u2500\u2500 */
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSetup(true);
      setSelected(null);
      setAnswered(false);
      setScore({
        c: 0,
        t: 0
      });
    },
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '6px 10px',
      marginLeft: -10,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#fff'
    }
  }, "Clinical Cases"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#888'
    }
  }, queue.length > 0 ? `Case ${idx + 1} of ${queue.length}` : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#e8c56a'
    }
  }, score.c, "/", score.t), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShow(v => !v),
    style: {
      background: 'none',
      border: `1px solid ${showFilters ? '#e8c56a' : '#555'}`,
      color: showFilters ? '#e8c56a' : '#888',
      borderRadius: 4,
      padding: '4px 8px',
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\u2699"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 12px 120px'
    }
  }, showFilters && /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.card(dark),
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderRadius: 8,
      padding: '12px',
      marginBottom: 12,
      animation: 'fadeIn 0.2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: DK.sub(dark),
      marginBottom: 4
    }
  }, "Difficulty"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, DIFFICULTIES.map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => setDifficulty(d),
    style: {
      padding: '4px 10px',
      borderRadius: 12,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: difficulty === d ? '#e8c56a' : dark ? '#333' : '#eee',
      color: difficulty === d ? '#1a1a1a' : DK.text(dark),
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: DK.sub(dark),
      marginBottom: 4
    }
  }, "Topic"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setTag('all'),
    style: {
      padding: '4px 10px',
      borderRadius: 12,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: tag === 'all' ? '#e8c56a' : dark ? '#333' : '#eee',
      color: tag === 'all' ? '#1a1a1a' : DK.text(dark),
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "All"), allTags.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTag(t),
    style: {
      padding: '4px 10px',
      borderRadius: 12,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: tag === t ? '#e8c56a' : dark ? '#333' : '#eee',
      color: tag === t ? '#1a1a1a' : DK.text(dark),
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, TAG_NAMES[t] || t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShuffle(v => !v),
    style: {
      padding: '4px 10px',
      borderRadius: 12,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: shuffle ? '#e8c56a' : dark ? '#333' : '#eee',
      color: shuffle ? '#1a1a1a' : DK.text(dark),
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\uD83D\uDD00 ", shuffle ? 'ON' : 'OFF'), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setScore({
        c: 0,
        t: 0
      });
    },
    style: {
      padding: '4px 10px',
      borderRadius: 12,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: dark ? '#333' : '#eee',
      color: DK.text(dark),
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "Reset Score"))), current && /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.card(dark),
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderRadius: 10,
      padding: '16px',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 10,
      background: current.difficulty === 'easy' ? '#27ae60' : current.difficulty === 'medium' ? '#e67e22' : '#c0392b',
      color: '#fff'
    }
  }, current.difficulty), current.tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 10,
      background: dark ? '#333' : '#ddd',
      color: DK.text(dark)
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: DK.text(dark),
      lineHeight: 1.7,
      marginBottom: 8
    }
  }, current.stem), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 'bold',
      color: DK.sub(dark),
      marginBottom: 12
    }
  }, current.question), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, current.options.map(o => {
    const isSel = selected === o.letter;
    const isAns = o.letter === current.answer;
    let bg, border, txt;
    if (!answered) {
      bg = dark ? '#1a1a1a' : '#fefefe';
      border = DK.border(dark);
      txt = DK.text(dark);
    } else if (isSel && isAns) {
      bg = dark ? '#1a3a1a' : '#d4edda';
      border = '#27ae60';
      txt = '#27ae60';
    } else if (isSel && !isAns) {
      bg = dark ? '#3a1a1a' : '#f8d7da';
      border = '#c0392b';
      txt = '#c0392b';
    } else if (isAns) {
      bg = dark ? '#1a2a1a' : '#e8f5ee';
      border = '#27ae60';
      txt = '#27ae60';
    } else {
      bg = dark ? '#1a1a1a' : '#fefefe';
      border = DK.border(dark);
      txt = DK.muted(dark);
    }
    return /*#__PURE__*/React.createElement("button", {
      key: o.letter,
      onClick: () => handleSelect(o.letter),
      style: {
        padding: '10px 12px',
        borderRadius: 6,
        border: `1px solid ${border}`,
        background: bg,
        color: txt,
        fontSize: 13,
        cursor: answered ? 'default' : 'pointer',
        fontFamily: 'Georgia,serif',
        textAlign: 'left',
        lineHeight: 1.5,
        transition: 'all 0.15s',
        opacity: answered && !isSel && !isAns ? 0.5 : 1
      }
    }, /*#__PURE__*/React.createElement("strong", {
      style: {
        marginRight: 8
      }
    }, o.letter, "."), " ", o.text);
  })), answered && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: '12px',
      borderRadius: 8,
      background: dark ? '#1a1a1a' : '#fafafa',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderLeft: `3px solid ${isCorrect ? '#27ae60' : '#c0392b'}`,
      animation: 'fadeIn 0.3s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 'bold',
      color: isCorrect ? '#27ae60' : '#c0392b'
    }
  }, isCorrect ? '\u2713 Correct' : `\u2717 Incorrect \u2014 answer is ${current.answer}`), current.disorderId && /*#__PURE__*/React.createElement("span", {
    onClick: () => handleViewDisorder(current.disorderId),
    style: {
      fontSize: 10,
      padding: '3px 10px',
      borderRadius: 8,
      background: '#2980b9',
      color: '#fff',
      cursor: 'pointer'
    }
  }, "\uD83D\uDCD6 View Disorder Card")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, current.explanation)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '12px 16px',
      background: dark ? 'rgba(15,15,15,0.97)' : 'rgba(250,247,242,0.97)',
      borderTop: `1px solid ${DK.border(dark)}`,
      zIndex: 10
    }
  }, answered ? /*#__PURE__*/React.createElement("button", {
    onClick: handleNext,
    style: {
      width: '100%',
      padding: 13,
      borderRadius: 8,
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      background: '#e8c56a',
      color: '#1a1a1a',
      fontSize: 15,
      fontWeight: 'bold',
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, idx + 1 >= queue.length ? '\uD83D\uDD04 Restart Queue' : 'Next Case \u2192') : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 11,
      color: DK.muted(dark)
    }
  }, "Select an answer above")), /*#__PURE__*/React.createElement("style", null, `@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`), showDisorder && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowDisorder(null),
    style: {
      position: 'absolute',
      inset: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: DK.surface(dark),
      borderRadius: '14px 14px 0 0',
      padding: '24px 24px 32px',
      width: '100%',
      maxWidth: 680,
      maxHeight: '82vh',
      overflowY: 'auto',
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      fontSize: 11,
      padding: '2px 10px',
      borderRadius: 20,
      background: (CAT_META[showDisorder.cat]?.color || '#666') + '22',
      color: CAT_META[showDisorder.cat]?.color || '#666',
      marginBottom: 14,
      fontFamily: 'monospace'
    }
  }, showDisorder.cat, " \u2014 ", CAT_META[showDisorder.cat]?.label), showDisorder.important && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      fontSize: 16
    }
  }, "\u2B50"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 12,
      lineHeight: 1.3
    }
  }, showDisorder.disorder)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDisorder(null),
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: DK.muted(dark),
      cursor: 'pointer',
      fontSize: 22,
      padding: '0 0 0 12px'
    }
  }, "\xD7")), FIELDS.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.key,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: DK.muted(dark),
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 3
    }
  }, f.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, showDisorder[f.key]))), showDisorder.imageUrl && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: DK.muted(dark),
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 3
    }
  }, "Diagram"), /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      const w = window.open('');
      w.document.write(`<img src="${showDisorder.imageUrl}" style="max-width:100%;height:auto;display:block;margin:auto">`);
    },
    style: {
      cursor: 'zoom-in',
      borderRadius: 10,
      overflow: 'hidden',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: showDisorder.imageUrl,
    alt: "diagram",
    style: {
      width: '100%',
      maxHeight: 220,
      objectFit: 'contain',
      display: 'block',
      background: DK.bg(dark)
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      right: 10,
      background: 'rgba(0,0,0,0.45)',
      color: '#fff',
      fontSize: 11,
      padding: '3px 9px',
      borderRadius: 12,
      pointerEvents: 'none'
    }
  }, "\uD83D\uDD0D Tap to zoom"))))));
}

// \u2500\u2500 Normal Values & RDA Viewer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function NormalValuesView({
  data,
  dark,
  onBack
}) {
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState(data.length > 0 ? data[0].id : null);
  const [expanded, setExpanded] = useState(null);
  const filtered = data.map(s => ({
    ...s,
    entries: s.entries.filter(e => !search.trim() || e.name.toLowerCase().includes(search.toLowerCase()) || (e.abbr || '').toLowerCase().includes(search.toLowerCase()) || (e.note || '').toLowerCase().includes(search.toLowerCase()))
  })).filter(s => s.entries.length > 0);
  const sections = search.trim() ? filtered : data;
  const isSearching = search.trim().length > 0;
  const cell = {
    padding: '5px 6px',
    fontSize: 12,
    color: dark ? '#ccc' : '#333',
    borderBottom: `1px solid ${dark ? '#222' : '#eee'}`,
    verticalAlign: 'top',
    lineHeight: 1.4,
    wordBreak: 'break-word'
  };
  const cellH = {
    padding: '5px 6px',
    fontSize: 10,
    color: dark ? '#666' : '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottom: `1px solid ${dark ? '#333' : '#ddd'}`,
    whiteSpace: 'nowrap',
    textAlign: 'left'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '13px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1
    }
  }, "Normal Values & RDA"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 20,
      background: '#333',
      color: '#aaa',
      fontFamily: 'monospace'
    }
  }, data.reduce((s, x) => s + x.entries.length, 0))), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search analyte, abbreviation, or note\u2026",
    style: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: 8,
      border: '1px solid #444',
      background: '#222',
      color: '#faf7f2',
      fontSize: 13,
      fontFamily: 'Georgia,serif',
      outline: 'none',
      boxSizing: 'border-box'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 12px 40px'
    }
  }, sections.map((sec, si) => /*#__PURE__*/React.createElement("div", {
    key: sec.id,
    style: {
      marginBottom: 12,
      borderRadius: 10,
      border: `1px solid ${dark ? '#2a2a2a' : '#e8e2d9'}`,
      overflow: 'hidden',
      background: DK.card(dark)
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setOpenSection(o => o === sec.id ? null : sec.id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '11px 14px',
      cursor: 'pointer',
      userSelect: 'none',
      background: dark ? '#1a1a1a' : DK.surface(dark),
      borderBottom: openSection === sec.id ? `1px solid ${dark ? '#2a2a2a' : '#e8e2d9'}` : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, sec.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 'bold',
      color: DK.text(dark)
    }
  }, sec.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: DK.muted(dark)
    }
  }, sec.entries.length), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: DK.muted(dark),
      transform: openSection === sec.id ? 'rotate(180deg)' : 'rotate(0)',
      transition: 'transform 0.2s'
    }
  }, "\u25BC")), (isSearching || openSection === sec.id) && /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 12,
      tableLayout: 'fixed'
    }
  }, /*#__PURE__*/React.createElement("colgroup", null, /*#__PURE__*/React.createElement("col", {
    style: {
      width: '30%'
    }
  }), /*#__PURE__*/React.createElement("col", {
    style: {
      width: '8%'
    }
  }), /*#__PURE__*/React.createElement("col", {
    style: {
      width: '25%'
    }
  }), /*#__PURE__*/React.createElement("col", {
    style: {
      width: '17%'
    }
  }), /*#__PURE__*/React.createElement("col", {
    style: {
      width: '20%'
    }
  })), /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: dark ? '#111' : '#fafafa'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: cellH
  }, "Analyte"), /*#__PURE__*/React.createElement("th", {
    style: cellH
  }, "Samp"), /*#__PURE__*/React.createElement("th", {
    style: cellH
  }, "Range"), /*#__PURE__*/React.createElement("th", {
    style: cellH
  }, "SI"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...cellH,
      background: dark ? '#1a2a1a' : '#f0f8e8',
      color: dark ? '#8d8' : '#3a6a3a'
    }
  }, "Note"))), /*#__PURE__*/React.createElement("tbody", null, sec.entries.map(e => /*#__PURE__*/React.createElement("tr", {
    key: e.name,
    style: {
      background: expanded === e.name ? dark ? '#1a1a2a' : '#f5f8ff' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: cell
  }, /*#__PURE__*/React.createElement("strong", null, e.name), e.abbr ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: DK.muted(dark),
      marginLeft: 4,
      fontSize: 11
    }
  }, "(", e.abbr, ")") : null), /*#__PURE__*/React.createElement("td", {
    style: {
      ...cell,
      fontSize: 11,
      color: DK.muted(dark),
      whiteSpace: 'nowrap'
    }
  }, e.sample || '\u2014'), /*#__PURE__*/React.createElement("td", {
    style: cell
  }, e.range, /*#__PURE__*/React.createElement("span", {
    style: {
      color: DK.muted(dark),
      marginLeft: 3,
      fontSize: 11
    }
  }, e.unit)), /*#__PURE__*/React.createElement("td", {
    style: {
      ...cell,
      color: DK.sub(dark),
      fontSize: 11
    }
  }, e.si ? `${e.si} ${e.siUnit}` : '\u2014'), /*#__PURE__*/React.createElement("td", {
    style: {
      ...cell,
      fontSize: 11,
      color: DK.text(dark),
      lineHeight: 1.4,
      background: dark ? '#1a2410' : '#f8fae8',
      borderLeft: `2px solid ${dark ? '#4a6a2a' : '#8aaa4a'}`
    }
  }, e.note || '')))))))), sections.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: 40,
      color: DK.muted(dark)
    }
  }, "No matching entries found.")));
}

function formatClinicalText(text, sub, textDark) {
  if (!text) return null;
  const sentences = text.split(/(?<=\.)\s+/).filter(Boolean);
  return sentences.map((s, i) => {
    const colonIdx = s.indexOf(':');
    if (colonIdx > 0) {
      const topic = s.substring(0, colonIdx + 1);
      const desc = s.substring(colonIdx + 1);
      return React.createElement('div', { key: i, style: { marginBottom: 4, lineHeight: 1.5, fontSize: 12, color: sub, wordBreak: 'break-word' } },
        React.createElement('strong', { style: { color: textDark } }, topic),
        desc
      );
    }
    return React.createElement('div', { key: i, style: { marginBottom: 4, lineHeight: 1.5, fontSize: 12, color: sub, wordBreak: 'break-word' } }, s);
  });
}

// \u2500\u2500 Vitamins Viewer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function VitaminsView({
  data,
  allDisorders,
  pathways,
  dark,
  onBack,
  onOpenDisorder,
  onOpenPathway,
  initialVitamin
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [importantOnly, setImportantOnly] = useState(false);
  const [sel, setSel] = useState(initialVitamin || null);
  const [cyclesOpen, setCyclesOpen] = useState(true);
  const vitaminColor = v => v.type === 'fat-soluble' ? '#e67e22' : '#27ae60';
  const filtered = data.filter(v => {
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    if (importantOnly && !v.important) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (v.name || '').toLowerCase().includes(q) || (v.alias || '').toLowerCase().includes(q) || (v.coenzyme || '').toLowerCase().includes(q) || (v.deficiency?.name || '').toLowerCase().includes(q) || (v.enzymes || []).some(e => e.toLowerCase().includes(q));
  });
  const cardStyle = v => ({
    background: DK.card(dark),
    borderTop: `1px solid ${DK.cardBdr(dark)}`,
    borderRight: `1px solid ${DK.cardBdr(dark)}`,
    borderBottom: `1px solid ${DK.cardBdr(dark)}`,
    borderLeft: `3px solid ${vitaminColor(v)}`,
    borderRadius: 6,
    padding: '12px 14px',
    cursor: 'pointer'
  });
  const fl = {
    marginBottom: 14
  };
  const flbl = {
    fontSize: 10,
    color: DK.muted(dark),
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3
  };
  const fval = {
    fontSize: 13,
    color: DK.sub(dark),
    lineHeight: 1.6
  };
  const sectionBox = {
    ...fl,
    padding: 12,
    borderRadius: 8,
    background: dark ? '#1a1a1a' : '#f8f6f2',
    border: `1px solid ${DK.border(dark)}`
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '13px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1
    }
  }, "Vitamins"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 20,
      background: '#333',
      color: '#aaa',
      fontFamily: 'monospace'
    }
  }, data.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search vitamin, coenzyme, enzyme, deficiency\u2026",
    style: {
      flex: 1,
      minWidth: 180,
      padding: '8px 12px',
      borderRadius: 8,
      border: '1px solid #444',
      background: '#222',
      color: '#faf7f2',
      fontSize: 13,
      fontFamily: 'Georgia,serif',
      outline: 'none',
      boxSizing: 'border-box'
    }
  }), ['all', 'water-soluble', 'fat-soluble'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTypeFilter(t),
    style: {
      padding: '5px 12px',
      borderRadius: 4,
      border: `1px solid ${typeFilter === t ? '#27ae60' : '#444'}`,
      background: typeFilter === t ? '#27ae6022' : 'transparent',
      color: typeFilter === t ? '#27ae60' : '#aaa',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: 'Georgia,serif',
      textTransform: 'capitalize'
    }
  }, t.replace('-', ' & '))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setImportantOnly(v => !v),
    style: {
      padding: '5px 12px',
      borderRadius: 4,
      border: `1px solid ${importantOnly ? '#f1c40f' : '#444'}`,
      background: importantOnly ? '#f1c40f22' : 'transparent',
      color: importantOnly ? '#f1c40f' : '#aaa',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: 'Georgia,serif'
    }
  }, "\u2B50 ", importantOnly ? 'All' : 'Important'))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '14px 16px 40px',
      maxWidth: 1160,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }
  }, filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: 40,
      color: DK.muted(dark)
    }
  }, "No vitamins match your filters."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
      gap: 10
    }
  }, filtered.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    style: cardStyle(v),
    onClick: () => setSel(v)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: DK.muted(dark),
      fontFamily: 'monospace',
      marginBottom: 3
    }
  }, v.alias, " \xB7 ", v.type), v.important && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1
    }
  }, "\u2B50")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 3,
      lineHeight: 1.3
    }
  }, v.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: vitaminColor(v),
      marginBottom: 2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      wordBreak: 'break-word'
    }
  }, v.coenzyme), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: DK.sub(dark),
      marginTop: 4,
      lineHeight: 1.4
    }
  }, (v.enzymes || []).slice(0, 3).join(', '), v.enzymes.length > 3 ? ` +${v.enzymes.length - 3} more` : ''), v.deficiency && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: '4px 8px',
      borderRadius: 4,
      background: dark ? '#2a1a1a' : '#fff5f5',
      fontSize: 11,
      color: '#c0392b',
      lineHeight: 1.3
    }
  }, "\u2695\uFE0F ", v.deficiency.name))))), sel && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    },
    onClick: () => setSel(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.surface(dark),
      borderRadius: '14px 14px 0 0',
      padding: '24px 24px 32px',
      width: '100%',
      maxWidth: 680,
      maxHeight: '82vh',
      overflowY: 'auto'
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      fontSize: 11,
      padding: '2px 12px',
      borderRadius: 20,
      background: vitaminColor(sel) + '22',
      color: vitaminColor(sel),
      marginBottom: 14,
      fontFamily: 'monospace'
    }
  }, sel.alias, " \xB7 ", sel.type), sel.important && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      fontSize: 16
    }
  }, "\u2B50"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 12,
      lineHeight: 1.3
    }
  }, sel.name)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSel(null),
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: DK.muted(dark),
      cursor: 'pointer',
      fontSize: 22,
      padding: '0 0 0 12px'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: sectionBox
  }, /*#__PURE__*/React.createElement("div", {
    style: flbl
  }, "Coenzyme Form"), formatClinicalText(sel.coenzyme, DK.sub(dark), DK.text(dark))), /*#__PURE__*/React.createElement("div", {
    style: sectionBox
  }, /*#__PURE__*/React.createElement("div", {
    style: flbl
  }, "Enzymes (", sel.enzymes.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...fval,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }
   }, sel.enzymes.join('\n'))),

  /* Chemical Nature / Forms */
  sel.chemicalNature && /*#__PURE__*/React.createElement("div", { style: sectionBox }, /*#__PURE__*/React.createElement("div", { style: flbl }, "Chemical Nature / Forms"), formatClinicalText(sel.chemicalNature, DK.sub(dark), DK.text(dark))),

  /* Biochemical Functions */
  sel.functions && sel.functions.length > 0 && /*#__PURE__*/React.createElement("div", { style: sectionBox }, /*#__PURE__*/React.createElement("div", { style: flbl }, "Biochemical Functions"), formatClinicalText(sel.functions.join('\n'), DK.sub(dark), DK.text(dark))),

  /* Absorption / Transport / Storage */
  sel.absorption && /*#__PURE__*/React.createElement("div", { style: sectionBox }, /*#__PURE__*/React.createElement("div", { style: flbl }, "Absorption / Transport / Storage"), formatClinicalText(sel.absorption, DK.sub(dark), DK.text(dark))),

  /* RDA */
  sel.rda && /*#__PURE__*/React.createElement("div", { style: sectionBox }, /*#__PURE__*/React.createElement("div", { style: flbl }, "RDA"), formatClinicalText(sel.rda, DK.sub(dark), DK.text(dark))),

  /* Dietary Sources */
  sel.sources && /*#__PURE__*/React.createElement("div", { style: sectionBox }, /*#__PURE__*/React.createElement("div", { style: flbl }, "Dietary Sources"), formatClinicalText(sel.sources, DK.sub(dark), DK.text(dark))),

  /* Inhibitors / Antagonists */
  sel.inhibitors && /*#__PURE__*/React.createElement("div", { style: sectionBox }, /*#__PURE__*/React.createElement("div", { style: flbl }, "Inhibitors / Antagonists"), formatClinicalText(sel.inhibitors, DK.sub(dark), DK.text(dark))),

  /* Biochemical Cycle */
  sel.cycles && sel.cycles.length > 0 && /*#__PURE__*/React.createElement("div", { style: { ...fl, border: `1px solid ${DK.border(dark)}`, borderRadius: 8, overflow: 'hidden' } }, /*#__PURE__*/React.createElement("div", { onClick: () => setCyclesOpen(o => !o), style: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer', background: dark ? '#1a1a2a' : '#f0f4fa', userSelect: 'none' } }, /*#__PURE__*/React.createElement("span", { style: { fontSize: 12, color: DK.muted(dark), transition: 'transform 0.2s', transform: cyclesOpen ? 'rotate(90deg)' : 'rotate(0deg)' } }, "\u25B6"), /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, fontWeight: 'bold', color: DK.text(dark), flex: 1 } }, "Biochemical Cycle (", sel.cycles.length, " steps)")), cyclesOpen && /*#__PURE__*/React.createElement("div", { style: { padding: '4px 12px 12px' } }, sel.cycles.map((c, i) => /*#__PURE__*/React.createElement("div", { key: i, style: { marginTop: i === 0 ? 0 : 12 } }, /*#__PURE__*/React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } }, /*#__PURE__*/React.createElement("span", { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: dark ? '#2a3a4a' : '#d0dce8', color: dark ? '#8ab' : '#2a4a6e', fontSize: 11, fontWeight: 'bold', flexShrink: 0 } }, c.step || i + 1), i < sel.cycles.length - 1 && /*#__PURE__*/React.createElement("span", { style: { flex: 1, height: 1, background: DK.border(dark) } })), /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, fontWeight: 'bold', color: DK.text(dark), marginBottom: 3 } }, c.title), /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: DK.sub(dark), lineHeight: 1.5, marginBottom: 4, wordBreak: 'break-word' } }, c.description), /*#__PURE__*/React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 4 } }, c.location && /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, padding: '1px 8px', borderRadius: 10, background: dark ? '#1a2a1a' : '#e8f5e8', color: '#2d8a4e' } }, "\uD83D\uDCCD ", c.location), c.enzyme && /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, padding: '1px 8px', borderRadius: 10, background: dark ? '#2a1a2a' : '#f5e8f5', color: '#8a4e8a' } }, "\u2697\uFE0F ", c.enzyme)))))), sel.deficiency && /*#__PURE__*/React.createElement("div", {
    style: {
      ...fl,
      padding: 12,
      borderRadius: 8,
      background: dark ? '#2a1a1a' : '#fff5f5',
      border: `1px solid ${dark ? '#3a2a2a' : '#fdd'}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#c0392b',
      marginBottom: 4
    }
  }, "\u26A0\uFE0F ", sel.deficiency.name), sel.deficiency.findings && sel.deficiency.findings.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 6
    }
  }, sel.deficiency.findings.map((f, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 12,
      background: dark ? '#3a2a2a' : '#fde8e8',
      color: dark ? '#e88' : '#c0392b'
    }
  }, f))), formatClinicalText(sel.deficiency.clinical, DK.sub(dark), DK.text(dark))), /*#__PURE__*/React.createElement("div", {
    style: sectionBox
  }, /*#__PURE__*/React.createElement("div", {
    style: flbl
  }, "Toxicity"), formatClinicalText(sel.toxicity, DK.sub(dark), DK.text(dark))), sel.mnemonic && /*#__PURE__*/React.createElement("div", {
    style: {
      ...fl,
      padding: 11,
      borderRadius: 8,
      background: dark ? '#1a2a1a' : '#f0fff5',
      border: `1px solid ${dark ? '#2a3a2a' : '#d0edd0'}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#27ae60',
      marginBottom: 2
    }
  }, "\uD83E\uDDE0 Mnemonic"), formatClinicalText(sel.mnemonic, DK.sub(dark), DK.text(dark))), sel.relatedDisorderIds && sel.relatedDisorderIds.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: sectionBox
  }, /*#__PURE__*/React.createElement("div", {
    style: flbl
  }, "Related Disorders"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, sel.relatedDisorderIds.map(id => {
    const d = allDisorders.find(x => x.id === id);
    if (!d) return null;
    return /*#__PURE__*/React.createElement("span", {
      key: id,
      onClick: () => onOpenDisorder(d, sel),
      style: {
        padding: '5px 13px',
        borderRadius: 20,
        border: `1px solid #2980b9`,
        background: dark ? '#1a2a3a' : '#eaf4fb',
        color: '#2980b9',
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif',
        display: 'inline-block'
      }
    }, "\uD83E\uDDEC ", d.disorder);
  }))), sel.pathwayIds && sel.pathwayIds.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: sectionBox
  }, /*#__PURE__*/React.createElement("div", {
    style: flbl
  }, "Related Pathways"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, sel.pathwayIds.map(id => {
    const p = pathways.find(x => x.id === id);
    if (!p) return null;
    return /*#__PURE__*/React.createElement("span", {
      key: id,
      onClick: () => onOpenPathway(p),
      style: {
        padding: '5px 13px',
        borderRadius: 20,
        border: `1px solid ${p.color || '#888'}`,
        background: dark ? (p.color || '#888') + '18' : (p.color || '#888') + '10',
        color: p.color || '#888',
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'Georgia,serif',
        display: 'inline-block'
      }
    }, "\uD83D\uDD2C ", p.name);
  }))))));
}

// \u2500\u2500 Main App \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function App() {
  const [dark, setDark] = useDarkMode();
  const [allData, setAllData] = useState([]);
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [screen, setScreen] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [adminConfig, setAdmin] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const [mode, setMode] = useState("browse");
  const [catFilter, setCatFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [importantOnly, setImportantOnly] = useState(false);
  const [sel, setSel] = useState(null);
  const [prevScreen, setPrevScreen] = useState(null);
  const [prevSel, setPrevSel] = useState(null);
  const [prevPathway, setPrevPathway] = useState(null);
  const [prevVitaminSel, setPrevVitaminSel] = useState(null);
  const [prevMineralSel, setPrevMineralSel] = useState(null);
  const [openPathway, setOpenPathway] = useState(null);
  function navigateTo(s) {
    setPrevScreen(screen);
    setPrevSel(sel);
    setPrevPathway(openPathway);
    setScreen(s);
  }
  function goBack() {
    if (prevScreen) {
      setScreen(prevScreen);
      setSel(prevSel);
      setOpenPathway(prevPathway);
      setPrevScreen(null);
      setPrevSel(null);
      setPrevPathway(null);
      setTimeout(() => setPrevVitaminSel(null), 0);
      setTimeout(() => setPrevMineralSel(null), 0);
    } else {
      setScreen('home');
    }
  }
  const [normalVals, setNormalVals] = useState([]);
  const [vitamins, setVitamins] = useState([]);
  const [minerals, setMinerals] = useState([]);
  const [vignettes, setVignettes] = useState([]);
  const [openVignette, setOpenVignette] = useState(null);
  const [clinicalCases, setClinicalCases] = useState([]);
  const [visibility, setVisibility] = useState({ disorders: true, pathways: true, 'normal-values': true, vitamins: true, minerals: true, physiology: true, feed: true, 'clinical-vignettes': true, 'clinical-cases': true, vignettes: true, 'biochem-home': true, 'physio-viva': true, 'physio-reflexes-explorer': true, 'physio-notes': true, 'physio-clinical': true });
  const [physioViva, setPhysioViva] = useState([]);
  const [physioReflexDetails, setPhysioReflexDetails] = useState([]);
  const [physioNotes, setPhysioNotes] = useState([]);
  const [physioClinical, setPhysioClinical] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const physioRef = useRef(null);
  const feedRef = useRef(null);
  const darkRef = useRef(dark);
  useEffect(() => { darkRef.current = dark; }, [dark]);
  const [physioMode, setPhysioMode] = useState('home');
  const [physioCat, setPhysioCat] = useState('All');
  const [physioSearch, setPhysioSearch] = useState('');
  useEffect(() => {
    if (physioRef.current && screen === 'physiology') {
      physioRef.current.contentWindow.postMessage({
        type: 'theme',
        dark
      }, '*');
      physioRef.current.contentWindow.postMessage({
        type: 'physio-nav-set',
        mode: physioMode,
        cat: physioCat,
        search: physioSearch
      }, '*');
      physioRef.current.contentWindow.postMessage({
        type: 'physio-visibility',
        viva: visibility['physio-viva'],
        reflexExplorer: visibility['physio-reflexes-explorer'],
        notes: visibility['physio-notes'],
        clinical: visibility['physio-clinical']
      }, '*');
    }
  }, [dark, screen, physioMode, physioCat, physioSearch, visibility]);
  useEffect(() => {
    if (feedRef.current && screen === 'feed') {
      feedRef.current.contentWindow.postMessage({
        type: 'theme',
        dark
      }, '*');
    }
  }, [dark, screen]);
  useEffect(() => {
    function onMessage(e) {
      const origin = e.origin || '';
      const loc = window.location;
      const trusted = origin === loc.origin || origin === 'http://localhost:8000' || origin === 'https://localhost:8000' || origin === 'http://127.0.0.1:8000' || origin === 'https://127.0.0.1:8000';
      if (!trusted) return;
      if (e.data && e.data.type === 'theme-from-physio') {
        if (typeof e.data.dark === 'boolean' && e.data.dark !== darkRef.current) {
          setDark(e.data.dark);
        }
      }
      if (e.data && e.data.type === 'physio-request-theme') {
        if (physioRef.current) physioRef.current.contentWindow.postMessage({ type: 'theme', dark: darkRef.current }, '*');
      }
      if (e.data && e.data.type === 'feed-request-theme') {
        if (feedRef.current) feedRef.current.contentWindow.postMessage({ type: 'theme', dark: darkRef.current }, '*');
      }
      if (e.data && e.data.type === 'theme-from-feed') {
        if (typeof e.data.dark === 'boolean' && e.data.dark !== darkRef.current) {
          setDark(e.data.dark);
        }
      }
      if (e.data && e.data.type === 'physio-nav') {
        setPhysioMode(e.data.mode || 'home');
        setPhysioCat(e.data.cat || 'All');
        setPhysioSearch(e.data.search || '');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  const [deck, setDeck] = useState([]);
  const [fcIdx, setFcIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [qDeck, setQDeck] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [qField, setQField] = useState(FIELDS[0]);
  const [revealed, setRev] = useState(false);
  const [score, setScore] = useState({
    c: 0,
    w: 0
  });
  const [done, setDone] = useState(false);
  useEffect(() => {
    Promise.all([fetch('data/disorders.json').then(r => {
      if (!r.ok) throw new Error('data/disorders.json not found');
      return r.json();
    }), fetch('data/pathways.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('data/normal_values.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('data/vitamins.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('data/minerals.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('data/vignettes.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('data/cases.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('visibility.json').then(r => r.ok ? r.json() : {}).catch(() => ({})), fetch('physio/viva.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('physio/reflex_details.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('physio/notes.json').then(r => r.ok ? r.json() : []).catch(() => []), fetch('physio/clinical.json').then(r => r.ok ? r.json() : []).catch(() => [])]).then(([data, paths, nv, vits, mins, vign, cases, vis, pVi, pRD, pNo, pCl]) => {
      setAllData(data);
      setPathways(paths);
      setNormalVals(nv);
      setVitamins(vits);
      setMinerals(mins);
      setVignettes(vign);
      setClinicalCases(cases);
      if (vis && typeof vis === 'object') setVisibility(prev => ({ ...prev, ...vis }));
      setPhysioViva(pVi);
      setPhysioReflexDetails(pRD);
      setPhysioNotes(pNo);
      setPhysioClinical(pCl);
      setLoading(false);
    }).catch(e => {
      setLoadErr(e.message);
      setLoading(false);
    });
  }, []);
  const fromHash = useRef(false);
  function applyHash(hash) {
    const h = (hash || '').replace(/^#/, '') || '/';
    const [p, qs] = h.split('?');
    const par = Object.fromEntries(new URLSearchParams(qs || ''));
    if (p === '/') {
      setScreen('home');
      setSel(null);
      setOpenPathway(null);
    } else if (p === '/disorders') {
      setScreen('disorders');
      setMode(par.mode || 'browse');
      setSearch(par.search || '');
      setCatFilter(par.cat || 'ALL');
      setImportantOnly(par.important === '1');
      setSel(null);
      setOpenPathway(null);
    } else if (p.startsWith('/disorder/')) {
      const id = Number(p.split('/')[2]);
      const d = allData.find(x => x.id === id || x.num === id);
      setScreen('disorders');
      setMode('browse');
      setSel(d || id);
      setOpenPathway(null);
    } else if (p === '/biochem') {
      setScreen('biochem-home');
      setOpenPathway(null);
      setSel(null);
    } else if (p === '/pathways') {
      setScreen('pathways');
      setOpenPathway(null);
      setSel(null);
    } else if (p.startsWith('/pathway/')) {
      const id = Number(p.split('/')[2]);
      const pw = pathways.find(x => x.id === id);
      setScreen('pathways');
      setSel(null);
      setOpenPathway(pw ? par.step ? {
        ...pw,
        jumpToStep: Number(par.step)
      } : pw : id);
    } else if (p === '/normal-values') {
      setScreen('normal-values');
      setSel(null);
      setOpenPathway(null);
    } else if (p === '/minerals') {
      setScreen('minerals');
      setSel(null);
      setOpenPathway(null);
    } else if (p.startsWith('/physiology')) {
      setScreen('physiology');
      setSel(null);
      setOpenPathway(null);
      const sub = p.split('/')[2] || 'home';
      setPhysioMode(sub === 'browse' || sub === 'quiz' || sub === 'reflex' || sub === 'reflexDetails' ? sub : 'home');
      setPhysioCat(par.cat || 'All');
      setPhysioSearch(par.search || '');
    } else if (p === '/vignettes') {
      setScreen('vignettes');
      setOpenVignette(null);
    } else if (p.startsWith('/vignette/')) {
      const id = Number(p.split('/')[2]);
      const v = vignettes.find(x => x.id === id);
      setScreen('vignettes');
      setOpenVignette(v || id);
    } else if (p === '/clinical-cases') {
      setScreen('clinical-cases');
      setSel(null);
    } else if (p === '/clinical-vignettes') {
      setScreen('clinical-vignettes');
      setSel(null);
    } else if (p === '/feed') {
      setScreen('feed');
      setSel(null);
    }
  }
  useEffect(() => {
    const h = window.location.hash;
    if (h && h !== '#' && h !== '#/') {
      if (loading) return;
      fromHash.current = true;
      applyHash(h);
    }
  }, [loading]);
  useEffect(() => {
    function onChange() {
      const h = window.location.hash;
      if (fromHash.current) {
        fromHash.current = false;
        return;
      }
      if (loading) return;
      applyHash(h);
    }
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [allData, pathways, vignettes, clinicalCases, loading]);
  useEffect(() => {
    if (fromHash.current) {
      fromHash.current = false;
      return;
    }
    if (adminConfig) return;
    if (screen === 'home') {
      window.location.hash = '#/';
      return;
    }
    if (screen === 'disorders') {
      if (sel) {
        const id = sel.id || sel;
        window.location.hash = `#/disorder/${id}`;
        return;
      }
      const p = new URLSearchParams();
      if (mode !== 'browse') p.set('mode', mode);
      if (search) p.set('search', search);
      if (catFilter !== 'ALL') p.set('cat', catFilter);
      if (importantOnly) p.set('important', '1');
      const qs = p.toString();
      window.location.hash = `#/disorders${qs ? '?' + qs : ''}`;
      return;
    }
    if (screen === 'biochem-home') {
      window.location.hash = '#/biochem';
      return;
    }
    if (screen === 'pathways') {
      if (openPathway) {
        const id = openPathway.id || openPathway;
        const p = new URLSearchParams();
        if (openPathway.jumpToStep) p.set('step', openPathway.jumpToStep);
        const qs = p.toString();
        window.location.hash = `#/pathway/${id}${qs ? '?' + qs : ''}`;
        return;
      }
      window.location.hash = '#/pathways';
      return;
    }
    if (screen === 'normal-values') {
      window.location.hash = '#/normal-values';
      return;
    }
    if (screen === 'vitamins') {
      window.location.hash = '#/vitamins';
      return;
    }
    if (screen === 'minerals') {
      window.location.hash = '#/minerals';
      return;
    }
    if (screen === 'physiology') {
      const base = '#/physiology';
      const mode = physioMode === 'home' ? '' : physioMode;
      const params = new URLSearchParams();
      if (physioCat && physioCat !== 'All') params.set('cat', physioCat);
      if (physioSearch) params.set('search', physioSearch);
      const qs = params.toString();
      const hash = base + (mode ? '/' + mode : '') + (qs ? '?' + qs : '');
      if (window.location.hash !== hash) {
        fromHash.current = true;
        window.location.hash = hash;
      }
      return;
    }
    if (screen === 'vignettes') {
      if (openVignette) {
        window.location.hash = `#/vignette/${openVignette.id || openVignette}`;
        return;
      }
      window.location.hash = '#/vignettes';
      return;
    }
    if (screen === 'clinical-cases') {
      window.location.hash = '#/clinical-cases';
      return;
    }
    if (screen === 'clinical-vignettes') {
      window.location.hash = '#/clinical-vignettes';
      return;
    }
    if (screen === 'feed') {
      window.location.hash = '#/feed';
      return;
    }
  }, [screen, sel, mode, openPathway, search, catFilter, importantOnly, adminConfig, openVignette, physioMode, physioCat, physioSearch]);
  function handleFooterTap() {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setTapCount(0);
      setShowLogin(true);
    }
    setTimeout(() => setTapCount(0), 3000);
  }
  function handleLogin(config) {
    setAdmin(config);
    setAllData(config.data);
    setShowLogin(false);
  }
  function handleLogout() {
    setAdmin(null);
    fetch('data/disorders.json').then(r => r.json()).then(setAllData);
    fetch('data/pathways.json').then(r => r.ok ? r.json() : []).then(setPathways).catch(() => {});
    fetch('data/vitamins.json').then(r => r.ok ? r.json() : []).then(setVitamins).catch(() => {});
    fetch('data/vignettes.json').then(r => r.ok ? r.json() : []).then(setVignettes).catch(() => {});
    fetch('data/cases.json').then(r => r.ok ? r.json() : []).then(setClinicalCases).catch(() => {});
  }
  const filtered = allData.filter(d => {
    if (catFilter !== "ALL" && d.cat !== catFilter) return false;
    if (importantOnly && !d.important) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (d.disorder || '').toLowerCase().includes(q) || (d.defect || '').toLowerCase().includes(q) || (d.pathway || '').toLowerCase().includes(q) || (d.keyFeature || '').toLowerCase().includes(q);
  });
  const startFC = useCallback(() => {
    setDeck(shuffle(filtered));
    setFcIdx(0);
    setFlipped(false);
    setMode("flashcard");
  }, [filtered]);
  const startQuiz = useCallback(() => {
    const d = shuffle(filtered);
    setQDeck(d);
    setQIdx(0);
    setQField(FIELDS[Math.floor(Math.random() * FIELDS.length)]);
    setRev(false);
    setScore({
      c: 0,
      w: 0
    });
    setDone(false);
    setMode("quiz");
  }, [filtered]);
  const nextFC = dir => {
    setFlipped(false);
    setTimeout(() => setFcIdx(i => Math.max(0, Math.min(deck.length - 1, i + dir))), 100);
  };
  const markQ = correct => {
    setScore(s => ({
      c: s.c + (correct ? 1 : 0),
      w: s.w + (correct ? 0 : 1)
    }));
    if (qIdx + 1 >= qDeck.length) {
      setDone(true);
      return;
    }
    setQIdx(i => i + 1);
    setQField(FIELDS[Math.floor(Math.random() * FIELDS.length)]);
    setRev(false);
  };
  const cc = cat => CAT_META[cat]?.color || "#666";
  const card = deck[fcIdx];
  const qcard = qDeck[qIdx];
  const pct = score.c + score.w > 0 ? Math.round(score.c / (score.c + score.w) * 100) : 0;

  // Dark-mode aware style objects
  const s = {
    app: {
      minHeight: "100vh",
      background: DK.bg(dark),
      color: DK.text(dark),
      fontFamily: "'Georgia',serif",
      display: "flex",
      flexDirection: "column"
    },
    hdr: {
      background: DK.hdr(dark),
      color: "#faf7f2",
      padding: "16px 20px 14px",
      position: "sticky",
      top: 0,
      zIndex: 20,
      boxSizing: 'border-box'
    },
    htop: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 12
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      letterSpacing: "-0.5px",
      margin: 0,
      color: "#faf7f2"
    },
    badge: {
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 20,
      background: "#333",
      color: "#aaa",
      fontFamily: "monospace"
    },
    ctrl: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    },
    mBtn: (a, col) => ({
      padding: "6px 14px",
      borderRadius: 4,
      border: `1px solid ${a ? col || "#e8c56a" : "#444"}`,
      background: a ? (col || "#e8c56a") + "22" : "transparent",
      color: a ? col || "#e8c56a" : "#aaa",
      cursor: "pointer",
      fontSize: 12,
      fontFamily: "Georgia,serif"
    }),
    inp: {
      padding: "6px 12px",
      borderRadius: 4,
      border: "1px solid #444",
      background: DK.input(dark),
      color: "#faf7f2",
      fontSize: 12,
      fontFamily: "Georgia,serif",
      outline: "none",
      minWidth: 180,
      boxSizing: 'border-box'
    },
    catSel: {
      padding: "6px 10px",
      borderRadius: 4,
      border: "1px solid #444",
      background: DK.input(dark),
      color: "#faf7f2",
      fontSize: 12,
      fontFamily: "Georgia,serif",
      outline: "none",
      boxSizing: 'border-box'
    },
    body: {
      flex: 1,
      padding: "18px 16px 40px",
      maxWidth: 1160,
      margin: "0 auto",
      width: "100%",
      boxSizing: 'border-box'
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
      gap: 10
    },
    bc: cat => ({
      background: DK.card(dark),
      borderTop: `1px solid ${DK.cardBdr(dark)}`,
      borderRight: `1px solid ${DK.cardBdr(dark)}`,
      borderBottom: `1px solid ${DK.cardBdr(dark)}`,
      borderLeft: `3px solid ${cc(cat)}`,
      borderRadius: 6,
      padding: "12px 14px",
      cursor: "pointer"
    }),
    bnum: {
      fontSize: 10,
      color: DK.muted(dark),
      fontFamily: "monospace",
      marginBottom: 3
    },
    bname: {
      fontSize: 14,
      fontWeight: "bold",
      color: DK.text(dark),
      marginBottom: 3,
      lineHeight: 1.3
    },
    bsub: {
      fontSize: 11,
      color: DK.sub(dark),
      marginBottom: 2
    },
    mask: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      zIndex: 50,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center"
    },
    drw: {
      background: DK.surface(dark),
      borderRadius: "14px 14px 0 0",
      padding: "24px 24px 32px",
      width: "100%",
      maxWidth: 680,
      maxHeight: "82vh",
      overflowY: "auto"
    },
    dtag: cat => ({
      display: "inline-block",
      fontSize: 11,
      padding: "2px 10px",
      borderRadius: 20,
      background: cc(cat) + "22",
      color: cc(cat),
      marginBottom: 14,
      fontFamily: "monospace"
    }),
    dname: {
      fontSize: 22,
      fontWeight: "bold",
      color: DK.text(dark),
      marginBottom: 12,
      lineHeight: 1.3
    },
    fl: {
      marginBottom: 14
    },
    flbl: {
      fontSize: 10,
      color: DK.muted(dark),
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 3
    },
    fval: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    },
    fcw: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 20
    },
    fcprog: {
      fontSize: 12,
      color: DK.muted(dark),
      marginBottom: 14
    },
    fcouter: {
      perspective: 1200,
      width: "100%",
      maxWidth: 580,
      height: 300,
      cursor: "pointer"
    },
    fcinn: fl => ({
      position: "relative",
      width: "100%",
      height: "100%",
      transformStyle: "preserve-3d",
      transform: fl ? "rotateY(180deg)" : "rotateY(0)",
      transition: "transform 0.4s cubic-bezier(.4,0,.2,1)"
    }),
    fcface: (back, cat) => ({
      position: "absolute",
      inset: 0,
      backfaceVisibility: "hidden",
      background: DK.card(dark),
      border: `2px solid ${back ? cc(cat) : DK.border(dark)}`,
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
      transform: back ? "rotateY(180deg)" : "none"
    }),
    fcnav: {
      display: "flex",
      gap: 10,
      marginTop: 20,
      alignItems: "center"
    },
    nb: dis => ({
      padding: "7px 18px",
      borderRadius: 6,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      background: dis ? DK.bg(dark) : DK.surface(dark),
      color: dis ? DK.muted(dark) : DK.text(dark),
      cursor: dis ? "not-allowed" : "pointer",
      fontSize: 13,
      fontFamily: "Georgia,serif"
    }),
    qw: {
      maxWidth: 580,
      margin: "0 auto",
      paddingTop: 12
    },
    qhdr: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18
    },
    qprog: {
      fontSize: 12,
      color: DK.muted(dark)
    },
    qbar: {
      height: 4,
      background: DK.border(dark),
      borderRadius: 2,
      marginBottom: 20
    },
    qcard: {
      background: DK.card(dark),
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderRadius: 10,
      padding: 22,
      marginBottom: 14
    },
    qq: {
      fontSize: 10,
      color: DK.muted(dark),
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8
    },
    qname: {
      fontSize: 20,
      fontWeight: "bold",
      color: DK.text(dark),
      marginBottom: 4,
      lineHeight: 1.3
    },
    qrev: {
      width: "100%",
      padding: 12,
      borderRadius: 6,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      background: DK.surface(dark),
      color: DK.text(dark),
      cursor: "pointer",
      fontSize: 14,
      fontFamily: "Georgia,serif"
    },
    qans: {
      background: dark ? "#1a2a3a" : "#f0f4f8",
      border: `1px solid ${dark ? "#2a3a4a" : "#c8d8e8"}`,
      borderRadius: 8,
      padding: "14px 16px",
      fontSize: 14,
      color: dark ? "#a0c4e4" : "#1a4a6e",
      marginBottom: 14,
      lineHeight: 1.6
    },
    qmrk: {
      display: "flex",
      gap: 10
    },
    qbtn: c => ({
      flex: 1,
      padding: 12,
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 13,
      fontFamily: "Georgia,serif",
      border: `1px solid ${c ? "#2d8a4e" : "#c0392b"}`,
      background: c ? dark ? "#0a2a1a" : "#f0fff4" : dark ? "#2a0a0a" : "#fff5f5",
      color: c ? "#2d8a4e" : "#c0392b"
    }),
    chip: c => ({
      padding: "3px 12px",
      borderRadius: 20,
      fontSize: 12,
      background: c === "c" ? "#e8f5ee" : c === "w" ? "#fde8e8" : DK.bg(dark),
      color: c === "c" ? "#2d8a4e" : c === "w" ? "#c0392b" : DK.muted(dark)
    }),
    done: {
      textAlign: "center",
      paddingTop: 50
    },
    dpct: {
      fontSize: 64,
      fontWeight: "bold",
      color: DK.text(dark),
      marginBottom: 4
    },
    dsub: {
      fontSize: 14,
      color: DK.muted(dark),
      marginBottom: 30
    },
    dbtn: {
      padding: "10px 24px",
      borderRadius: 6,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      background: DK.surface(dark),
      color: DK.text(dark),
      cursor: "pointer",
      fontSize: 14,
      fontFamily: "Georgia,serif",
      margin: "0 6px"
    }
  };
  const darkToggle = /*#__PURE__*/React.createElement("button", {
    onClick: () => setDark(d => !d),
    style: {
      padding: "5px 10px",
      borderRadius: 20,
      border: "1px solid #444",
      background: "transparent",
      color: "#aaa",
      cursor: "pointer",
      fontSize: 15,
      lineHeight: 1,
      flexShrink: 0
    },
    title: dark ? "Switch to light mode" : "Switch to dark mode"
  }, dark ? '\u2600\uFE0F' : '\uD83C\uDF19');
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Georgia,serif',
      color: '#aaa',
      flexDirection: 'column',
      gap: 12,
      background: DK.bg(dark)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32
    }
  }, "\u23F3"), /*#__PURE__*/React.createElement("div", null, "Loading\u2026"));
  if (loadErr) return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Georgia,serif',
      color: '#c0392b',
      padding: 24,
      textAlign: 'center',
      flexDirection: 'column',
      gap: 12,
      background: DK.bg(dark)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32
    }
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold'
    }
  }, "Could not load data"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#888',
      maxWidth: 300
    }
  }, loadErr));
  return /*#__PURE__*/React.createElement("div", {
    style: s.app
  }, adminConfig && /*#__PURE__*/React.createElement(AdminPanel, {
    config: adminConfig,
    allData: allData,
    onDataChange: setAllData,
    pathways: pathways,
    onPathwaysChange: setPathways,
    vitamins: vitamins,
    onVitaminsChange: setVitamins,
    normalValues: normalVals,
    onNormalValuesChange: setNormalVals,
    minerals: minerals,
    onMineralsChange: setMinerals,
    vignettes: vignettes,
    onVignettesChange: setVignettes,
    cases: clinicalCases,
    onCasesChange: setClinicalCases,
    visibility: visibility,
    onVisibilityChange: setVisibility,
    physioViva: physioViva,
    onPhysioVivaChange: setPhysioViva,
    physioReflexDetails: physioReflexDetails,
    onPhysioReflexDetailsChange: setPhysioReflexDetails,
    physioNotes: physioNotes,
    onPhysioNotesChange: setPhysioNotes,
    physioClinical: physioClinical,
    onPhysioClinicalChange: setPhysioClinical,
    onLogout: handleLogout
  }), showLogin && /*#__PURE__*/React.createElement(AdminLogin, {
    onLogin: handleLogin,
    onClose: () => setShowLogin(false),
    allData: allData
  }), screen === 'home' && !adminConfig && /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '20px 20px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 2
    }
  }, "Brute Forcing Medicine"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#888'
    }
  }, "MBBS Reference")), darkToggle), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '40px 20px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 20,
      justifyContent: 'center',
      alignItems: 'stretch',
      maxWidth: 900,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }
  }, visibility['biochem-home'] !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => navigateTo('biochem-home'),
    style: {
      flex: '1 1 250px',
      minWidth: 250,
      background: DK.card(dark),
      borderRadius: 16,
      padding: '32px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
      borderLeft: '5px solid #e07b39',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 12
    }
  }, "\uD83E\uDDEC"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 8
    }
  }, "Biochemistry"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, "Disorders, metabolic pathways, normal values, vitamins, and clinical vignettes"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'inline-block',
      padding: '10px 28px',
      borderRadius: 8,
      background: '#e07b39',
      color: '#fff',
      fontSize: 15,
      fontWeight: 'bold'
    }
  }, "Open \u2192")), visibility.physiology !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('physiology');
    },
    style: {
      flex: '1 1 250px',
      minWidth: 250,
      background: DK.card(dark),
      borderRadius: 16,
      padding: '32px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
      borderLeft: '5px solid #185FA5',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 12
    }
  }, "\uD83E\uDDE0"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 8
    }
  }, "Physiology"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, "Laws, effects, reflexes, syndromes, clinical signs, and more. Browse, quiz, and explore detailed reflex breakdowns."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'inline-block',
      padding: '10px 28px',
      borderRadius: 8,
      background: '#185FA5',
      color: '#fff',
      fontSize: 15,
      fontWeight: 'bold'
    }
  }, "Open \u2192")), visibility.feed !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('feed');
    },
    style: {
      flex: '1 1 250px',
      minWidth: 250,
      background: DK.card(dark),
      borderRadius: 16,
      padding: '32px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
      borderLeft: '5px solid #2ecc71',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 12
    }
  }, "\uD83D\uDCF0"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 8
    }
  }, "BFM Feed"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, "Passive learning mode. Browse biochem disorders and clinical conditions in an endless feed."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'inline-block',
      padding: '10px 28px',
      borderRadius: 8,
      background: '#2ecc71',
      color: '#fff',
      fontSize: 15,
      fontWeight: 'bold'
    }
  }, "Open \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '14px 0 22px',
      fontSize: 11,
      color: DK.muted(dark),
      lineHeight: 2
    }
  }, "With love \xA9 2026 TRK. All rights reserved.", /*#__PURE__*/React.createElement("br", null), "XD \xA0\xB7\xA0", /*#__PURE__*/React.createElement("span", {
    onClick: () => setShowLogin(true),
    style: {
      color: '#888',
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  }, "Admin"))), screen === 'biochem-home' && !adminConfig && visibility['biochem-home'] !== false && /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '13px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: goBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1
    }
  }, "Biochemistry"), darkToggle), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, visibility.disorders !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => navigateTo('disorders'),
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '22px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #e07b39'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 8
    }
  }, "\uD83E\uDDEC"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Biochemical Disorders"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, "Browse, search and quiz yourself on ", allData.length, " disorders across 15 categories. Flashcards, quiz mode, and detailed cards."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'inline-block',
      padding: '7px 16px',
      borderRadius: 8,
      background: '#e07b39',
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold'
    }
  }, "Open \u2192")), visibility.pathways !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      setOpenPathway(null);
      navigateTo('pathways');
    },
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '22px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #2980b9'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 8
    }
  }, "\uD83D\uDD2C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Biochemical Pathways"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, "Explore ", pathways.length, " interactive step-by-step pathways across 5 biomolecule categories. Reveal each step, expand disorder branches, and link directly to disease cards."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'inline-block',
      padding: '7px 16px',
      borderRadius: 8,
      background: '#2980b9',
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold'
    }
  }, "Open \u2192")), visibility['normal-values'] !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('normal-values');
    },
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '22px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #3498db'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 8
    }
  }, "\uD83E\uDE78"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Normal Values & RDA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, normalVals.reduce((s, x) => s + x.entries.length, 0), " reference values across ", normalVals.length, " sections \u2014 electrolytes, LFT, lipids, ABG, hormones, vitamins, RDAs, and more."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'inline-block',
      padding: '7px 16px',
      borderRadius: 8,
      background: '#3498db',
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold'
    }
  }, "Open \u2192")), visibility.vitamins !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('vitamins');
    },
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '22px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #27ae60'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 8
    }
  }, "\uD83D\uDC8A"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Vitamins"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, "All ", vitamins.length, " essential vitamins \u2014 fat-soluble (A, D, E, K) and water-soluble (B-complex, C). Coenzyme forms, enzymes, deficiency states, toxicity, and mnemonics."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'inline-block',
      padding: '7px 16px',
      borderRadius: 8,
      background: '#27ae60',
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold'
    }
  }, "Open \u2192")), visibility.minerals !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('minerals');
    },
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '22px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #3498db'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 8
    }
  }, "\u26A1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Minerals & Trace Elements"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, "All ", minerals.length, " essential minerals and trace elements \u2014 macrominerals and microminerals. Absorption, functions, RDA, dietary sources, deficiency, toxicity, and mnemonics."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'inline-block',
      padding: '7px 16px',
      borderRadius: 8,
      background: '#3498db',
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold'
    }
  }, "Open \u2192")), visibility['clinical-vignettes'] !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('clinical-vignettes');
    },
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '22px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #e74c3c'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 8
    }
  }, "\uD83C\uDFE5"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Clinical Vignettes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, clinicalCases.length, " MCQ cases + ", vignettes.length, " differential diagnosis scenarios. Filter, score, and learn."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'inline-block',
      padding: '7px 16px',
      borderRadius: 8,
      background: '#e74c3c',
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold'
    }
  }, "Open \u2192")))), screen === 'pathways' && !adminConfig && visibility.pathways !== false && /*#__PURE__*/React.createElement(PathwayBrowser, {
    pathways: pathways,
    allDisorders: allData,
    dark: dark,
    darkToggle: darkToggle,
    initialPathway: openPathway,
    onBack: () => {
      setOpenPathway(null);
      goBack();
    },
    onOpenDisorder: (d, fromPathway) => {
      setPrevScreen('pathways');
      setSel(d);
      setOpenPathway(fromPathway || null);
      navigateTo('disorders');
    },
    onPathwayChange: p => setOpenPathway(p)
  }), screen === 'normal-values' && !adminConfig && visibility['normal-values'] !== false && /*#__PURE__*/React.createElement(NormalValuesView, {
    data: normalVals,
    dark: dark,
    onBack: goBack
  }), screen === 'vitamins' && !adminConfig && visibility.vitamins !== false && /*#__PURE__*/React.createElement(VitaminsView, {
    data: vitamins,
    allDisorders: allData,
    pathways: pathways,
    dark: dark,
    onBack: goBack,
    initialVitamin: prevVitaminSel,
    onOpenDisorder: (d, vitSel) => {
      setPrevVitaminSel(vitSel);
      setSel(d);
      navigateTo('disorders');
    },
    onOpenPathway: p => {
      setSel(null);
      setOpenPathway(p);
      navigateTo('pathways');
    }
  }), screen === 'minerals' && !adminConfig && visibility.minerals !== false && /*#__PURE__*/React.createElement(MineralsView, {
    data: minerals,
    allDisorders: allData,
    pathways: pathways,
    dark: dark,
    onBack: goBack,
    initialMineral: prevMineralSel,
    onOpenDisorder: (d, m) => {
      setPrevMineralSel(m);
      setSel(d);
      navigateTo('disorders');
    },
    onOpenPathway: p => {
      setOpenPathway(p);
      navigateTo('pathways');
    }
  }), screen === 'physiology' && !adminConfig && visibility.physiology !== false && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      background: DK.bg(dark)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px',
      background: DK.hdr(dark),
      borderBottom: '1px solid ' + (dark ? '#2a2a2a' : '#e8e2d9'),
      flexShrink: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (physioMode !== 'home') {
        physioRef.current?.contentWindow.postMessage({
          type: 'physio-nav-set',
          mode: 'home',
          cat: 'All',
          search: ''
        }, '*');
      } else {
        goBack();
      }
    },
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 20,
      cursor: 'pointer',
      padding: '4px 8px',
      lineHeight: 1,
      fontFamily: 'Georgia,serif'
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: '#fff',
      flex: 1,
      fontFamily: 'Georgia,serif'
    }
  }, "\uD83E\uDDE0 Physiology")), /*#__PURE__*/React.createElement("iframe", {
    ref: physioRef,
    src: "physio/index.html?dark=" + (dark ? 1 : 0),
    style: {
      flex: 1,
      width: '100%',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none'
    },
    title: "Physiology",
    onLoad: () => {
      if (physioRef.current) {
        physioRef.current.contentWindow.postMessage({
          type: 'theme',
          dark
        }, '*');
        const pp = window.location.hash.slice(1).split('?')[0];
        const sub = pp.split('/')[2] || 'home';
        physioRef.current.contentWindow.postMessage({
          type: 'physio-nav-set',
          mode: sub === 'browse' || sub === 'quiz' || sub === 'reflex' || sub === 'reflexDetails' ? sub : 'home',
          cat: new URLSearchParams(window.location.hash.split('?')[1] || '').get('cat') || 'All',
          search: new URLSearchParams(window.location.hash.split('?')[1] || '').get('search') || ''
        }, '*');
        physioRef.current.contentWindow.postMessage({
          type: 'physio-visibility',
          viva: visibility['physio-viva'],
          reflexExplorer: visibility['physio-reflexes-explorer'],
          notes: visibility['physio-notes'],
          clinical: visibility['physio-clinical']
        }, '*');
      }
    }
  })), screen === 'feed' && !adminConfig && visibility.feed !== false && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      background: DK.bg(dark)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px',
      background: DK.hdr(dark),
      borderBottom: '1px solid ' + (dark ? '#2a2a2a' : '#e8e2d9'),
      flexShrink: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: goBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 20,
      cursor: 'pointer',
      padding: '4px 8px',
      lineHeight: 1,
      fontFamily: 'Georgia,serif'
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: '#fff',
      flex: 1,
      fontFamily: 'Georgia,serif'
    }
  }, "\uD83D\uDCF0 BFM Feed")), /*#__PURE__*/React.createElement("iframe", {
    ref: feedRef,
    src: "feed/index.html?dark=" + (dark ? 1 : 0),
    style: {
      flex: 1,
      width: '100%',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none'
    },
    title: "BFM Feed",
    onLoad: () => {
      if (feedRef.current) {
        feedRef.current.contentWindow.postMessage({
          type: 'theme',
          dark
        }, '*');
      }
    }
  })), screen === 'clinical-vignettes' && !adminConfig && visibility['clinical-vignettes'] !== false && /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '13px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: goBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1
    }
  }, "Clinical Vignettes")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, visibility['clinical-cases'] !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('clinical-cases');
    },
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '24px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #e74c3c'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83D\uDCDD"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Clinical Cases"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6,
      marginBottom: 8
    }
  }, clinicalCases.length, " MCQ-style cases. Read the scenario, pick the right diagnosis, and learn from detailed explanations. Filter by topic and difficulty."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, ['easy', 'medium', 'hard'].map(d => {
    const count = clinicalCases.filter(c => c.difficulty === d).length;
    return /*#__PURE__*/React.createElement("span", {
      key: d,
      style: {
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 10,
        background: d === 'easy' ? '#27ae60' : d === 'medium' ? '#e67e22' : '#c0392b',
        color: '#fff'
      }
    }, count, " ", d);
  }))), visibility.vignettes !== false && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      navigateTo('vignettes');
    },
    style: {
      background: DK.card(dark),
      borderRadius: 14,
      padding: '24px 20px',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      cursor: 'pointer',
      boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '5px solid #e67e22'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83C\uDFAF"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 5
    }
  }, "Differential Diagnosis"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6
    }
  }, vignettes.length, " interactive simulation cases. Choose exams, labs, and tests to narrow the differential. Score based on diagnostic efficiency.")))), screen === 'clinical-cases' && !adminConfig && visibility['clinical-cases'] !== false && /*#__PURE__*/React.createElement(CasesView, {
    cases: clinicalCases,
    allDisorders: allData,
    dark: dark,
    onBack: goBack
  }), screen === 'vignettes' && !adminConfig && visibility.vignettes !== false && (openVignette ? /*#__PURE__*/React.createElement(ClinicalVignetteView, {
    key: openVignette.id,
    vignette: openVignette,
    dark: dark,
    allDisorders: allData,
    onBack: () => setOpenVignette(null),
    onOpenDisorder: d => {
      setSel(d);
      navigateTo('disorders');
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: DK.bg(dark),
      fontFamily: 'Georgia,serif',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: DK.hdr(dark),
      padding: '13px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: goBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#fff',
      flex: 1
    }
  }, "Clinical Vignettes"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: '#888'
    }
  }, vignettes.length, " cases")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 14px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.sub(dark),
      lineHeight: 1.6,
      marginBottom: 20
    }
  }, "Each vignette presents a clinical scenario. Choose which exams, labs, and tests to perform. Each action reveals findings that narrow the differential. Make the diagnosis efficiently for the best score."), vignettes.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    onClick: () => setOpenVignette(v),
    style: {
      background: DK.card(dark),
      borderRadius: 12,
      padding: '16px',
      marginBottom: 12,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      borderLeft: '4px solid #e74c3c',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      color: DK.text(dark),
      marginBottom: 6
    }
  }, v.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: DK.sub(dark),
      lineHeight: 1.6,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, v.presentation), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 10,
      fontSize: 11,
      color: DK.muted(dark)
    }
  }, /*#__PURE__*/React.createElement("span", null, v.actions.length, " actions"), /*#__PURE__*/React.createElement("span", null, v.differentials.length, " differentials"))))))), screen === 'disorders' && !adminConfig && visibility.disorders !== false && /*#__PURE__*/React.createElement("div", {
    style: s.app
  }, /*#__PURE__*/React.createElement("div", {
    style: s.hdr
  }, /*#__PURE__*/React.createElement("div", {
    style: s.htop
  }, /*#__PURE__*/React.createElement("button", {
    onClick: goBack,
    style: {
      background: 'none',
      borderTop: 'none',
      borderRight: 'none',
      borderLeft: 'none',
      color: '#aaa',
      fontSize: 24,
      cursor: 'pointer',
      padding: '10px 14px',
      marginLeft: -14,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    onClick: handleFooterTap,
    style: {
      ...s.title,
      cursor: 'default',
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }
  }, "Biochemical Disorders", tapCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      fontSize: 12,
      letterSpacing: 2,
      color: '#888'
    }
  }, '\u00E2\u2014\u008F'.repeat(tapCount), '\u25CB'.repeat(5 - tapCount))), /*#__PURE__*/React.createElement("span", {
    style: s.badge
  }, allData.length, " total"), /*#__PURE__*/React.createElement("span", {
    style: s.badge
  }, filtered.length, " shown"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, darkToggle)), /*#__PURE__*/React.createElement("div", {
    style: s.ctrl
  }, /*#__PURE__*/React.createElement("button", {
    style: s.mBtn(mode === "browse"),
    onClick: () => setMode("browse")
  }, "Browse"), /*#__PURE__*/React.createElement("button", {
    style: s.mBtn(mode === "flashcard", "#e8a838"),
    onClick: startFC
  }, "Flashcards"), /*#__PURE__*/React.createElement("button", {
    style: s.mBtn(mode === "quiz", "#4caf7d"),
    onClick: startQuiz
  }, "Quiz Me"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 18,
      background: "#444"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setImportantOnly(v => !v),
    style: {
      padding: "6px 12px",
      borderRadius: 4,
      border: `1px solid ${importantOnly ? "#f1c40f" : "#444"}`,
      background: importantOnly ? "#f1c40f22" : "transparent",
      color: importantOnly ? "#f1c40f" : "#aaa",
      cursor: "pointer",
      fontSize: 12,
      fontFamily: "Georgia,serif",
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, "\u2B50 ", importantOnly ? "All" : `Important (${allData.filter(d => d.important).length})`), /*#__PURE__*/React.createElement("select", {
    style: s.catSel,
    value: catFilter,
    onChange: e => setCatFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "ALL"
  }, "All categories"), CAT_KEYS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c, " \u2014 ", CAT_META[c].label))), /*#__PURE__*/React.createElement("input", {
    style: s.inp,
    placeholder: "Search disorder, defect, pathway\u2026",
    value: search,
    onChange: e => setSearch(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: s.body
  }, mode === "browse" && /*#__PURE__*/React.createElement("div", {
    style: s.grid
  }, filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: DK.muted(dark),
      padding: 40,
      textAlign: "center",
      gridColumn: "1/-1"
    }
  }, "No results."), filtered.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.id,
    style: s.bc(d.cat),
    onClick: () => setSel(d)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.bnum
  }, "#", d.num, " \xA0\xB7\xA0 ", CAT_META[d.cat]?.label), d.important && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1
    }
  }, "\u2B50")), /*#__PURE__*/React.createElement("div", {
    style: s.bname
  }, d.disorder), /*#__PURE__*/React.createElement("div", {
    style: s.bsub
  }, d.defect && d.defect.length > 70 ? d.defect.slice(0, 68) + "\u2026" : d.defect), /*#__PURE__*/React.createElement("div", {
    style: s.bsub
  }, d.pathway)))), mode === "flashcard" && deck.length > 0 && card && /*#__PURE__*/React.createElement("div", {
    style: s.fcw
  }, /*#__PURE__*/React.createElement("div", {
    style: s.fcprog
  }, "Card ", fcIdx + 1, " of ", deck.length, " \xA0\xB7\xA0 ", CAT_META[card.cat]?.label), /*#__PURE__*/React.createElement("div", {
    style: s.fcouter,
    onClick: () => setFlipped(f => !f)
  }, /*#__PURE__*/React.createElement("div", {
    style: s.fcinn(flipped)
  }, /*#__PURE__*/React.createElement("div", {
    style: s.fcface(false, card.cat)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: DK.muted(dark),
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 14
    }
  }, "#", card.num, " \xA0\xB7\xA0 ", card.cat), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: "bold",
      color: DK.text(dark),
      lineHeight: 1.4,
      marginBottom: 8
    }
  }, card.disorder), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: cc(card.cat)
    }
  }, card.pathway), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: DK.muted(dark),
      marginTop: 16
    }
  }, "tap to flip \u2192")), /*#__PURE__*/React.createElement("div", {
    style: s.fcface(true, card.cat)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      textAlign: "left"
    }
  }, FIELDS.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.key,
    style: {
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: DK.muted(dark),
      textTransform: "uppercase",
      letterSpacing: 1
    }
  }, f.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: DK.sub(dark),
      lineHeight: 1.5
    }
  }, card[f.key]))))))), /*#__PURE__*/React.createElement("div", {
    style: s.fcnav
  }, /*#__PURE__*/React.createElement("button", {
    style: s.nb(fcIdx === 0),
    onClick: () => nextFC(-1),
    disabled: fcIdx === 0
  }, "\u2190 Prev"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...s.nb(false),
      padding: "7px 20px"
    },
    onClick: startFC
  }, "\uD83D\uDD00 Reshuffle"), /*#__PURE__*/React.createElement("button", {
    style: s.nb(fcIdx === deck.length - 1),
    onClick: () => nextFC(1),
    disabled: fcIdx === deck.length - 1
  }, "Next \u2192"))), mode === "quiz" && /*#__PURE__*/React.createElement("div", {
    style: s.qw
  }, done ? /*#__PURE__*/React.createElement("div", {
    style: s.done
  }, /*#__PURE__*/React.createElement("div", {
    style: s.dpct
  }, pct, "%"), /*#__PURE__*/React.createElement("div", {
    style: s.dsub
  }, score.c, " correct \xA0\xB7\xA0 ", score.w, " wrong"), /*#__PURE__*/React.createElement("button", {
    style: s.dbtn,
    onClick: startQuiz
  }, "Try Again"), /*#__PURE__*/React.createElement("button", {
    style: s.dbtn,
    onClick: () => setMode("browse")
  }, "Browse")) : qcard ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: s.qhdr
  }, /*#__PURE__*/React.createElement("div", {
    style: s.qprog
  }, qIdx + 1, " / ", qDeck.length), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: s.chip("c")
  }, "\u2713 ", score.c), /*#__PURE__*/React.createElement("span", {
    style: s.chip("w")
  }, "\u2717 ", score.w))), /*#__PURE__*/React.createElement("div", {
    style: s.qbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      borderRadius: 2,
      background: cc(qcard.cat),
      width: `${qIdx / qDeck.length * 100}%`,
      transition: "width 0.3s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: s.qcard
  }, /*#__PURE__*/React.createElement("div", {
    style: s.qq
  }, CAT_META[qcard.cat]?.label, " \xA0\xB7\xA0 #", qcard.num), /*#__PURE__*/React.createElement("div", {
    style: s.qname
  }, qcard.disorder), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: cc(qcard.cat),
      marginTop: 4
    }
  }, qcard.pathway), !revealed && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: DK.muted(dark),
      marginTop: 12
    }
  }, "What is the ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: DK.text(dark)
    }
  }, qField.label), "?")), !revealed ? /*#__PURE__*/React.createElement("button", {
    style: s.qrev,
    onClick: () => setRev(true)
  }, "Reveal Answer") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: s.qans
  }, qcard[qField.key]), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setPrevScreen(null);
      setSel(qcard);
      setMode('browse');
    },
    style: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: 6,
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      background: DK.surface(dark),
      color: DK.sub(dark),
      fontSize: 12,
      fontFamily: 'Georgia,serif',
      cursor: 'pointer',
      marginBottom: 10,
      textAlign: 'center'
    }
  }, "\uD83D\uDCCB View Full Disorder Card"), /*#__PURE__*/React.createElement("div", {
    style: s.qmrk
  }, /*#__PURE__*/React.createElement("button", {
    style: s.qbtn(false),
    onClick: () => markQ(false)
  }, "\u2717 \xA0Missed it"), /*#__PURE__*/React.createElement("button", {
    style: s.qbtn(true),
    onClick: () => markQ(true)
  }, "\u2713 \xA0Got it")))) : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '14px 0 22px',
      fontSize: 11,
      color: DK.muted(dark)
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: goBack,
    style: {
      color: '#888',
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  }, "\u2190 Home"), "\xA0\xB7\xA0 XD"), sel && /*#__PURE__*/React.createElement("div", {
    style: s.mask,
    onClick: () => setSel(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: s.drw,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: s.dtag(sel.cat)
  }, sel.cat, " \u2014 ", CAT_META[sel.cat]?.label), sel.important && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      fontSize: 16
    }
  }, "\u2B50"), prevScreen === 'pathways' && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSel(null);
      goBack();
    },
    style: {
      display: 'block',
      marginTop: 8,
      padding: '5px 12px',
      borderRadius: 20,
      border: '1px solid #2980b9',
      background: '#eaf4fb',
      color: '#2980b9',
      fontSize: 12,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\u2190 Back to Pathway"), prevScreen === 'vitamins' && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSel(null);
      goBack();
    },
    style: {
      display: 'block',
      marginTop: 8,
      padding: '5px 12px',
      borderRadius: 20,
      border: '1px solid #27ae60',
      background: '#e8f5ee',
      color: '#27ae60',
      fontSize: 12,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\u2190 Back to Vitamins"), prevScreen === 'minerals' && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSel(null);
      goBack();
    },
    style: {
      display: 'block',
      marginTop: 8,
      padding: '5px 12px',
      borderRadius: 20,
      border: '1px solid #3498db',
      background: '#eaf4fb',
      color: '#3498db',
      fontSize: 12,
      cursor: 'pointer',
      fontFamily: 'Georgia,serif'
    }
  }, "\u2190 Back to Minerals"), /*#__PURE__*/React.createElement("div", {
    style: s.dname
  }, sel.disorder)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSel(null),
    style: {
      background: "none",
      border: "none",
      color: DK.muted(dark),
      cursor: "pointer",
      fontSize: 22,
      padding: "0 0 0 12px"
    }
  }, "\xD7")), FIELDS.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.key,
    style: s.fl
  }, /*#__PURE__*/React.createElement("div", {
    style: s.flbl
  }, f.label), /*#__PURE__*/React.createElement("div", {
    style: s.fval
  }, sel[f.key]))), sel.imageUrl && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: s.flbl
  }, "Diagram"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setLightbox(sel.imageUrl),
    style: {
      cursor: 'zoom-in',
      borderRadius: 10,
      overflow: 'hidden',
      borderTop: `1px solid ${DK.border(dark)}`,
      borderRight: `1px solid ${DK.border(dark)}`,
      borderBottom: `1px solid ${DK.border(dark)}`,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: sel.imageUrl,
    alt: "diagram",
    style: {
      width: '100%',
      maxHeight: 220,
      objectFit: 'contain',
      display: 'block',
      background: DK.bg(dark)
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      right: 10,
      background: 'rgba(0,0,0,0.45)',
      color: '#fff',
      fontSize: 11,
      padding: '3px 9px',
      borderRadius: 12,
      pointerEvents: 'none'
    }
  }, "\uD83D\uDD0D Tap to zoom"))), (() => {
    const related = pathways.filter(p => (p.steps || []).some(st => st.disorder && st.disorder.disorderId === sel.id));
    if (!related.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: s.flbl
    }, "\uD83D\uDD2C Related Pathways"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 6
      }
    }, related.map(p => {
      const meta = BIO_CATS.find(b => b.key === p.biomolecule);
      const stepNum = (p.steps || []).find(st => st.disorder && st.disorder.disorderId === sel.id)?.stepNum;
      return /*#__PURE__*/React.createElement("button", {
        key: p.id,
        onClick: () => {
          setSel(null);
          setOpenPathway({
            ...p,
            jumpToStep: stepNum
          });
          navigateTo('pathways');
        },
        style: {
          padding: '10px 14px',
          borderRadius: 8,
          border: `1px solid ${p.color || meta?.color || '#888'}`,
          background: dark ? (p.color || meta?.color || '#888') + '18' : (p.color || meta?.color || '#888') + '10',
          color: p.color || meta?.color || '#888',
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'Georgia,serif',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      }, /*#__PURE__*/React.createElement("span", null, meta?.icon, " ", /*#__PURE__*/React.createElement("strong", null, p.name)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          opacity: 0.8
        }
      }, "Step ", stepNum, " \u2192"));
    })));
  })()))), " ", lightbox && /*#__PURE__*/React.createElement(ImageLightbox, {
    src: lightbox,
    onClose: () => setLightbox(null)
  }));
}

// \u2500\u2500 Minerals Viewer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function MineralsView({ data, allDisorders, pathways, dark, onBack, onOpenDisorder, onOpenPathway, initialMineral }) {
  if (!data || data.length === 0) return null;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [importantOnly, setImportantOnly] = useState(false);
  const [sel, setSel] = useState(() => initialMineral || null);
  const [cyclesOpen, setCyclesOpen] = useState(true);
  const mineralColor = m => m.type === 'macromineral' ? '#3498db' : m.type === 'toxic' ? '#e74c3c' : '#27ae60';
  const filtered = data.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (importantOnly && !m.important) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.alias || '').toLowerCase().includes(q) || (m.coenzyme || '').toLowerCase().includes(q) || (m.deficiency?.name || '').toLowerCase().includes(q) || (m.enzymes || []).some(e => e.toLowerCase().includes(q));
  });
  const cardStyle = m => ({
    background: DK.card(dark),
    borderTop: `1px solid ${DK.cardBdr(dark)}`,
    borderRight: `1px solid ${DK.cardBdr(dark)}`,
    borderBottom: `1px solid ${DK.cardBdr(dark)}`,
    borderLeft: `3px solid ${mineralColor(m)}`,
    borderRadius: 6,
    padding: '12px 14px',
    cursor: 'pointer'
  });
  const fl = { marginBottom: 14 };
  const flbl = { fontSize: 10, color: DK.muted(dark), textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 };
  const fval = { fontSize: 13, color: DK.sub(dark), lineHeight: 1.6 };
  const sectionBox = { ...fl, padding: 12, borderRadius: 8, background: dark ? '#1a1a1a' : '#f8f6f2', border: `1px solid ${DK.border(dark)}` };
  return React.createElement("div", {
    style: { minHeight: '100vh', background: DK.bg(dark), fontFamily: 'Georgia,serif', display: 'flex', flexDirection: 'column' }
  }, React.createElement("div", {
    style: { background: DK.hdr(dark), padding: '13px 16px', position: 'sticky', top: 0, zIndex: 20, boxSizing: 'border-box' }
  }, React.createElement("div", {
    style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }
  }, React.createElement("button", {
    onClick: onBack,
    style: { background: 'none', borderTop: 'none', borderRight: 'none', borderLeft: 'none', color: '#aaa', fontSize: 24, cursor: 'pointer', padding: '10px 14px', marginLeft: -14 }
  }, "\u2190"), React.createElement("span", {
    style: { fontSize: 17, fontWeight: 'bold', color: '#fff', flex: 1 }
  }, "Minerals"), React.createElement("span", {
    style: { fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#333', color: '#aaa', fontFamily: 'monospace' }
  }, data.length)), React.createElement("div", {
    style: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }
  }, React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search mineral, coenzyme, enzyme, deficiency\u2026",
    style: { flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '1px solid #444', background: '#222', color: '#faf7f2', fontSize: 13, fontFamily: 'Georgia,serif', outline: 'none', boxSizing: 'border-box' }
  }), ['all', ...new Set(data.map(m => m.type))].map(t => React.createElement("button", {
    key: t,
    onClick: () => setTypeFilter(t),
    style: { padding: '5px 12px', borderRadius: 4, border: `1px solid ${typeFilter === t ? '#27ae60' : '#444'}`, background: typeFilter === t ? '#27ae6022' : 'transparent', color: typeFilter === t ? '#27ae60' : '#aaa', cursor: 'pointer', fontSize: 11, fontFamily: 'Georgia,serif', textTransform: 'capitalize' }
  }, t.replace('-', ' & '))), React.createElement("button", {
    onClick: () => setImportantOnly(v => !v),
    style: { padding: '5px 12px', borderRadius: 4, border: `1px solid ${importantOnly ? '#f1c40f' : '#444'}`, background: importantOnly ? '#f1c40f22' : 'transparent', color: importantOnly ? '#f1c40f' : '#aaa', cursor: 'pointer', fontSize: 11, fontFamily: 'Georgia,serif' }
  }, "\u2B50 ", importantOnly ? 'All' : 'Important'))), React.createElement("div", {
    style: { flex: 1, overflowY: 'auto', padding: '14px 16px 40px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }
  }, filtered.length === 0 && React.createElement("div", {
    style: { textAlign: 'center', padding: 40, color: DK.muted(dark) }
  }, "No minerals match your filters."), React.createElement("div", {
    style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }
  }, filtered.map(m => React.createElement("div", {
    key: m.id,
    style: cardStyle(m),
    onClick: () => setSel(m)
  }, React.createElement("div", {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }
  }, React.createElement("span", {
    style: { fontSize: 10, color: DK.muted(dark), fontFamily: 'monospace', marginBottom: 3 }
  }, m.alias, " \xB7 ", m.type), m.important && React.createElement("span", { style: { fontSize: 14, lineHeight: 1 } }, "\u2B50")), React.createElement("div", {
    style: { fontSize: 16, fontWeight: 'bold', color: DK.text(dark), marginBottom: 3, lineHeight: 1.3 }
  }, m.name), React.createElement("div", {
    style: { fontSize: 12, color: mineralColor(m), marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }
  }, m.coenzyme), React.createElement("div", {
    style: { fontSize: 11, color: DK.sub(dark), marginTop: 4, lineHeight: 1.4 }
  }, (m.enzymes || []).slice(0, 3).join(', '), m.enzymes.length > 3 ? ` +${m.enzymes.length - 3} more` : ''), m.deficiency && m.deficiency.name && React.createElement("div", {
    style: { marginTop: 6, padding: '4px 8px', borderRadius: 4, background: dark ? '#2a1a1a' : '#fff5f5', fontSize: 11, color: '#c0392b', lineHeight: 1.3 }
  }, "\u2695\uFE0F ", m.deficiency.name))))), sel && React.createElement("div", {
    style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
    onClick: () => setSel(null)
  }, React.createElement("div", {
    style: { background: DK.surface(dark), borderRadius: '14px 14px 0 0', padding: '24px 24px 32px', width: '100%', maxWidth: 680, maxHeight: '82vh', overflowY: 'auto' },
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }
  }, React.createElement("div", null, React.createElement("span", {
    style: { display: 'inline-block', fontSize: 11, padding: '2px 12px', borderRadius: 20, background: mineralColor(sel) + '22', color: mineralColor(sel), marginBottom: 14, fontFamily: 'monospace' }
  }, sel.alias, " \xB7 ", sel.type), sel.important && React.createElement("span", { style: { marginLeft: 8, fontSize: 16 } }, "\u2B50"), React.createElement("div", {
    style: { fontSize: 22, fontWeight: 'bold', color: DK.text(dark), marginBottom: 12, lineHeight: 1.3 }
  }, sel.name)), React.createElement("button", {
    onClick: () => setSel(null),
    style: { background: 'none', borderTop: 'none', borderRight: 'none', borderLeft: 'none', color: DK.muted(dark), cursor: 'pointer', fontSize: 22, padding: '0 0 0 12px' }
  }, "\xD7")), sel.coenzyme && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Coenzyme Form"), formatClinicalText(sel.coenzyme, DK.sub(dark), DK.text(dark))), sel.enzymes && sel.enzymes.length > 0 && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Enzymes (", sel.enzymes.length, ")"), React.createElement("div", { style: { ...fval, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }, sel.enzymes.join('\n'))), sel.chemicalNature && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Chemical Nature"), formatClinicalText(sel.chemicalNature, DK.sub(dark), DK.text(dark))), sel.functions && sel.functions.length > 0 && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Biochemical Functions"), formatClinicalText(sel.functions.join('\n'), DK.sub(dark), DK.text(dark))), sel.absorption && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Absorption / Transport"), formatClinicalText(sel.absorption, DK.sub(dark), DK.text(dark))), sel.rda && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "RDA"), formatClinicalText(sel.rda, DK.sub(dark), DK.text(dark))), sel.sources && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Dietary Sources"), formatClinicalText(sel.sources, DK.sub(dark), DK.text(dark))), sel.inhibitors && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Inhibitors"), formatClinicalText(sel.inhibitors, DK.sub(dark), DK.text(dark))), sel.deficiency && (sel.deficiency.name || (sel.deficiency.findings && sel.deficiency.findings.length > 0) || sel.deficiency.clinical) && React.createElement("div", {
    style: { ...fl, padding: 12, borderRadius: 8, background: dark ? '#2a1a1a' : '#fff5f5', border: `1px solid ${dark ? '#3a2a2a' : '#fdd'}` }
  }, React.createElement("div", { style: { fontSize: 11, fontWeight: 'bold', color: '#c0392b', marginBottom: 4 } }, "\u26A0\uFE0F ", sel.deficiency.name), sel.deficiency.findings && sel.deficiency.findings.length > 0 && React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 } }, sel.deficiency.findings.map((f, i) => React.createElement("span", { key: i, style: { fontSize: 11, padding: '2px 8px', borderRadius: 12, background: dark ? '#3a2a2a' : '#fde8e8', color: dark ? '#e88' : '#c0392b' } }, f))), formatClinicalText(sel.deficiency.clinical, DK.sub(dark), DK.text(dark))), sel.toxicity && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Toxicity"), formatClinicalText(sel.toxicity, DK.sub(dark), DK.text(dark))), sel.mnemonic && React.createElement("div", {
    style: { ...fl, padding: 11, borderRadius: 8, background: dark ? '#1a2a1a' : '#f0fff5', border: `1px solid ${dark ? '#2a3a2a' : '#d0edd0'}` }
  }, React.createElement("div", { style: { fontSize: 11, color: '#27ae60', marginBottom: 2 } }, "\uD83E\uDDE0 Mnemonic"), formatClinicalText(sel.mnemonic, DK.sub(dark), DK.text(dark))), sel.relatedDisorderIds && sel.relatedDisorderIds.length > 0 && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Related Disorders"), React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } }, sel.relatedDisorderIds.map(id => { const d = allDisorders.find(x => x.id === id); if (!d) return null; return React.createElement("span", { key: id, onClick: () => onOpenDisorder(d, sel), style: { padding: '5px 13px', borderRadius: 20, border: '1px solid #2980b9', background: dark ? '#1a2a3a' : '#eaf4fb', color: '#2980b9', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif', display: 'inline-block' } }, "\uD83E\uDDEC ", d.disorder); }))), sel.pathwayIds && sel.pathwayIds.length > 0 && React.createElement("div", { style: sectionBox }, React.createElement("div", { style: flbl }, "Related Pathways"), React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } }, sel.pathwayIds.map(id => { const p = pathways.find(x => x.id === id); if (!p) return null; return React.createElement("span", { key: id, onClick: () => onOpenPathway(p), style: { padding: '5px 13px', borderRadius: 20, border: `1px solid ${p.color || '#888'}`, background: dark ? (p.color || '#888') + '18' : (p.color || '#888') + '10', color: p.color || '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif', display: 'inline-block' } }, "\uD83D\uDD2C ", p.name); }))))));
}

ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
