import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

const RATING_STEPS = Array.from({ length: 28 }, (_, i) => 800 + i * 100);
const PROBLEMS_REQUIRED = 100;

// CF colour tier per rating bucket
const getRatingStyle = (r) => {
  if (!r)       return { bg: '#111',    text: '#6b7280', border: '#374151', hex: '#6b7280' };
  if (r < 1200) return { bg: '#052e16', text: '#4ade80', border: '#166534', hex: '#4ade80' };
  if (r < 1400) return { bg: '#052e16', text: '#86efac', border: '#166534', hex: '#86efac' };
  if (r < 1600) return { bg: '#0c1a2e', text: '#67e8f9', border: '#0e4f62', hex: '#67e8f9' };
  if (r < 1900) return { bg: '#0c1a2e', text: '#60a5fa', border: '#1e3a5f', hex: '#60a5fa' };
  if (r < 2100) return { bg: '#1c0f30', text: '#c084fc', border: '#4c1d95', hex: '#c084fc' };
  if (r < 2400) return { bg: '#1c1003', text: '#fbbf24', border: '#78350f', hex: '#fbbf24' };
  return         { bg: '#200a0a', text: '#f87171', border: '#7f1d1d', hex: '#f87171' };
};

// ─── easing ───────────────────────────────────────────────────────────────────
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ─── Overall Donut Chart ──────────────────────────────────────────────────────
function DonutChart({ completed, inProgress, notStarted, total }) {
  const size = 180; const stroke = 20;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2; const cy = size / 2;

  const segments = [
    { value: completed,  color: '#10b981' },
    { value: inProgress, color: '#f59e0b' },
    { value: notStarted, color: '#1f2937' },
  ].filter(s => s.value > 0);

  const [reveal, setReveal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    setReveal(0);
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setReveal(easeOut(p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [completed, inProgress, notStarted]);

  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * reveal * circ;
    const arc = { ...seg, dash, gap: circ - dash, offset };
    offset += dash;
    return arc;
  });

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#111827" strokeWidth={stroke} />
          {arcs.map((arc, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={arc.color} strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset} strokeLinecap="butt" />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{pct}%</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">levels done</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {[
          { color: '#10b981', label: 'Completed',   count: completed,  cls: 'bg-emerald-950/40 border-emerald-900/30' },
          { color: '#f59e0b', label: 'In Progress', count: inProgress, cls: 'bg-amber-950/40 border-amber-900/30' },
          { color: '#374151', label: 'Not Started', count: notStarted, cls: 'bg-gray-900/40 border-gray-800/30' },
        ].map(({ color, label, count, cls }) => (
          <div key={label} className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${cls}`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
            <span className="text-xs font-bold text-gray-200">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rating-wise Pie Chart ────────────────────────────────────────────────────
// Each slice = one rating level.
// Slice area ∝ problems REMAINING (100 - solved).  Completed levels get a
// very thin "done" slice so they're still visible in the legend.
function RatingPieChart({ journey }) {
  const [hovered, setHovered] = useState(null);
  const [revealAng, setRevealAng] = useState(0);
  const rafRef = useRef(null);

  // Build data: remaining problems per rating (min 1 so done = thin slice)
  const data = useMemo(() => journey.map(step => ({
    rating:    step.rating,
    remaining: Math.max(0, step.required - step.solved),
    solved:    step.solved,
    done:      step.done,
    style:     getRatingStyle(step.rating),
  })), [journey]);

  const totalRemaining = data.reduce((a, d) => a + d.remaining, 0);
  // completed levels take zero area in the pie chart
  const tokenData = data.map(d => ({ ...d, weight: d.done ? 0 : d.remaining }));
  const totalWeight = tokenData.reduce((a, d) => a + d.weight, 0);

  // Animate on data change
  useEffect(() => {
    setRevealAng(0);
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      setRevealAng(easeOut(p) * 360);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [journey.length, totalRemaining]);

  const size = 220;
  const cx = size / 2; const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = outerR * 0.42;

  const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  const polar = (deg, rr) => ({
    x: cx + rr * Math.cos(toRad(deg)),
    y: cy + rr * Math.sin(toRad(deg)),
  });

  const describeSlice = (startDeg, endDeg, expandDir) => {
    const expand = hovered !== null && expandDir ? 4 : 0;
    const midDeg = (startDeg + endDeg) / 2;
    const dx = expand * Math.cos(toRad(midDeg));
    const dy = expand * Math.sin(toRad(midDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const p1 = polar(startDeg, outerR); const p2 = polar(endDeg, outerR);
    const p3 = polar(endDeg, innerR);   const p4 = polar(startDeg, innerR);
    return {
      d: [
        `M ${p1.x + dx} ${p1.y + dy}`,
        `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x + dx} ${p2.y + dy}`,
        `L ${p3.x + dx} ${p3.y + dy}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x + dx} ${p4.y + dy}`,
        'Z',
      ].join(' '),
      midDeg,
    };
  };

  // Build slices, capped by revealAng
  let cumDeg = 0;
  const slices = tokenData.map((d, i) => {
    const angleDeg = totalWeight > 0 ? (d.weight / totalWeight) * 360 : 0;
    const startDeg = cumDeg;
    const endDeg   = Math.min(cumDeg + angleDeg, revealAng);
    cumDeg += angleDeg;
    if (endDeg <= startDeg) return null;
    const { d: path, midDeg } = describeSlice(startDeg, endDeg, i === hovered);
    return { ...d, path, midDeg, index: i };
  }).filter(Boolean);

  const hov = hovered !== null ? slices.find(s => s.index === hovered) : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative select-none">
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          {slices.map(slice => (
            <path
              key={slice.rating}
              d={slice.path}
              fill={slice.done ? '#10b981' : slice.style.hex}
              opacity={hovered === null ? 0.85 : hovered === slice.index ? 1 : 0.45}
              stroke="#0d0d0d"
              strokeWidth={1.5}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHovered(slice.index)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {/* Center tooltip */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hov ? (
            <>
              <span className="text-lg font-black" style={{ color: hov.done ? '#10b981' : hov.style.hex }}>
                {hov.rating}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                {hov.done ? '✓ Done' : `${hov.remaining} left`}
              </span>
              {!hov.done && (
                <span className="text-[10px] text-gray-600">{hov.solved}/100 AC</span>
              )}
            </>
          ) : (
            <>
              <span className="text-lg font-black text-white">{totalRemaining}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">probs left</span>
            </>
          )}
        </div>
      </div>

      {/* Compact legend grid */}
      <div className="grid grid-cols-3 gap-1 w-full">
        {data.map(d => (
          <div
            key={d.rating}
            className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all"
            style={{
              background: d.done ? '#052e16' : `${d.style.hex}12`,
              border: `1px solid ${d.done ? '#166534' : `${d.style.hex}30`}`,
              color: d.done ? '#10b981' : d.style.hex,
            }}
            onMouseEnter={() => {
              const idx = journey.findIndex(s => s.rating === d.rating);
              setHovered(idx >= 0 ? idx : null);
            }}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: d.done ? '#10b981' : d.style.hex }}
            />
            <span>{d.rating}</span>
            {d.done && <span className="ml-auto">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HundredHard({ darkMode, cfHandle }) {
  const [targetRating, setTargetRating] = useState(
    () => Number(localStorage.getItem('hh_targetRating')) || 1600
  );
  const [problems, setProblems]           = useState([]);
  const [problemStatus, setProblemStatus] = useState({});
  const [userRating, setUserRating]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => { localStorage.setItem('hh_targetRating', targetRating); }, [targetRating]);

  const fetchUserRating = useCallback(async (handle) => {
    try {
      const res  = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
      const data = await res.json();
      if (data.status === 'OK' && data.result?.[0]) return data.result[0].rating || 0;
    } catch (_) {}
    return null;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [probs] = await Promise.all([codeforcesAPI.fetchAllProblems()]);
      setProblems(probs);
      if (cfHandle) {
        const [subs, rating] = await Promise.all([
          codeforcesAPI.fetchUserSubmissions(cfHandle),
          fetchUserRating(cfHandle),
        ]);
        const map = {};
        (subs || []).forEach(sub => {
          const key = `${sub.problem.contestId}${sub.problem.index}`;
          if (sub.verdict === 'OK') map[key] = 'AC';
          else if (!map[key])       map[key] = 'WA';
        });
        setProblemStatus(map);
        setUserRating(rating);
      } else {
        setProblemStatus({}); setUserRating(null);
      }
    } catch (err) {
      console.error('HundredHard fetch error', err);
      setError('Failed to fetch Codeforces data. Please try again.');
    }
    setLoading(false);
  }, [cfHandle, fetchUserRating]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build journey: 800 → targetRating (full range including below current)
  const journey = useMemo(() => {
    if (!problems.length) return [];
    const acPerRating = {};
    problems.forEach(p => {
      if (!p.rating) return;
      const key = `${p.contestId}${p.index}`;
      if (problemStatus[key] === 'AC')
        acPerRating[p.rating] = (acPerRating[p.rating] || 0) + 1;
    });
    const end = Math.min(targetRating, 3500);
    const steps = [];
    for (let r = 800; r < end; r += 100) {
      const solved = acPerRating[r] || 0;
      const done   = solved >= PROBLEMS_REQUIRED;
      steps.push({
        rating: r, solved, required: PROBLEMS_REQUIRED, done,
        pct: Math.min(100, Math.round((solved / PROBLEMS_REQUIRED) * 100)),
        belowCurrent: userRating != null && r < userRating,
      });
    }
    return steps;
  }, [problems, problemStatus, userRating, targetRating]);

  const completedSteps  = journey.filter(s => s.done).length;
  const inProgressSteps = journey.filter(s => !s.done && s.solved > 0).length;
  const notStarted      = journey.filter(s => s.solved === 0).length;
  const totalSteps      = journey.length;
  const totalSolved     = journey.reduce((a, s) => a + s.solved, 0);
  const totalRequired   = totalSteps * PROBLEMS_REQUIRED;
  const overallPct      = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl border" style={{ background: '#0d0b14', borderColor: '#2d1f5e55' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            100 Hard 🔥
          </h2>
          <button onClick={fetchData} disabled={loading}
            className={`p-2 rounded-lg transition-colors border bg-[#111] border-gray-800 hover:bg-[#1a1a1a] text-gray-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh Data">
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          Solve <span className="text-amber-400 font-semibold">100 problems</span> at{' '}
          <span className="text-amber-400 font-semibold">every rating from 800</span> up to your target.
          {userRating != null && (
            <> Current rating: <span className="text-violet-400 font-bold">{userRating}</span></>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Target Rating
            </label>
            <select value={targetRating} onChange={e => setTargetRating(Number(e.target.value))}
              className="w-full p-3 rounded-xl border text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all bg-black border-gray-800 text-gray-200">
              {RATING_STEPS.filter(r => r >= 900).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {!loading && journey.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Levels Done',  value: `${completedSteps}/${totalSteps}`, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/30' },
                { label: 'Problems AC',  value: `${totalSolved}/${totalRequired}`, color: 'text-violet-400',  bg: 'bg-violet-950/30  border-violet-900/30' },
                { label: 'Overall',      value: `${overallPct}%`,                  color: 'text-amber-400',   bg: 'bg-amber-950/30   border-amber-900/30' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`flex flex-col items-center px-4 py-2 rounded-xl border ${bg}`}>
                  <span className={`text-lg font-black ${color}`}>{value}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-800 border-t-amber-500 mb-4" />
          <span>Crunching your Codeforces history…</span>
        </div>
      ) : error ? (
        <div className="py-16 text-center rounded-2xl border border-red-900/40 bg-red-950/20 text-red-400">
          <span className="text-3xl block mb-2">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 rounded-lg bg-red-950 border border-red-900/40 text-red-400 hover:bg-red-900/30 text-sm font-medium">
            Try Again
          </button>
        </div>
      ) : !cfHandle ? (
        <div className="py-16 text-center rounded-2xl border border-gray-800 bg-[#0d0d0d] text-gray-500">
          <span className="text-3xl block mb-3">🔗</span>
          <p className="font-medium">Connect your Codeforces handle in Profile to track progress.</p>
        </div>
      ) : journey.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-gray-800 bg-[#0d0d0d] text-gray-500">
          <span className="text-3xl block mb-3">🎯</span>
          <p>Set a target rating above 800 to see your journey.</p>
        </div>
      ) : (
        <>
          {/* ── Two charts side by side ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Overall donut */}
            <div className="p-5 rounded-2xl border flex flex-col gap-4"
              style={{ background: '#0d0d0d', borderColor: '#1f1f1f' }}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Overall Progress
              </h3>
              <DonutChart
                completed={completedSteps} inProgress={inProgressSteps}
                notStarted={notStarted}    total={totalSteps} />
              <div className="pt-3 border-t border-gray-800/60">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Problems solved</span>
                  <span className="text-gray-300 font-semibold">{totalSolved} / {totalRequired}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-900 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${totalRequired > 0 ? Math.min(100, Math.round(totalSolved / totalRequired * 100)) : 0}%`,
                      background: 'linear-gradient(90deg,#f59e0b,#ef4444)',
                    }} />
                </div>
                <p className="text-[11px] text-gray-600 mt-2">
                  {totalRequired - totalSolved > 0
                    ? `${totalRequired - totalSolved} more problems needed across all levels.`
                    : '🎉 All levels complete!'}
                </p>
              </div>
            </div>

            {/* Rating-wise pie */}
            <div className="p-5 rounded-2xl border flex flex-col gap-4"
              style={{ background: '#0d0d0d', borderColor: '#1f1f1f' }}>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Remaining Work by Rating
                </h3>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Slice size ∝ problems still needed. Hover to inspect. ✓ = completed.
                </p>
              </div>
              <RatingPieChart journey={journey} />
            </div>
          </div>

          {/* ── Level list ───────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            {userRating != null && journey.some(s => s.belowCurrent) && (
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Below current rating</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
            )}

            {journey.map((step, idx) => {
              const style = getRatingStyle(step.rating);
              const isMarker =
                userRating != null &&
                step.rating <= userRating &&
                (idx + 1 >= journey.length || journey[idx + 1].rating > userRating);

              return (
                <React.Fragment key={step.rating}>
                  <div className="p-4 rounded-xl border transition-all"
                    style={{
                      background: step.done ? style.bg : step.belowCurrent ? '#0f0f0f' : '#0d0d0d',
                      borderColor: step.done ? style.border : step.belowCurrent ? '#1a1a1a' : '#1f1f1f',
                    }}>
                    <div className="flex items-center gap-3">
                      {/* Rating badge */}
                      <div className="shrink-0 w-16 text-center py-1.5 rounded-lg text-sm font-bold border"
                        style={{ background: style.bg, color: style.text, borderColor: style.border }}>
                        {step.rating}
                      </div>

                      {/* Progress bar */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">{step.solved} / {step.required} AC</span>
                          {step.done ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-900/40">✓ DONE</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-gray-600">{step.required - step.solved} left</span>
                          )}
                        </div>
                        <div className="h-2 rounded-full bg-gray-900 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${step.pct}%`,
                              background: step.done
                                ? `linear-gradient(90deg,${style.hex}aa,${style.hex})`
                                : `linear-gradient(90deg,${style.hex}44,${style.hex}88)`,
                            }} />
                        </div>
                      </div>

                      <div className="shrink-0 w-11 text-right text-sm font-bold" style={{ color: style.text }}>
                        {step.pct}%
                      </div>
                    </div>
                  </div>

                  {isMarker && (
                    <div className="flex items-center gap-3 my-0.5">
                      <div className="flex-1 h-px bg-violet-900/60" />
                      <span className="text-[11px] font-bold text-violet-400 shrink-0 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                        You are here · {userRating}
                      </span>
                      <div className="flex-1 h-px bg-violet-900/60" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
