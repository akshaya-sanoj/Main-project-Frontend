import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, LogOut } from 'lucide-react';
import { COORDINATOR_NAV_ITEMS, COORDINATOR_HOME_PATH } from './Coordinatornav';

export default function Coordinatorsidebar({
  activeTab,
  onSelect,
  badges = {},
  showIndex = true,
  showIcons = false,
  proximityRadius = 100,
  maxShift = 14,
  falloff = 'smooth',
  markerBase = 10,
  markerLength = 24,
  smoothing = 100,
  coordinator,
  dept,
}) {
  const navigate = useNavigate();
  const asideRef = useRef(null);
  const itemRefs = useRef([]);
  const markerRefs = useRef([]);

  const handleClick = (id) => {
    if (onSelect) {
      onSelect(id);
    } else {
      sessionStorage.setItem('coordinator_tab', id);
      navigate(COORDINATOR_HOME_PATH);
    }
  };

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const count = COORDINATOR_NAV_ITEMS.length;
    const target = new Array(count).fill(0);
    const current = new Array(count).fill(0);
    let pointerActive = false;
    let raf = 0;
    let last = 0;

    const apply = (i, p) => {
      const item = itemRefs.current[i];
      const marker = markerRefs.current[i];
      if (item) item.style.transform = `translateX(${(p * maxShift).toFixed(2)}px)`;
      if (marker) marker.style.width = `${(markerBase + p * (markerLength - markerBase)).toFixed(2)}px`;
    };

    const tick = (now) => {
      const dt = last ? now - last : 16;
      last = now;
      const k = 1 - Math.exp(-dt / Math.max(1, smoothing));
      let moving = false;
      for (let i = 0; i < count; i += 1) {
        current[i] += (target[i] - current[i]) * k;
        if (Math.abs(target[i] - current[i]) < 0.002) current[i] = target[i];
        else moving = true;
        apply(i, current[i]);
      }
      if (moving || pointerActive) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        last = 0;
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      pointerActive = true;
      for (let i = 0; i < count; i += 1) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(e.clientY - (r.top + r.height / 2));
        let p = Math.max(0, 1 - dist / proximityRadius);
        if (falloff === 'smooth') p = p * p * (3 - 2 * p);
        target[i] = p;
      }
      start();
    };

    const onLeave = () => {
      pointerActive = false;
      target.fill(0);
      start();
    };

    aside.addEventListener('pointermove', onMove);
    aside.addEventListener('pointerleave', onLeave);
    return () => {
      aside.removeEventListener('pointermove', onMove);
      aside.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [proximityRadius, maxShift, falloff, markerBase, markerLength, smoothing]);

  const hasBadge = (item) => item.badgeKey && badges[item.badgeKey] !== undefined;
  const labelWithBadge = (item) => (hasBadge(item) ? `${item.label} (${badges[item.badgeKey]})` : item.label);

  const clearSession = () => {
    sessionStorage.removeItem('fest_user');
    localStorage.removeItem('fest_user');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        ref={asideRef}
        className="hidden md:flex w-72 shrink-0 flex-col justify-between bg-[#072C31] p-6 text-white md:sticky md:top-0 md:h-screen md:overflow-y-auto"
      >
        <div>
          <Link to={COORDINATOR_HOME_PATH} className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">CampusFest</h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F5A623]">
                Coordinator Portal
              </p>
            </div>
          </Link>

          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[2px] text-white/50">
            Management
          </p>

          <nav aria-label="Coordinator Navigation" className="space-y-1">
            {COORDINATOR_NAV_ITEMS.map((item, i) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  type="button"
                  onClick={() => handleClick(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                    active ? 'bg-white/5 font-bold text-[#F5A623]' : 'font-medium text-white/75 hover:text-white'
                  }`}
                  style={{ willChange: 'transform' }}
                >
                  <span
                    ref={(el) => { markerRefs.current[i] = el; }}
                    aria-hidden="true"
                    className={`block h-px shrink-0 ${active ? 'bg-[#F5A623]' : 'bg-white/40 group-hover:bg-white/70'}`}
                    style={{ width: active ? markerLength : markerBase }}
                  />
                  {showIndex && (
                    <span aria-hidden="true" className="w-5 shrink-0 font-mono text-[11px] tabular-nums opacity-70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  )}
                  {showIcons && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                  {hasBadge(item) && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        active ? 'bg-[#F5A623] text-[#2A1A00]' : 'bg-white/15 text-white'
                      }`}
                    >
                      {badges[item.badgeKey]}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-white truncate">{coordinator?.name || 'Department Coordinator'}</p>
            <p className="mt-1 text-[10px] text-[#F5A623] truncate">Dept: {dept}</p>
          </div>
          <Link
            to="/login"
            onClick={clearSession}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-[#F5A623] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden bg-[#072C31] text-white w-full">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={COORDINATOR_HOME_PATH} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="font-extrabold">CampusFest</span>
          </Link>
          <Link
            to="/login"
            onClick={clearSession}
            className="text-xs font-semibold text-[#F5A623]"
          >
            Sign Out
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {COORDINATOR_NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? 'bg-[#F5A623] text-[#2A1A00]' : 'bg-white/10 text-white/80'
                }`}
              >
                {labelWithBadge(item)}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}