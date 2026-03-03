import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/firebaseStorage';
import { codeforcesAPI } from '../services/codeforcesApi';
import { LuCheck, LuUser, LuCode, LuShieldCheck, LuRefreshCw, LuLogOut, LuExternalLink } from 'react-icons/lu';

export default function Profile({ darkMode, onProfileComplete, cfHandle, setCfHandle, isVerified, setIsVerified }) {
  const { user, login, logout, isGoogleUser } = useAuth();
  const [newHandle, setNewHandle] = useState(cfHandle || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [verificationProblem, setVerificationProblem] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => { setNewHandle(cfHandle || ''); }, [cfHandle]);

  const handleLogin = async () => {
    try { await login(); }
    catch { setError('Failed to sign in. Please try again.'); }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsVerified(false);
      setCfHandle('');
      setNewHandle('');
      setShowVerification(false);
      setVerificationProblem(null);
      setSuccess('Signed out successfully.');
    } catch {
      setError('Failed to sign out. Please try again.');
    }
  };

  const handleSaveHandle = async () => {
    if (!newHandle.trim()) { setError('Please enter a Codeforces handle'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const userInfo = await codeforcesAPI.getUserInfo(newHandle.trim());
      if (!userInfo) throw new Error('Handle not found on Codeforces. Check the spelling.');
      await storage.saveSettings({ cfHandle: newHandle.trim() });
      setCfHandle(newHandle.trim());
      setSuccess(`Handle "${newHandle.trim()}" saved!`);
      setIsVerified(false);
      localStorage.removeItem(`cf_verified_${newHandle.trim()}`);
      setShowVerification(true);
      generateVerificationProblem();
    } catch (err) {
      setError(err.message || 'Failed to save handle');
    } finally { setSaving(false); }
  };

  const generateVerificationProblem = async () => {
    try {
      const problems = await codeforcesAPI.fetchAllProblems();
      const easy = problems.filter(p => p.rating >= 800 && p.rating <= 1200);
      setVerificationProblem(easy[Math.floor(Math.random() * easy.length)]);
    } catch { setError('Failed to generate verification problem. Please try again.'); }
  };

  const handleVerify = async () => {
    if (!verificationProblem || !cfHandle) return;
    setVerifying(true); setError('');
    try {
      const res = await fetch(`https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=10`);
      const data = await res.json();
      if (data.status !== 'OK') throw new Error('Failed to fetch submissions');
      const found = data.result.find(sub =>
        sub.problem.contestId === verificationProblem.contestId &&
        sub.problem.index === verificationProblem.index &&
        sub.verdict === 'COMPILATION_ERROR' &&
        (Date.now() / 1000 - sub.creationTimeSeconds) < 1800
      );
      if (found) {
        await storage.saveVerification(cfHandle);
        setIsVerified(true);
        setShowVerification(false);
        setSuccess('Handle verified! You now have full access.');
        if (onProfileComplete) onProfileComplete();
      } else {
        setError('Not found. Make sure you submitted a Compilation Error to the correct problem within the last 30 minutes.');
      }
    } catch (err) { setError(err.message || 'Verification failed. Please try again.'); }
    finally { setVerifying(false); }
  };

  const step1Done = isGoogleUser();
  const step2Done = !!cfHandle;
  const step3Done = isVerified;
  const allDone = step1Done && step2Done && step3Done;

  const steps = [
    { n: 1, label: 'Sign in', done: step1Done },
    { n: 2, label: 'CF Handle', done: step2Done },
    { n: 3, label: 'Verify', done: step3Done },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Profile Setup</h1>
        <p className="text-gray-500 text-sm">Complete all three steps to unlock the full experience.</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s.done
                  ? 'bg-green-500 text-white'
                  : 'bg-[#1a1a1a] border border-gray-700 text-gray-500'
              }`}>
                {s.done ? <LuCheck size={14} /> : s.n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${s.done ? 'text-green-400' : 'text-gray-600'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-gray-800">
                <div className={`h-full bg-green-500 transition-all duration-500 ${s.done ? 'w-full' : 'w-0'}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/50 border border-red-900/60 text-red-400 text-sm">
          <span className="mt-0.5 shrink-0">✕</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-400 shrink-0">✕</button>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-950/50 border border-green-900/60 text-green-400 text-sm">
          <LuCheck size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-700 hover:text-green-400 shrink-0">✕</button>
        </div>
      )}

      {/* Step 1 — Google Sign In */}
      <div className={`rounded-2xl border p-6 transition-all ${
        step1Done ? 'border-green-900/50 bg-[#0a0f0a]' : 'border-gray-800 bg-[#0d0d0d]'
      }`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2 rounded-xl ${step1Done ? 'bg-green-950 text-green-400' : 'bg-gray-900 text-gray-500'}`}>
            <LuUser size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Sign in with Google</h2>
            <p className="text-xs text-gray-600">Required to save your data securely</p>
          </div>
          {step1Done && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-950/60 border border-green-900/50 px-2.5 py-1 rounded-full">
              <LuCheck size={11} /> Connected
            </span>
          )}
        </div>

        {step1Done ? (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-black/40 border border-gray-800">
            {user.photoURL && (
              <img src={user.photoURL} alt="avatar" className="w-10 h-10 rounded-full ring-2 ring-green-900/60" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 hover:bg-red-950/40 px-3 py-1.5 rounded-lg border border-gray-800 hover:border-red-900/50 transition-all"
            >
              <LuLogOut size={12} /> Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg shadow-black/30"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        )}
      </div>

      {/* Step 2 — CF Handle */}
      <div className={`rounded-2xl border p-6 transition-all ${
        !step1Done ? 'opacity-40 pointer-events-none' : step2Done ? 'border-green-900/50 bg-[#0a0f0a]' : 'border-gray-800 bg-[#0d0d0d]'
      }`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2 rounded-xl ${step2Done ? 'bg-green-950 text-green-400' : 'bg-gray-900 text-gray-500'}`}>
            <LuCode size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Codeforces Handle</h2>
            <p className="text-xs text-gray-600">Your Codeforces username</p>
          </div>
          {step2Done && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-950/60 border border-green-900/50 px-2.5 py-1 rounded-full">
              <LuCheck size={11} /> Saved
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm font-mono">@</span>
            <input
              type="text"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveHandle()}
              placeholder="YourCFHandle"
              className="w-full pl-7 pr-3 py-2.5 bg-black border border-gray-800 text-white rounded-xl text-sm placeholder-gray-700 focus:outline-none focus:border-gray-600 transition-colors font-mono"
            />
          </div>
          <button
            onClick={handleSaveHandle}
            disabled={saving || !newHandle.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-violet-700 hover:bg-violet-600 text-white"
          >
            {saving ? 'Checking…' : 'Save'}
          </button>
        </div>

        {cfHandle && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-gray-600">Current:</span>
            <a
              href={`https://codeforces.com/profile/${cfHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              {cfHandle} <LuExternalLink size={11} />
            </a>
            {isVerified && (
              <span className="ml-1 flex items-center gap-1 text-xs text-green-400 bg-green-950/60 border border-green-900/50 px-2 py-0.5 rounded-full">
                <LuCheck size={10} /> Verified
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 3 — Verification */}
      <div className={`rounded-2xl border p-6 transition-all ${
        !step2Done || !step1Done ? 'opacity-40 pointer-events-none' : step3Done ? 'border-green-900/50 bg-[#0a0f0a]' : 'border-gray-800 bg-[#0d0d0d]'
      }`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2 rounded-xl ${step3Done ? 'bg-green-950 text-green-400' : 'bg-gray-900 text-gray-500'}`}>
            <LuShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Verify Ownership</h2>
            <p className="text-xs text-gray-600">Prove you own this CF account</p>
          </div>
          {step3Done && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-950/60 border border-green-900/50 px-2.5 py-1 rounded-full">
              <LuCheck size={11} /> Verified
            </span>
          )}
        </div>

        {step3Done ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-950/20 border border-green-900/40">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <LuShieldCheck size={20} />
            </div>
            <div>
              <p className="font-semibold text-green-300">Handle Verified</p>
              <p className="text-sm text-green-600/80">Full access to all features is now unlocked.</p>
            </div>
          </div>
        ) : showVerification && verificationProblem ? (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-3">
              <p className="text-sm font-semibold text-gray-300">How to verify:</p>
              <ol className="space-y-2">
                {[
                  <>Open this problem on Codeforces:&nbsp;
                    <a
                      href={`https://codeforces.com/problemset/problem/${verificationProblem.contestId}/${verificationProblem.index}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 font-mono underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      {verificationProblem.contestId}{verificationProblem.index} – {verificationProblem.name}
                      <LuExternalLink size={11} />
                    </a>
                  </>,
                  <>Submit any code that gives a <span className="text-amber-400 font-semibold">Compilation Error</span> (e.g.&nbsp;<code className="px-1.5 py-0.5 bg-black rounded text-amber-300 text-xs font-mono">int main(){`{`}asdf{`}`}</code>)</>,
                  <>Come back and click <span className="text-green-400 font-semibold">Verify</span> below.</>,
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-400">
                    <span className="w-5 h-5 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white transition-all"
              >
                <LuShieldCheck size={15} />
                {verifying ? 'Checking submissions…' : 'Verify'}
              </button>
              <button
                onClick={generateVerificationProblem}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-200 bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-all"
              >
                <LuRefreshCw size={14} /> New problem
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setShowVerification(true); generateVerificationProblem(); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-700 hover:bg-violet-600 text-white transition-all"
          >
            Start Verification
          </button>
        )}
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="relative p-6 rounded-2xl border border-green-800/40 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.05))' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-800/50 flex items-center justify-center text-green-400 text-2xl shrink-0">
              🎉
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-300">All set, {user?.displayName?.split(' ')[0]}!</h3>
              <p className="text-sm text-green-600/90">Problems, Upsolving, and Compare are all unlocked.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
