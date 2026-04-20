import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { LuLock, LuCode, LuUser, LuZap, LuLogOut } from 'react-icons/lu';

const CardNav = ({
  ease = 'power3.out',
  onNavigate,
  currentPage,
  isVerified,
  cfHandle,
  onlineCount = 0,
  onSignOut,
  isLoggedIn = false,
  cfApiStatus = 'checking',
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 300;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const prev = {
          vis: contentEl.style.visibility,
          pe: contentEl.style.pointerEvents,
          pos: contentEl.style.position,
          h: contentEl.style.height,
        };
        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';
        contentEl.offsetHeight;
        const height = 64 + contentEl.scrollHeight + 16;
        contentEl.style.visibility = prev.vis;
        contentEl.style.pointerEvents = prev.pe;
        contentEl.style.position = prev.pos;
        contentEl.style.height = prev.h;
        return height;
      }
    }
    return 300;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 64, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 40, opacity: 0, scale: 0.97 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.42, ease });
    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, scale: 1, duration: 0.38, ease, stagger: 0.07 },
      '-=0.18'
    );
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); tlRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      tlRef.current.kill();
      const newTl = createTimeline();
      if (!newTl) return;
      if (isExpanded) newTl.progress(1);
      tlRef.current = newTl;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const handleNavClick = (page) => {
    if (onNavigate) onNavigate(page);
    if (isExpanded) {
      setIsHamburgerOpen(false);
      tlRef.current?.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tlRef.current?.reverse();
    }
  };

  const setCardRef = (i) => (el) => { if (el) cardsRef.current[i] = el; };

  const isActive = (...pages) => pages.includes(currentPage);

  const navItems = [
    {
      label: 'Navigate',
      icon: <LuCode size={13} />,
      bgColor: '#0d0d0d',
      accentColor: '#6b7280',
      gradientFrom: '#0d0d0d',
      gradientTo: '#111',
      borderColor: '#1f1f1f',
      links: [
        { label: 'Home', page: 'home' },
        { label: 'Compare', page: 'compare' },
        { label: 'Profile', page: 'profile' },
      ],
    },
    {
      label: 'Track',
      icon: <LuZap size={13} />,
      bgColor: '#0e0b1a',
      accentColor: '#a78bfa',
      gradientFrom: '#0e0b1a',
      gradientTo: '#130f22',
      borderColor: '#2d1f5e55',
      links: [
        { label: 'My Problems', page: isVerified ? 'problems'    : 'profile', locked: !isVerified },
        { label: 'Upsolve',     page: isVerified ? 'upsolve'     : 'profile', locked: !isVerified },
        { label: 'Rating Grind',page: isVerified ? 'rating-grind': 'profile', locked: !isVerified },
        { label: '100 Hard 🔥', page: isVerified ? '100-hard'    : 'profile', locked: !isVerified },
        { label: 'Analysis 📊', page: isVerified ? 'analysis'    : 'profile', locked: !isVerified },
      ],
    },
  ];


  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-[820px] z-[99] top-4 md:top-5">
      <nav
        ref={navRef}
        className={`block h-[64px] rounded-2xl relative overflow-hidden will-change-[height] border transition-colors duration-300 ${
          isExpanded ? 'border-white/10' : 'border-white/[0.07]'
        }`}
        style={{
          backgroundColor: '#080808',
          boxShadow: isExpanded
            ? '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 h-[64px] flex items-center justify-between px-3 z-[2]">
          {/* Hamburger */}
          <button
            className="group flex flex-col items-center justify-center gap-[5px] cursor-pointer w-10 h-10 rounded-xl hover:bg-white/5 transition-colors duration-200 shrink-0"
            onClick={toggleMenu}
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          >
            <span
              className={`block w-[18px] h-[1.5px] bg-gray-400 transition-all duration-300 ease-in-out ${
                isHamburgerOpen ? 'translate-y-[3.5px] rotate-45' : ''
              } group-hover:bg-gray-200`}
            />
            <span
              className={`block w-[18px] h-[1.5px] bg-gray-400 transition-all duration-300 ease-in-out ${
                isHamburgerOpen ? '-translate-y-[3.5px] -rotate-45' : ''
              } group-hover:bg-gray-200`}
            />
          </button>

          {/* Logo — centered */}
          <button
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer group"
            onClick={() => handleNavClick('home')}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <LuCode size={14} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-gray-100 group-hover:text-white transition-colors">
              CF Upsolve
            </span>
          </button>

          {/* Right: CF API status + online pill + sign-out + CTA */}
          <div className="flex items-center gap-2">
            {/* CF API status */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              cfApiStatus === 'online'
                ? 'bg-emerald-950/60 border-emerald-900/40'
                : cfApiStatus === 'offline'
                ? 'bg-red-950/60 border-red-900/40'
                : 'bg-yellow-950/60 border-yellow-900/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                cfApiStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : cfApiStatus === 'offline'
                  ? 'bg-red-400'
                  : 'bg-yellow-400 animate-pulse'
              }`} />
              <span className={`text-[11px] font-medium ${
                cfApiStatus === 'online' ? 'text-emerald-400'
                : cfApiStatus === 'offline' ? 'text-red-400'
                : 'text-yellow-400'
              }`}>
                CF API
              </span>
            </div>

            {/* Online count */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-950/60 border border-green-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-medium text-green-400">{onlineCount}</span>
            </div>

            {/* Sign out */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out"
                className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200"
              >
                <LuLogOut size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                background: isVerified
                  ? 'linear-gradient(135deg, #1e1b4b, #2e1065)'
                  : 'linear-gradient(135deg, #111827, #1f2937)',
                color: isVerified ? '#c4b5fd' : '#9ca3af',
                border: isVerified ? '1px solid #4c1d9560' : '1px solid #374151',
                boxShadow: isVerified ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
              }}
            >
              {isVerified ? (
                <>
                  <LuUser size={12} />
                  {cfHandle || 'Profile'}
                </>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </div>

        {/* Expanded cards */}
        <div
          className={`card-nav-content absolute left-0 right-0 top-[64px] bottom-0 p-2 flex flex-col gap-2 z-[1] md:flex-row md:pb-2 ${
            isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          }`}
          aria-hidden={!isExpanded}
        >
          {navItems.map((item, idx) => (
            <div
              key={item.label}
              ref={setCardRef(idx)}
              className="nav-card relative flex flex-col gap-2 p-3 rounded-[14px] flex-1 overflow-hidden border"
              style={{
                background: `linear-gradient(135deg, ${item.gradientFrom}, ${item.gradientTo})`,
                borderColor: item.borderColor,
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-1.5" style={{ color: item.accentColor }}>
                <span className="opacity-70">{item.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {item.label}
                </span>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-[2px] mt-0.5">
                {item.links.map((lnk) => {
                  const active = lnk.page && isActive(lnk.page);
                  return (
                    <button
                      key={lnk.label}
                      onClick={() => {
                        if (lnk.isSignOut) { onSignOut?.(); return; }
                        lnk.page && handleNavClick(lnk.page);
                      }}
                      disabled={lnk.isStatus || lnk.isCfApi}
                      className={`group flex items-center gap-2 text-left rounded-lg px-2 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                        lnk.isStatus
                          ? 'cursor-default opacity-40'
                          : lnk.isCfApi
                          ? 'cursor-default'
                          : active
                          ? 'opacity-100'
                          : 'text-gray-400 opacity-70 hover:opacity-100 hover:bg-white/5'
                      }`}
                      style={active ? { color: item.accentColor } : {}}
                    >
                      {lnk.isStatus ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                          {lnk.label}
                        </>
                      ) : lnk.isCfApi ? (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            lnk.label === 'online' ? 'bg-green-400 animate-pulse' :
                            lnk.label === 'offline' ? 'bg-red-400' :
                            'bg-yellow-400 animate-pulse'
                          }`} />
                          <span className={
                            lnk.label === 'online' ? 'text-green-400' :
                            lnk.label === 'offline' ? 'text-red-400' :
                            'text-yellow-400'
                          }>
                            CF API {lnk.label === 'checking' ? 'checking…' : lnk.label}
                          </span>
                        </>
                      ) : lnk.isSignOut ? (
                        <>
                          <LuLock size={11} className="shrink-0 opacity-60" />
                          <span className="text-red-400/80 group-hover:text-red-400">Sign out</span>
                        </>
                      ) : lnk.locked ? (
                        <>
                          <LuLock size={11} className="shrink-0 opacity-40" />
                          <span className="line-through opacity-50">{lnk.label}</span>
                        </>
                      ) : (
                        <>
                          <GoArrowUpRight
                            size={13}
                            className={`shrink-0 transition-transform duration-150 ${
                              active ? '' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                            }`}
                          />
                          <span>{lnk.label}</span>
                          {active && (
                            <span
                              className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                              style={{
                                background: `${item.accentColor}18`,
                                color: item.accentColor,
                              }}
                            >
                              active
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
