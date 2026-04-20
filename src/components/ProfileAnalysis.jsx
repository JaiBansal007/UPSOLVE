import React, { useState, useEffect, useMemo, useRef } from 'react';

// ─── API helper ───────────────────────────────────────────────────────────────
const cfFetch = async (endpoint) => {
  const res  = await fetch(`https://codeforces.com/api/${endpoint}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(data.comment || 'CF API error');
  return data.result;
};

// ─── Colour / label helpers ───────────────────────────────────────────────────
const getRatingColor = (r) => {
  if (!r)       return '#6b7280';
  if (r < 1200) return '#9ca3af';
  if (r < 1400) return '#4ade80';
  if (r < 1600) return '#22d3ee';
  if (r < 1900) return '#60a5fa';
  if (r < 2100) return '#c084fc';
  if (r < 2400) return '#fbbf24';
  if (r < 2600) return '#fb923c';
  if (r < 3000) return '#f87171';
  return '#dc2626';
};

const getRatingTitle = (r) => {
  if (!r)       return 'Unrated';
  if (r < 1200) return 'Newbie';
  if (r < 1400) return 'Pupil';
  if (r < 1600) return 'Specialist';
  if (r < 1900) return 'Expert';
  if (r < 2100) return 'Candidate Master';
  if (r < 2400) return 'Master';
  if (r < 2600) return 'International Master';
  if (r < 3000) return 'Grandmaster';
  return 'Legendary Grandmaster';
};

const getDivision = (name = '') => {
  if (name.includes('Div. 1 + 2') || name.includes('Div 1+2')) return 'Div. 1+2';
  if (name.includes('Div. 1'))  return 'Div. 1';
  if (name.includes('Div. 2'))  return 'Div. 2';
  if (name.includes('Div. 3'))  return 'Div. 3';
  if (name.includes('Div. 4'))  return 'Div. 4';
  if (name.includes('Educational')) return 'Educational';
  if (name.includes('Global'))  return 'Global';
  return 'Other';
};

const DIV_COLOR = {
  'Div. 1': '#f87171', 'Div. 1+2': '#fb923c', 'Div. 2': '#fbbf24',
  'Div. 3': '#4ade80', 'Div. 4':   '#22d3ee',  'Educational': '#c084fc',
  'Global': '#60a5fa', 'Other': '#6b7280',
};

const VERDICT_META = [
  { key: 'AC',    label: 'Accepted',       color: '#10b981' },
  { key: 'WA',    label: 'Wrong Answer',   color: '#ef4444' },
  { key: 'TLE',   label: 'Time Limit',     color: '#f59e0b' },
  { key: 'MLE',   label: 'Memory Limit',   color: '#a78bfa' },
  { key: 'RE',    label: 'Runtime Error',  color: '#fb923c' },
  { key: 'CE',    label: 'Compile Error',  color: '#6b7280' },
  { key: 'Other', label: 'Other',          color: '#374151' },
];

const CARD   = 'p-5 rounded-2xl border';
const CARDST = { background: '#0d0d0d', borderColor: '#1f1f1f' };

const SectionTitle = ({ children }) => (
  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">{children}</h3>
);

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ─── 1 + 5  Rating History Chart ──────────────────────────────────────────────
function RatingHistoryChart({ contests }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  if (contests.length < 2) return null;

  const W = 800; const H = 270;
  const PAD = { t: 24, r: 24, b: 44, l: 56 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const ratings = contests.map(c => c.newRating);
  const minR    = Math.max(0, Math.min(...ratings) - 150);
  const maxR    = Math.max(...ratings) + 150;

  const xS = (i) => PAD.l + (i / Math.max(contests.length - 1, 1)) * cW;
  const yS = (r) => PAD.t + cH - ((r - minR) / (maxR - minR)) * cH;

  const pts  = contests.map((c, i) => [xS(i), yS(c.newRating)]);
  const line = `M ${pts.map(p => p.join(',')).join(' L ')}`;
  const fill = `${line} L ${pts[pts.length - 1][0]},${PAD.t + cH} L ${pts[0][0]},${PAD.t + cH} Z`;

  // Linear projection from last 5 contests
  let projLine = null;
  let projColor = '#6b7280';
  const last = contests.slice(-5);
  if (last.length >= 2) {
    const n    = last.length;
    const xs   = last.map((_, i) => i);
    const ys   = last.map(c => c.newRating);
    const sx   = xs.reduce((a, b) => a + b, 0);
    const sy   = ys.reduce((a, b) => a + b, 0);
    const sxy  = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sx2  = xs.reduce((a, x) => a + x * x, 0);
    const slope     = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
    const intercept = (sy - slope * sx) / n;
    const projR     = Math.round(intercept + slope * (n - 1 + 4));
    const clampedR  = Math.max(minR + 50, Math.min(maxR - 50, projR));
    const lx = xS(contests.length - 1);
    const ly = yS(contests[contests.length - 1].newRating);
    const px = Math.min(lx + 90, W - PAD.r);
    const py = yS(clampedR);
    projLine  = `M ${lx},${ly} L ${px},${py}`;
    projColor = getRatingColor(projR);
  }

  // Y grid
  const gridStep = Math.ceil((maxR - minR) / 5 / 100) * 100;
  const gridRs   = [];
  for (let r = Math.ceil(minR / 100) * 100; r <= maxR; r += gridStep) gridRs.push(r);

  // Sparse X labels
  const xLabels = [];
  contests.forEach((c, i) => {
    if (i % Math.max(1, Math.floor(contests.length / 8)) === 0) {
      const d = new Date(c.ratingUpdateTimeSeconds * 1000);
      xLabels.push({ x: xS(i), label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }) });
    }
  });

  const peakIdx = ratings.indexOf(Math.max(...ratings));
  const lineColor = getRatingColor(Math.max(...ratings));

  const handleMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (W / rect.width);
    const idx  = Math.round(((mx - PAD.l) / cW) * (contests.length - 1));
    const ci   = Math.max(0, Math.min(contests.length - 1, idx));
    setTooltip({ x: xS(ci), y: yS(contests[ci].newRating), c: contests[ci] });
  };

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 270 }}
        onMouseMove={handleMove} onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id="rh-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridRs.map(r => (
          <g key={r}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yS(r)} y2={yS(r)} stroke="#ffffff07" strokeWidth={1} />
            <text x={PAD.l - 7} y={yS(r)} textAnchor="end" dominantBaseline="middle" fill="#4b5563" fontSize={10}>{r}</text>
          </g>
        ))}

        {/* Fill + line */}
        <path d={fill} fill="url(#rh-fill)" />
        <path d={line} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />

        {/* Projection */}
        {projLine && (
          <path d={projLine} fill="none" stroke={projColor} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.65} />
        )}

        {/* Peak dot */}
        <circle cx={xS(peakIdx)} cy={yS(ratings[peakIdx])} r={5} fill="#f59e0b" stroke="#0d0d0d" strokeWidth={2} />
        <text x={xS(peakIdx)} y={yS(ratings[peakIdx]) - 12} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">
          ★ {ratings[peakIdx]}
        </text>

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - PAD.b + 16} textAnchor="middle" fill="#374151" fontSize={9}>{l.label}</text>
        ))}

        {/* Hover tooltip */}
        {tooltip && (() => {
          const delta = tooltip.c.newRating - tooltip.c.oldRating;
          const tx    = Math.min(tooltip.x + 10, W - 155);
          const ty    = Math.max(PAD.t, tooltip.y - 35);
          return (
            <>
              <line x1={tooltip.x} x2={tooltip.x} y1={PAD.t} y2={PAD.t + cH} stroke="#ffffff18" strokeWidth={1} strokeDasharray="3,3" />
              <circle cx={tooltip.x} cy={tooltip.y} r={5} fill={getRatingColor(tooltip.c.newRating)} stroke="#0d0d0d" strokeWidth={2} />
              <rect x={tx} y={ty} width={148} height={58} rx={7} fill="#111827" stroke="#1f2937" strokeWidth={1} />
              <text x={tx + 10} y={ty + 18} fill={getRatingColor(tooltip.c.newRating)} fontSize={13} fontWeight="bold">
                {tooltip.c.newRating} {delta >= 0 ? '▲' : '▼'}{Math.abs(delta)}
              </text>
              <text x={tx + 10} y={ty + 33} fill="#9ca3af" fontSize={9}>{tooltip.c.contestName.slice(0, 24)}{tooltip.c.contestName.length > 24 ? '…' : ''}</text>
              <text x={tx + 10} y={ty + 46} fill="#6b7280" fontSize={9}>Rank #{tooltip.c.rank}</text>
            </>
          );
        })()}
      </svg>

      {projLine && (
        <div className="absolute bottom-10 right-5 flex items-center gap-1.5 text-[10px] text-gray-600">
          <span className="w-6 border-t border-dashed border-gray-600 inline-block" />
          Projected trend
        </div>
      )}
    </div>
  );
}

// ─── 12  Activity Heatmap ─────────────────────────────────────────────────────
function ActivityHeatmap({ submissions }) {
  const [tooltip, setTooltip] = useState(null);

  const { grid, weeks } = useMemo(() => {
    const acMap = {};
    submissions.forEach(s => {
      if (s.verdict !== 'OK') return;
      const d   = new Date(s.creationTimeSeconds * 1000);
      const key = d.toISOString().slice(0, 10);
      acMap[key] = (acMap[key] || 0) + 1;
    });
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    const days   = 53 * 7;
    const arr    = [];
    for (let i = days - 1; i >= 0; i--) {
      const d   = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ date: key, count: acMap[key] || 0 });
    }
    const wks = [];
    for (let i = 0; i < arr.length; i += 7) wks.push(arr.slice(i, i + 7));
    return { grid: arr, weeks: wks };
  }, [submissions]);

  const maxCount = Math.max(...grid.map(d => d.count), 1);
  const getColor = (n) => {
    if (n === 0) return '#0d1117';
    const p = n / maxCount;
    if (p < 0.25) return '#14532d';
    if (p < 0.5)  return '#15803d';
    if (p < 0.75) return '#16a34a';
    return '#4ade80';
  };

  const CELL = 11; const GAP = 2;

  return (
    <div className="overflow-x-auto relative">
      {tooltip && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 whitespace-nowrap z-10 pointer-events-none">
          <span className="text-green-400 font-bold">{tooltip.count} problem{tooltip.count !== 1 ? 's' : ''} solved</span>
          {' · '}{tooltip.date}
        </div>
      )}
      <div className="flex gap-[2px]" style={{ minWidth: weeks.length * (CELL + GAP) }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day, di) => (
              <div key={di} className="rounded-[2px] cursor-default transition-all"
                style={{ width: CELL, height: CELL, background: getColor(day.count), outline: tooltip?.date === day.date ? '1px solid #4ade80' : 'none' }}
                onMouseEnter={() => setTooltip(day)}
                onMouseLeave={() => setTooltip(null)} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-gray-600">Less</span>
        {['#0d1117', '#14532d', '#15803d', '#16a34a', '#4ade80'].map(c => (
          <div key={c} className="rounded-[2px]" style={{ width: CELL, height: CELL, background: c }} />
        ))}
        <span className="text-[10px] text-gray-600">More</span>
      </div>
    </div>
  );
}

// ─── 7  Tag Radar ─────────────────────────────────────────────────────────────
function TagRadar({ submissions }) {
  const [hov, setHov] = useState(null);

  const tags = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      (s.problem.tags || []).forEach(tag => {
        const key = `${s.problem.contestId}${s.problem.index}`;
        if (!map[tag]) map[tag] = { ac: new Set(), all: new Set() };
        map[tag].all.add(key);
        if (s.verdict === 'OK') map[tag].ac.add(key);
      });
    });
    return Object.entries(map)
      .map(([t, v]) => ({ tag: t, ac: v.ac.size, total: v.all.size }))
      .sort((a, b) => b.ac - a.ac)
      .slice(0, 10);
  }, [submissions]);

  if (!tags.length) return <p className="text-gray-600 text-sm">No data yet.</p>;

  const SIZE = 230; const cx = SIZE / 2; const cy = SIZE / 2; const R = 88;
  const n = tags.length;
  const maxAC = Math.max(...tags.map(t => t.ac), 1);

  const angle = (i) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pt    = (i, r) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });
  const poly  = (frac) => Array.from({ length: n }, (_, i) => { const p = pt(i, R * frac); return `${p.x},${p.y}`; }).join(' ');
  const dataPoly = tags.map((t, i) => { const p = pt(i, R * (t.ac / maxAC)); return `${p.x},${p.y}`; }).join(' ');

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <polygon key={f} points={poly(f)} fill="none" stroke="#ffffff09" strokeWidth={1} />
        ))}
        {tags.map((_, i) => {
          const p = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#ffffff09" strokeWidth={1} />;
        })}
        <polygon points={dataPoly} fill="#6d28d9" fillOpacity={0.28} stroke="#7c3aed" strokeWidth={1.5} />
        {tags.map((t, i) => {
          const p  = pt(i, R * (t.ac / maxAC));
          const lp = pt(i, R + 24);
          return (
            <g key={t.tag} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
              <circle cx={p.x} cy={p.y} r={hov === i ? 5 : 3.5} fill={hov === i ? '#a78bfa' : '#7c3aed'} stroke="#0d0d0d" strokeWidth={1.5} />
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                fill={hov === i ? '#a78bfa' : '#4b5563'} fontSize={hov === i ? 10 : 8.5} fontWeight={hov === i ? 'bold' : 'normal'}>
                {t.tag.length > 13 ? t.tag.slice(0, 13) + '…' : t.tag}
              </text>
            </g>
          );
        })}
      </svg>
      {hov !== null && tags[hov] && (
        <p className="text-xs text-gray-400">
          <span className="text-violet-400 font-bold">{tags[hov].tag}</span>
          {' — '}{tags[hov].ac} AC / {tags[hov].total} unique problems
        </p>
      )}
    </div>
  );
}

// ─── Generic animated donut ──────────────────────────────────────────────────
function MiniDonut({ slices, size = 150, thick = 18, centerLabel, centerSub }) {
  const [hov, setHov] = useState(null);
  const rafRef = useRef(null);
  const [rev, setRev] = useState(0);
  const r = (size - thick) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2; const cy = size / 2;
  const total = slices.reduce((a, s) => a + s.value, 0);

  const key = slices.map(s => s.value).join(',');
  useEffect(() => {
    setRev(0); let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 700, 1); setRev(easeOut(p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [key]);

  let off = 0;
  const arcs = slices.filter(s => s.value > 0).map(s => {
    const dash = (s.value / total) * circ * rev;
    const arc  = { ...s, dash, gap: circ - dash, off };
    off += dash; return arc;
  });

  const hovArc = hov !== null ? arcs[hov] : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#111827" strokeWidth={thick} />
          {arcs.map((a, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color}
              strokeWidth={hov === i ? thick + 3 : thick}
              strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={-a.off}
              style={{ cursor: 'pointer', transition: 'stroke-width .15s' }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hovArc ? (
            <>
              <span className="text-sm font-black text-white">{hovArc.value.toLocaleString()}</span>
              <span className="text-[9px] text-gray-500 text-center px-1">{hovArc.label}</span>
            </>
          ) : (
            <>
              {centerLabel && <span className="text-sm font-black text-white">{centerLabel}</span>}
              {centerSub   && <span className="text-[9px] text-gray-500">{centerSub}</span>}
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full">
        {slices.filter(s => s.value > 0).map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-500 truncate">{s.label} <span className="text-gray-400 font-semibold">({s.value})</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Generic bar chart ────────────────────────────────────────────────────────
function BarChart({ items, color = '#7c3aed', height = 130 }) {
  const [hov, setHov] = useState(null);
  const maxV = Math.max(...items.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-1" style={{ height }}>
        {items.map((item, i) => {
          const pct = (item.value / maxV) * 100;
          const c   = item.color || color;
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5"
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              {hov === i && (
                <span className="text-[10px] font-bold text-white bg-gray-800 rounded px-1 whitespace-nowrap">{item.value}</span>
              )}
              <div className="w-full rounded-t-sm transition-all duration-300"
                style={{ height: `${Math.max(pct, 2)}%`, background: hov === i ? c : `${c}88` }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {items.map((item, i) => (
          <div key={item.label} className="flex-1 text-center text-[8px] text-gray-600 truncate" title={item.label}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ProfileAnalysis Component ───────────────────────────────────────────
export default function ProfileAnalysis({ darkMode, cfHandle }) {
  const [userInfo,     setUserInfo]     = useState(null);
  const [contests,     setContests]     = useState([]);
  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [showAllConts, setShowAllConts] = useState(false);
  const [contSort,     setContSort]     = useState({ key: 'date', dir: -1 });

  useEffect(() => {
    if (!cfHandle) { setLoading(false); return; }
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [info, rating, subs] = await Promise.all([
          cfFetch(`user.info?handles=${cfHandle}`),
          cfFetch(`user.rating?handle=${cfHandle}`),
          cfFetch(`user.status?handle=${cfHandle}&count=10000`),
        ]);
        setUserInfo(info[0] || null);
        setContests(rating);
        setSubmissions(subs);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };
    load();
  }, [cfHandle]);

  // ── All derived stats in one big useMemo ────────────────────────────────────
  const S = useMemo(() => {
    if (!contests.length && !submissions.length) return null;

    // Peak / current
    const peakRating    = contests.length ? Math.max(...contests.map(c => c.newRating)) : 0;
    const currentRating = userInfo?.rating || 0;

    // Best/worst contest
    const bestContest  = [...contests].sort((a, b) => a.rank - b.rank)[0];
    const worstContest = [...contests].sort((a, b) =>
      (a.newRating - a.oldRating) - (b.newRating - b.oldRating))[0];

    // Division breakdown
    const divMap = {};
    contests.forEach(c => {
      const d = getDivision(c.contestName);
      if (!divMap[d]) divMap[d] = { count: 0, deltas: [], ranks: [] };
      divMap[d].count++;
      divMap[d].deltas.push(c.newRating - c.oldRating);
      divMap[d].ranks.push(c.rank);
    });
    const divBreakdown = Object.entries(divMap).map(([div, v]) => ({
      label:    div,
      count:    v.count,
      avgDelta: Math.round(v.deltas.reduce((a, b) => a + b, 0) / v.count),
      avgRank:  Math.round(v.ranks.reduce((a, b) => a + b, 0) / v.count),
      color:    DIV_COLOR[div] || '#6b7280',
    })).sort((a, b) => b.count - a.count);

    // Unique AC problems
    const acProblems = {};
    const acByRating = {};
    const acByIndex  = {};
    submissions.forEach(s => {
      if (s.verdict !== 'OK') return;
      const key = `${s.problem.contestId}${s.problem.index}`;
      if (!acProblems[key]) {
        acProblems[key] = true;
        if (s.problem.rating) {
          const b = Math.floor(s.problem.rating / 100) * 100;
          acByRating[b] = (acByRating[b] || 0) + 1;
        }
        const idx = (s.problem.index || '').charAt(0).toUpperCase();
        if (idx) acByIndex[idx] = (acByIndex[idx] || 0) + 1;
      }
    });

    const diffBars  = Object.entries(acByRating)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([r, v]) => ({ label: String(r), value: v, color: getRatingColor(Number(r)) }));

    const indexBars = Object.entries(acByIndex)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([l, v]) => ({ label: l, value: v }));

    // Verdict distribution
    const verdictMap = {};
    submissions.forEach(s => {
      const v =
        s.verdict === 'OK'                     ? 'AC'  :
        s.verdict === 'WRONG_ANSWER'           ? 'WA'  :
        s.verdict === 'TIME_LIMIT_EXCEEDED'    ? 'TLE' :
        s.verdict === 'MEMORY_LIMIT_EXCEEDED'  ? 'MLE' :
        s.verdict === 'RUNTIME_ERROR'          ? 'RE'  :
        s.verdict === 'COMPILATION_ERROR'      ? 'CE'  : 'Other';
      verdictMap[v] = (verdictMap[v] || 0) + 1;
    });
    const verdictSlices = VERDICT_META.map(m => ({ ...m, value: verdictMap[m.key] || 0 })).filter(s => s.value > 0);

    // Language distribution
    const langMap = {};
    submissions.forEach(s => {
      const l = (s.programmingLanguage || 'Unknown').replace(/\s*\d[\d.]*$/, '').trim();
      langMap[l] = (langMap[l] || 0) + 1;
    });
    const langPalette = ['#7c3aed','#0ea5e9','#f59e0b','#10b981','#f87171','#a78bfa','#6b7280'];
    const langSlices  = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 7)
      .map(([l, v], i) => ({ label: l, value: v, color: langPalette[i] }));

    // Weakest tags (AC ratio, min 3 unique problem attempts)
    const tagMap = {};
    submissions.forEach(s => {
      (s.problem.tags || []).forEach(tag => {
        const key = `${s.problem.contestId}${s.problem.index}`;
        if (!tagMap[tag]) tagMap[tag] = { ac: new Set(), all: new Set() };
        tagMap[tag].all.add(key);
        if (s.verdict === 'OK') tagMap[tag].ac.add(key);
      });
    });
    const weakTags = Object.entries(tagMap)
      .filter(([, v]) => v.all.size >= 3)
      .map(([tag, v]) => ({ tag, ac: v.ac.size, attempted: v.all.size, ratio: v.ac.size / v.all.size }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 12);

    // Persistent failures (≥3 wrong attempts, never AC'd)
    const pfMap = {};
    submissions.forEach(s => {
      const key = `${s.problem.contestId}${s.problem.index}`;
      if (!pfMap[key]) pfMap[key] = { name: s.problem.name, rating: s.problem.rating, ac: false, count: 0, contestId: s.problem.contestId, index: s.problem.index };
      if (s.verdict === 'OK') pfMap[key].ac = true;
      else pfMap[key].count++;
    });
    const persistentFailures = Object.values(pfMap)
      .filter(p => !p.ac && p.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Streaks
    const acDates = new Set(
      submissions.filter(s => s.verdict === 'OK')
        .map(s => new Date(s.creationTimeSeconds * 1000).toISOString().slice(0, 10))
    );
    const sorted = Array.from(acDates).sort();
    let curStreak = 0; let longestStreak = 0; let streak = 0; let prev = null;
    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    sorted.forEach(d => {
      if (!prev) streak = 1;
      else { const diff = (new Date(d) - new Date(prev)) / 86400000; streak = diff === 1 ? streak + 1 : 1; }
      longestStreak = Math.max(longestStreak, streak); prev = d;
    });
    if (sorted.includes(today) || sorted.includes(yesterday)) curStreak = streak;

    return {
      peakRating, currentRating, bestContest, worstContest, divBreakdown,
      diffBars, verdictSlices, langSlices, weakTags, persistentFailures, indexBars,
      currentStreak: curStreak, longestStreak,
      totalAC:          Object.keys(acProblems).length,
      totalSubmissions: submissions.length,
    };
  }, [contests, submissions, userInfo]);

  // Sorted contest table
  const sortedContests = useMemo(() => {
    const arr = [...contests];
    const { key, dir } = contSort;
    arr.sort((a, b) => {
      if (key === 'date')   return dir * (a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds);
      if (key === 'rating') return dir * (a.newRating - b.newRating);
      if (key === 'delta')  return dir * ((a.newRating - a.oldRating) - (b.newRating - b.oldRating));
      if (key === 'rank')   return dir * (a.rank - b.rank);
      return 0;
    });
    return arr;
  }, [contests, contSort]);

  const toggleSort = (key) =>
    setContSort(p => ({ key, dir: p.key === key ? -p.dir : -1 }));

  // States
  if (!cfHandle) return (
    <div className="py-20 text-center text-gray-500">
      <span className="text-4xl block mb-3">🔗</span>
      <p className="font-medium">Connect your Codeforces handle in Profile to view analysis.</p>
    </div>
  );
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-800 border-t-violet-500 mb-4" />
      <span>Loading profile analysis…</span>
    </div>
  );
  if (error) return (
    <div className="py-16 text-center rounded-2xl border border-red-900/40 bg-red-950/20 text-red-400">
      <p className="text-2xl mb-2">⚠️</p><p>{error}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">

      {/* ── User Header ────────────────────────────────────────────────────── */}
      {userInfo && (
        <div className={`${CARD} flex flex-col sm:flex-row items-center sm:items-start gap-5`} style={CARDST}>
          <img src={userInfo.titlePhoto || userInfo.avatar} alt={cfHandle}
            className="w-20 h-20 rounded-2xl object-cover border-2"
            style={{ borderColor: getRatingColor(userInfo.rating) }} />
          <div className="flex-1 flex flex-col gap-1 text-center sm:text-left">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <h2 className="text-2xl font-black text-white">{userInfo.handle}</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: `${getRatingColor(userInfo.rating)}18`, color: getRatingColor(userInfo.rating) }}>
                {getRatingTitle(userInfo.rating)}
              </span>
            </div>
            {(userInfo.organization || userInfo.country) && (
              <p className="text-xs text-gray-500">
                {[userInfo.organization, userInfo.country].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              {[
                { label: 'Current',    value: userInfo.rating,    color: getRatingColor(userInfo.rating) },
                { label: 'Peak',       value: userInfo.maxRating, color: getRatingColor(userInfo.maxRating) },
                { label: 'Contests',   value: contests.length,    color: '#6b7280' },
                { label: 'Total AC',   value: S?.totalAC,         color: '#10b981' },
                { label: 'Friends of', value: userInfo.friendOfCount, color: '#6b7280' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center px-3 py-1.5 rounded-xl border border-gray-800 bg-black">
                  <span className="text-base font-black" style={{ color }}>{value ?? '—'}</span>
                  <span className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 1+5  Rating History + Projection ───────────────────────────────── */}
      {contests.length >= 2 && (
        <div className={CARD} style={CARDST}>
          <SectionTitle>Rating History &amp; Trend Projection</SectionTitle>
          <RatingHistoryChart contests={contests} />
        </div>
      )}

      {/* ── 3 + 13 + 15  Stat cards ─────────────────────────────────────────── */}
      {S && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { emoji: '⭐', title: 'Best Contest',  value: `#${S.bestContest?.rank}`,   sub: S.bestContest?.contestName?.slice(0, 28), color: '#f59e0b' },
            { emoji: '📉', title: 'Worst Drop',    value: S.worstContest ? `${S.worstContest.newRating - S.worstContest.oldRating}` : '—', sub: S.worstContest?.contestName?.slice(0, 28), color: '#ef4444' },
            { emoji: '🔥', title: 'Streak',        value: `${S.currentStreak}d`,        sub: `Longest ever: ${S.longestStreak} days`, color: '#fb923c' },
            { emoji: '🏆', title: 'Peak',          value: S.peakRating,                  sub: S.peakRating > S.currentRating ? `${S.peakRating - S.currentRating} below peak` : '🎉 At peak!', color: getRatingColor(S.peakRating) },
          ].map(c => (
            <div key={c.title} className={`${CARD} flex flex-col gap-1.5`} style={CARDST}>
              <span className="text-xl">{c.emoji}</span>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">{c.title}</p>
              <p className="text-xl font-black leading-none" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[10px] text-gray-600 leading-snug">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 12  Activity Heatmap ─────────────────────────────────────────────── */}
      {submissions.length > 0 && (
        <div className={CARD} style={CARDST}>
          <SectionTitle>Activity Heatmap — last 53 weeks (AC only)</SectionTitle>
          <ActivityHeatmap submissions={submissions} />
        </div>
      )}

      {/* ── 7 + 8  Radar + Weakest Tags ─────────────────────────────────────── */}
      {S && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={CARD} style={CARDST}>
            <SectionTitle>Tag Strength Radar (top 10 by AC)</SectionTitle>
            <TagRadar submissions={submissions} />
          </div>
          <div className={CARD} style={CARDST}>
            <SectionTitle>Weakest Tags — AC ratio (≥ 3 unique attempts)</SectionTitle>
            <div className="flex flex-col gap-2.5 mt-1">
              {S.weakTags.length === 0
                ? <p className="text-gray-600 text-sm">Not enough data yet.</p>
                : S.weakTags.map(t => (
                  <div key={t.tag} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 w-32 shrink-0 truncate" title={t.tag}>{t.tag}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-900 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${t.ratio * 100}%`, background: t.ratio < 0.4 ? '#ef4444' : t.ratio < 0.7 ? '#f59e0b' : '#10b981' }} />
                    </div>
                    <span className="text-[11px] text-gray-500 w-14 text-right shrink-0">
                      {t.ac}/{t.attempted}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 9 + 14 + 6  Verdicts · Languages · Difficulty ──────────────────── */}
      {S && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={CARD} style={CARDST}>
            <SectionTitle>Verdict Distribution</SectionTitle>
            <MiniDonut slices={S.verdictSlices} size={150} thick={18}
              centerLabel={S.totalSubmissions.toLocaleString()} centerSub="total subs" />
          </div>
          <div className={CARD} style={CARDST}>
            <SectionTitle>Language Distribution</SectionTitle>
            <MiniDonut slices={S.langSlices} size={150} thick={18}
              centerLabel={S.langSlices.length} centerSub="languages" />
          </div>
          <div className={CARD} style={CARDST}>
            <SectionTitle>Solved by Difficulty</SectionTitle>
            <BarChart items={S.diffBars} height={150} />
          </div>
        </div>
      )}

      {/* ── 4 + 11  Division + Problem Index ──────────────────────────────── */}
      {S && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={CARD} style={CARDST}>
            <SectionTitle>Division Breakdown</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {S.divBreakdown.map(d => {
                const maxC = Math.max(...S.divBreakdown.map(x => x.count));
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold w-28 shrink-0" style={{ color: d.color }}>{d.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-900 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(d.count / maxC) * 100}%`, background: d.color }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-28 text-right shrink-0">
                      {d.count}ct · avg Δ<span style={{ color: d.avgDelta >= 0 ? '#10b981' : '#ef4444' }}>{d.avgDelta >= 0 ? '+' : ''}{d.avgDelta}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={CARD} style={CARDST}>
            <SectionTitle>Problems Solved by Index (A / B / C …)</SectionTitle>
            <BarChart items={S.indexBars} height={130} color="#7c3aed" />
          </div>
        </div>
      )}

      {/* ── 10  Persistent Failures ─────────────────────────────────────────── */}
      {S && S.persistentFailures.length > 0 && (
        <div className={CARD} style={CARDST}>
          <SectionTitle>Persistent Failures — ≥ 3 attempts, never AC'd</SectionTitle>
          <div className="flex flex-col gap-2">
            {S.persistentFailures.map(p => (
              <div key={`${p.contestId}${p.index}`}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-red-900/20 bg-red-950/10 hover:bg-red-950/20 transition-colors">
                <a href={`https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-red-400 hover:text-red-300 font-medium flex-1 line-clamp-1">
                  {p.contestId}{p.index} · {p.name}
                </a>
                <div className="flex items-center gap-2 shrink-0">
                  {p.rating && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded border"
                      style={{ color: getRatingColor(p.rating), borderColor: `${getRatingColor(p.rating)}30`, background: `${getRatingColor(p.rating)}10` }}>
                      {p.rating}
                    </span>
                  )}
                  <span className="text-[11px] text-red-500 font-bold whitespace-nowrap">{p.count} WA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2  Contest Performance Table ────────────────────────────────────── */}
      {contests.length > 0 && (
        <div className={CARD} style={CARDST}>
          <SectionTitle>Contest Performance — {contests.length} rated contests</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {[
                    { key: 'date',   label: 'Date' },
                    { key: 'name',   label: 'Contest' },
                    { key: 'rank',   label: 'Rank' },
                    { key: 'delta',  label: 'Δ' },
                    { key: 'rating', label: 'Rating' },
                  ].map(col => (
                    <th key={col.key}
                      className="text-left py-2 pr-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest cursor-pointer hover:text-gray-400 transition-colors select-none"
                      onClick={() => col.key !== 'name' && toggleSort(col.key)}>
                      {col.label}{contSort.key === col.key ? (contSort.dir === 1 ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(showAllConts ? sortedContests : sortedContests.slice(0, 12)).map(c => {
                  const delta = c.newRating - c.oldRating;
                  return (
                    <tr key={c.contestId} className="border-t border-gray-800/30 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pr-4 text-[11px] text-gray-600 whitespace-nowrap">
                        {new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                      <td className="py-2 pr-4 max-w-[200px] text-xs">
                        <a href={`https://codeforces.com/contest/${c.contestId}`} target="_blank" rel="noopener noreferrer"
                          className="text-gray-300 hover:text-violet-400 transition-colors line-clamp-1">
                          {c.contestName}
                        </a>
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-400">#{c.rank}</td>
                      <td className="py-2 pr-4 text-xs font-bold" style={{ color: delta >= 0 ? '#10b981' : '#ef4444' }}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </td>
                      <td className="py-2 pr-4 text-xs font-bold" style={{ color: getRatingColor(c.newRating) }}>
                        {c.newRating}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {contests.length > 12 && (
            <button onClick={() => setShowAllConts(v => !v)}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
              {showAllConts ? '▲ Show less' : `▼ Show all ${contests.length} contests`}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
