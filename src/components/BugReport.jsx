import { useState, useEffect } from 'react';
import { LuBug, LuX, LuSend, LuCircleCheck, LuTriangleAlert, LuInfo } from 'react-icons/lu';
import { submitBugReport, getUserDailyReportCount, auth } from '../services/firebase';

const MAX_DAILY = 5;
const MIN_LEN = 10;
const MAX_LEN = 1000;

export default function BugReport({ isOpen, onClose, cfHandle }) {
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyCount = async () => {
      if (isOpen && auth.currentUser) {
        setLoading(true);
        try {
          const count = await getUserDailyReportCount(auth.currentUser.uid);
          setDailyCount(count);
        } catch (err) {
          console.error('Error fetching daily count:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDailyCount();
  }, [isOpen]);

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setReportText('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = reportText.trim();
    if (!trimmed) { setError('Please describe the bug.'); return; }
    if (trimmed.length < MIN_LEN) { setError(`Please provide at least ${MIN_LEN} characters.`); return; }

    setSubmitting(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('You must be signed in to submit a report.');
      await submitBugReport(user.uid, user.email || 'No email', cfHandle, trimmed);
      setSuccess(true);
      setReportText('');
      setDailyCount(prev => prev + 1);
      setTimeout(() => { setSuccess(false); handleClose(); }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const remaining = MAX_DAILY - dailyCount;
  const limitReached = remaining <= 0;
  const charCount = reportText.length;
  const nearLimit = charCount >= MAX_LEN * 0.9;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#0d0d0d] shadow-2xl overflow-hidden">
        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                <LuBug className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white leading-tight">Report a Bug</h3>
                <p className="text-xs text-gray-500 mt-0.5">Help us improve CF Upsolve</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-colors"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                <LuCircleCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold text-base mb-1">Report submitted!</p>
              <p className="text-gray-400 text-sm">Thanks for helping make CF Upsolve better.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Daily quota */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border border-white/6">
                <LuInfo className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <p className="text-xs text-gray-400">
                  {loading ? (
                    <span className="text-gray-500">Checking quota…</span>
                  ) : limitReached ? (
                    <span className="text-red-400">Daily limit reached — {MAX_DAILY} reports per day.</span>
                  ) : (
                    <>
                      <span className="text-violet-400 font-medium">{remaining}</span>
                      <span> report{remaining !== 1 ? 's' : ''} remaining today</span>
                    </>
                  )}
                </p>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={reportText}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_LEN) setReportText(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Describe what went wrong, steps to reproduce, and what you expected to happen…"
                  rows={5}
                  disabled={limitReached}
                  className="w-full px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/6 transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs tabular-nums ${nearLimit ? 'text-amber-400' : 'text-gray-600'}`}>
                    {charCount}/{MAX_LEN}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <LuTriangleAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/8 hover:text-gray-200 border border-white/6 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || limitReached}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <LuSend className="w-3.5 h-3.5" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
