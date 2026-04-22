import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/firebaseStorage';
import { codeforcesAPI } from '../services/codeforcesApi';
import { toast } from 'react-hot-toast';

const LANGUAGES = ['C++', 'Python', 'Java', 'C', 'JavaScript', 'Go', 'Rust', 'Kotlin', 'Other'];


function AddModal({ onClose, onSave, existing }) {
  const [url, setUrl] = useState(existing?.url || '');
  const [code, setCode] = useState(existing?.code || '');
  const [lang, setLang] = useState(existing?.language || 'C++');
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!url.trim()) { setError('Please enter a problem URL.'); return; }
    if (!code.trim()) { setError('Please paste your solution code.'); return; }

    setFetching(true);
    let problemData = null;
    try {
      const parsed = codeforcesAPI.parseProblemInput(url.trim());
      if (!parsed) { setError('Invalid Codeforces URL.'); setFetching(false); return; }
      problemData = await codeforcesAPI.findProblem(parsed.contestId, parsed.index);
      if (!problemData) { setError('Could not fetch problem from CF API. Try again.'); setFetching(false); return; }
    } catch {
      setError('Network error while fetching problem info.'); setFetching(false); return;
    }
    setFetching(false);

    setSaving(true);
    try {
      const parsed = codeforcesAPI.parseProblemInput(url.trim());
      const entry = {
        id: `${parsed.contestId}${parsed.index}`,
        contestId: parsed.contestId,
        index: parsed.index,
        name: problemData.name || `${parsed.contestId}${parsed.index}`,
        rating: problemData.rating || null,
        tags: problemData.tags || [],
        url: codeforcesAPI.getProblemUrl(parsed.contestId, parsed.index),
        code,
        language: lang,
        solvedOnCF: existing?.solvedOnCF || false,
        lastChecked: existing?.lastChecked || null,
      };
      await onSave(entry);
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-[#0e0b1a] border border-purple-900/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-purple-200">{existing ? 'Edit Entry' : 'Add Pre-Solve Entry'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Codeforces Problem URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://codeforces.com/problemset/problem/1462/A"
              className="w-full bg-[#13101f] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-600 transition"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Language</label>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="bg-[#13101f] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-600 transition"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Code */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Your Solution Code</label>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="// Paste your pre-solved solution here..."
              rows={14}
              className="w-full bg-[#0a0814] border border-white/8 rounded-xl px-4 py-3 text-sm text-emerald-300 placeholder-gray-700 focus:outline-none focus:border-purple-600 font-mono resize-none transition"
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/40 rounded-lg px-4 py-2">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 transition">Cancel</button>
          <button
            onClick={handleSave}
            disabled={fetching || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-700 to-violet-600 hover:brightness-110 disabled:opacity-50 transition"
          >
            {fetching ? 'Fetching problem…' : saving ? 'Saving…' : existing ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry Card ─────────────────────────────────
function EntryCard({ entry, onDelete, onRecheck, onEdit, onCopy, checking }) {
  const ratingColor =
    !entry.rating ? 'text-gray-500' :
    entry.rating < 1200 ? 'text-gray-400' :
    entry.rating < 1400 ? 'text-green-400' :
    entry.rating < 1600 ? 'text-cyan-400' :
    entry.rating < 1900 ? 'text-blue-400' :
    entry.rating < 2100 ? 'text-violet-400' :
    entry.rating < 2400 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="relative bg-gradient-to-br from-[#0e0b1a] to-[#130f22] border border-purple-900/25 rounded-2xl p-5 flex flex-col gap-3 hover:border-purple-700/40 transition-all duration-200 group">
      {/* Solved badge */}
      <div className="absolute top-4 right-4">
        {entry.solvedOnCF ? (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Solved on CF
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Not Yet Solved
          </span>
        )}
      </div>

      {/* Problem name */}
      <div className="pr-28">
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-semibold text-gray-100 hover:text-purple-300 transition-colors leading-snug"
        >
          {entry.contestId}{entry.index} — {entry.name}
        </a>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {entry.rating && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/8 ${ratingColor}`}>
            ★ {entry.rating}
          </span>
        )}
        <span className="text-xs px-2 py-0.5 rounded-md bg-purple-900/30 border border-purple-800/30 text-purple-300">
          {entry.language}
        </span>
        {(entry.tags || []).slice(0, 3).map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-white/4 border border-white/6 text-gray-500">{tag}</span>
        ))}
        {(entry.tags || []).length > 3 && (
          <span className="text-xs text-gray-600">+{entry.tags.length - 3}</span>
        )}
      </div>

      {/* Code preview */}
      <div className="bg-[#080612] border border-white/5 rounded-xl p-3 font-mono text-xs text-emerald-400/80 max-h-28 overflow-hidden relative">
        <pre className="whitespace-pre-wrap break-all leading-relaxed">{entry.code?.slice(0, 300)}{entry.code?.length > 300 ? '\n…' : ''}</pre>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#080612] to-transparent" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onCopy(entry.code)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/30 text-purple-300 text-xs font-medium transition-all"
        >
          📋 Copy Code
        </button>
        <button
          onClick={() => onRecheck(entry)}
          disabled={checking === entry.id}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 text-xs font-medium transition-all disabled:opacity-50"
        >
          {checking === entry.id ? '⏳ Checking…' : '🔄 Re-check'}
        </button>
        <button
          onClick={() => onEdit(entry)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 text-xs font-medium transition-all"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-800/30 text-red-400 text-xs font-medium transition-all"
        >
          🗑️ Delete
        </button>
      </div>

      {/* Last checked */}
      {entry.lastChecked && (
        <p className="text-[10px] text-gray-700 -mt-1">
          Last checked: {new Date(entry.lastChecked).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────
export default function PreSolve({ cfHandle }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filter, setFilter] = useState('all'); // all | solved | unsolved
  const [checking, setChecking] = useState(null); // entry id being re-checked
  const [bulkChecking, setBulkChecking] = useState(false);

  const showToast = (message, type = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  };

  // Load entries
  const loadEntries = useCallback(async () => {
    if (!cfHandle) return;
    setLoading(true);
    const data = await storage.getPresolveEntries(cfHandle);
    setEntries(data);
    setLoading(false);
  }, [cfHandle]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Save (add or edit)
  const handleSave = async (entry) => {
    const existing = entries.find(e => e.id === entry.id);
    if (existing && !editingEntry) throw new Error('This problem is already in your Pre-Solve vault.');
    const updated = await storage.addPresolveEntry(entry, cfHandle);
    setEntries(updated);
    setEditingEntry(null);
    showToast(editingEntry ? 'Entry updated!' : 'Problem added to vault! ✅');
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this pre-solve entry?')) return;
    const updated = await storage.removePresolveEntry(id, cfHandle);
    setEntries(updated);
    showToast('Entry removed.', 'error');
  };

  // Re-check single entry
  const handleRecheck = async (entry) => {
    setChecking(entry.id);
    try {
      const solved = await codeforcesAPI.isProblemSolved(cfHandle, entry.contestId, entry.index);
      const updated = await storage.updatePresolveEntry(entry.id, { solvedOnCF: solved, lastChecked: Date.now() }, cfHandle);
      setEntries(updated);
      showToast(solved ? `${entry.id} is solved on CF! ✅` : `${entry.id} not solved yet on CF.`);
    } catch {
      showToast('Failed to check CF status.', 'error');
    }
    setChecking(null);
  };

  // Bulk re-check all
  const handleBulkRecheck = async () => {
    setBulkChecking(true);
    try {
      const solvedSet = await codeforcesAPI.getSolvedProblems(cfHandle);
      let updated = [...entries];
      for (const entry of entries) {
        const solved = solvedSet.has(`${entry.contestId}${entry.index}`);
        await storage.updatePresolveEntry(entry.id, { solvedOnCF: solved, lastChecked: Date.now() }, cfHandle);
        updated = updated.map(e => e.id === entry.id ? { ...e, solvedOnCF: solved, lastChecked: Date.now() } : e);
      }
      setEntries(await storage.getPresolveEntries(cfHandle));
      showToast('All statuses refreshed! ✅');
    } catch {
      showToast('Failed to refresh statuses.', 'error');
    }
    setBulkChecking(false);
  };

  // Copy code
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => showToast('Code copied to clipboard! 📋'));
  };

  // Filter entries
  const filtered = entries.filter(e => {
    if (filter === 'solved') return e.solvedOnCF;
    if (filter === 'unsolved') return !e.solvedOnCF;
    return true;
  });

  const solved = entries.filter(e => e.solvedOnCF).length;
  const unsolved = entries.length - solved;

  return (
    <div className="min-h-[60vh] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            🧠 Pre-Solve Vault
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Store your pre-solved solutions. One-click copy when you need them in a contest.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkRecheck}
            disabled={bulkChecking || entries.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-300 text-sm font-medium transition-all disabled:opacity-40"
          >
            {bulkChecking ? '⏳ Checking…' : '🔄 Refresh All'}
          </button>
          <button
            onClick={() => { setEditingEntry(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-violet-600 hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-900/30"
          >
            + Add Solution
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: entries.length, color: 'text-gray-200', bg: 'bg-white/4' },
          { label: 'Solved on CF', value: solved, color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
          { label: 'Not Yet Solved', value: unsolved, color: 'text-amber-400', bg: 'bg-amber-950/30' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-white/6 rounded-xl px-5 py-4 flex flex-col gap-1`}>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-gray-500 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {['all', 'solved', 'unsolved'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === f
                ? 'bg-purple-700 border-purple-600 text-white'
                : 'bg-white/4 border-white/8 text-gray-400 hover:bg-white/8'
            }`}
          >
            {f === 'all' ? `All (${entries.length})` : f === 'solved' ? `Solved (${solved})` : `Unsolved (${unsolved})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-800 border-t-purple-500" />
          <p className="text-sm text-gray-500">Loading vault…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-white/5 rounded-2xl bg-white/[0.02]">
          <span className="text-5xl">🧠</span>
          <p className="text-gray-400 font-medium">
            {entries.length === 0 ? 'Your vault is empty. Add your first pre-solved solution!' : 'No entries match this filter.'}
          </p>
          {entries.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold transition"
            >
              + Add First Solution
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              onRecheck={handleRecheck}
              onEdit={(e) => { setEditingEntry(e); setShowModal(true); }}
              onCopy={handleCopy}
              checking={checking}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddModal
          existing={editingEntry}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSave={handleSave}
        />
      )}

      {/* Toast */}
    </div>
  );
}
