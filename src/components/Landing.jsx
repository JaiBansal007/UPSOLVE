import Orb from './Orb';
import { LuCode, LuZap, LuUsers, LuTag, LuShieldCheck, LuArrowRight, LuTrendingUp, LuEye } from 'react-icons/lu';

const features = [
  {
    icon: <LuCode size={20} />,
    title: 'Problem Tracker',
    description: 'Build your personal problem list, mark solved, filter by rating, and organize with tags.',
    accent: '#a78bfa',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.18)',
    requiresVerification: true,
  },
  {
    icon: <LuZap size={20} />,
    title: 'Smart Upsolving',
    description: 'Get personalized recommendations from recent Div 1–4 contests. Focus on the right next problem.',
    accent: '#fbbf24',
    bg: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.18)',
    requiresVerification: true,
  },
  {
    icon: <LuUsers size={20} />,
    title: 'User Comparison',
    description: 'Compare any two CF users and find problems one has solved that the other hasn\'t.',
    accent: '#34d399',
    bg: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.18)',
    requiresVerification: false,
  },
  {
    icon: <LuTag size={20} />,
    title: 'Tag & Filter',
    description: 'Add custom tags, filter by difficulty range, and toggle tag visibility for spoiler-free practice.',
    accent: '#60a5fa',
    bg: 'rgba(96,165,250,0.07)',
    border: 'rgba(96,165,250,0.18)',
    requiresVerification: true,
  },
  {
    icon: <LuTrendingUp size={20} />,
    title: 'Progress Tracking',
    description: 'See how many problems you\'ve solved vs. pending at a glance with live stats.',
    accent: '#f472b6',
    bg: 'rgba(244,114,182,0.07)',
    border: 'rgba(244,114,182,0.18)',
    requiresVerification: true,
  },
  {
    icon: <LuShieldCheck size={20} />,
    title: 'CF Verification',
    description: 'Verify your Codeforces handle ownership securely — your data stays private.',
    accent: '#6ee7b7',
    bg: 'rgba(110,231,183,0.07)',
    border: 'rgba(110,231,183,0.18)',
    requiresVerification: false,
  },
];

const steps = [
  {
    num: '01',
    title: 'Sign In & Verify',
    desc: 'Sign in with Google and verify your CF handle by submitting a compile-error solution.',
    accent: '#a78bfa',
  },
  {
    num: '02',
    title: 'Add Problems',
    desc: 'Add problems manually or let the upsolve engine recommend your next challenge automatically.',
    accent: '#fbbf24',
  },
  {
    num: '03',
    title: 'Track & Improve',
    desc: 'Mark problems solved, filter and compare, and systematically level up your rating.',
    accent: '#34d399',
  },
];

export default function Landing({ onNavigate, isVerified, stats = {} }) {
  const { onlineCount = 0, totalVisits = 0, registeredUsers = 0 } = stats;

  return (
    <div className="space-y-20">

      {/* ── Hero ─────────────────────────────────── */}
      <div className="relative text-center py-20 px-6 rounded-3xl overflow-hidden border border-white/[0.06]"
        style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #0d0b14 60%, #0a0f0a 100%)' }}>

        {/* Orb */}
        <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-auto">
          <div className="w-[600px] h-[600px]">
            <Orb hue={260} hoverIntensity={0.3} rotateOnHover backgroundColor="#000000" />
          </div>
        </div>

        {/* Glow accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-24 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 pointer-events-none">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Codeforces Productivity Suite
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold mb-5 leading-tight tracking-tight">
            <span className="text-white">CF </span>
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Upsolve
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Track problems, get smart contest recommendations, and systematically
            climb the Codeforces ladder.
          </p>

          <div className="flex justify-center gap-3 flex-wrap pointer-events-auto">
            {isVerified ? (
              <>
                <button
                  onClick={() => onNavigate('problems')}
                  className="group flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}
                >
                  My Problems
                  <LuArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('upsolve')}
                  className="group flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)', boxShadow: '0 0 20px rgba(29,78,216,0.3)' }}
                >
                  Start Upsolving
                  <LuArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('profile')}
                className="group flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
              >
                Get Started
                <LuArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
            <button
              onClick={() => onNavigate('compare')}
              className="px-7 py-3 rounded-xl font-semibold text-sm text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              Compare Users
            </button>
          </div>
        </div>

        {/* Live stats bar */}
        <div className="relative z-10 mt-12 flex justify-center gap-3 flex-wrap pointer-events-auto">
          {/* Online now */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-emerald-900/40 bg-emerald-950/30 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-emerald-300 tabular-nums">{onlineCount}</span>
            <span className="text-emerald-600 text-xs">online now</span>
          </div>
          {/* Registered users */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/[0.07] bg-white/[0.04] text-sm">
            <LuUsers size={13} className="text-gray-500 shrink-0" />
            <span className="font-semibold text-white tabular-nums">{registeredUsers.toLocaleString()}</span>
            <span className="text-gray-500 text-xs">users</span>
          </div>
          {/* Total visits */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/[0.07] bg-white/[0.04] text-sm">
            <LuEye size={13} className="text-gray-500 shrink-0" />
            <span className="font-semibold text-white tabular-nums">{totalVisits.toLocaleString()}</span>
            <span className="text-gray-500 text-xs">visits</span>
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────── */}
      <div>
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">What you get</p>
          <h2 className="text-4xl font-bold text-white">Everything you need to improve</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl border transition-all duration-200 hover:scale-[1.02]"
              style={{ background: f.bg, borderColor: f.border }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ background: `${f.accent}18`, color: f.accent }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                {f.requiresVerification && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                    style={{ background: `${f.accent}15`, color: f.accent }}>
                    verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ─────────────────────────── */}
      <div className="relative p-10 rounded-3xl border border-white/[0.06]"
        style={{ background: 'linear-gradient(135deg, #0a0a0a, #0d0b14)' }}>
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Simple process</p>
          <h2 className="text-4xl font-bold text-white">Get up and running in minutes</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[calc(33%+16px)] right-[calc(33%+16px)] h-px"
            style={{ background: 'linear-gradient(90deg, #7c3aed44, #fbbf2444, #34d39944)' }} />

          {steps.map((s, i) => (
            <div key={i} className="relative text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5 border"
                style={{ background: `${s.accent}12`, borderColor: `${s.accent}30`, color: s.accent }}>
                {s.num}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────── */}
      {!isVerified && (
        <div className="relative text-center py-16 px-6 rounded-3xl overflow-hidden border border-violet-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.08), rgba(29,78,216,0.08))' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-indigo-600/5 pointer-events-none" />
          <h2 className="text-3xl font-bold text-white mb-3 relative z-10">Ready to level up?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto relative z-10 text-sm">
            Set up your profile, verify your Codeforces handle, and start tracking in under 2 minutes.
          </p>
          <button
            onClick={() => onNavigate('profile')}
            className="relative z-10 group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 0 32px rgba(124,58,237,0.4)' }}
          >
            Set Up Profile
            <LuArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      <div className="text-center pb-4">
        <p className="text-xs text-gray-700">Built for competitive programmers · Data from Codeforces API</p>
      </div>
    </div>
  );
}
