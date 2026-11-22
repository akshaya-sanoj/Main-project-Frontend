import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowUpRight,
  Bell,
  Users,
  ClipboardCheck,
  Trash2,
  LogOut,
} from 'lucide-react';
import Photo from '../../components/Photo';
import { API_BASE, authHeaders } from '../../services/api';
import { fetchSosAlerts, resolveSosAlert } from '../../utils/sosAlerts';

const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function VolunteerDashboard() {
  const [activeTab, setActiveTab] = useState('duties');
  const [headUser, setHeadUser] = useState(null);
  const [myFests, setMyFests] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [dutyText, setDutyText] = useState('');
  const [dutyTime, setDutyTime] = useState('');
  const [dutyLocation, setDutyLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);

  const asideRef = useRef(null);
  const navItemRefs = useRef([]);
  const navMarkerRefs = useRef([]);

  useEffect(() => {
    try {
      const saved = JSON.parse((sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user')) || 'null');
      if (saved) setHeadUser(saved);
    } catch {
      // ignore invalid storage
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const headers = authHeaders();
      const [uRes, fRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers }),
        fetch(`${API_BASE}/fests`, { headers }),
      ]);
      const uList = uRes.ok ? await uRes.json() : [];
      const fList = fRes.ok ? await fRes.json() : [];

      const approvedStudents = (Array.isArray(uList) ? uList : [])
        .filter((u) => u.baseType === 'student' && u.approved !== false && !u.rejected)
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      setStudents(approvedStudents);

      if (headUser?.name) {
        const matched = (Array.isArray(fList) ? fList : []).filter(
          (f) =>
            f.volunteerCoord &&
            f.volunteerCoord !== 'Unassigned' &&
            normName(f.volunteerCoord) === normName(headUser.name)
        );
        setMyFests(matched);
      }
    } catch {
      setError('Could not load student list from server.');
    }
  }, [headUser?.name]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, [loadData]);

  const loadAlerts = useCallback(async () => {
    const list = await fetchSosAlerts();
    setAlerts(list);
  }, []);

  useEffect(() => {
    loadAlerts();
    const onUpdate = () => loadAlerts();
    window.addEventListener('focus', onUpdate);
    window.addEventListener('storage', onUpdate);
    window.addEventListener('fest_sos_updated', onUpdate);
    const timer = setInterval(onUpdate, 5000);
    return () => {
      window.removeEventListener('focus', onUpdate);
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('fest_sos_updated', onUpdate);
      clearInterval(timer);
    };
  }, [loadAlerts]);

  const festIds = myFests.map((f) => String(f.id));
  const committeeStudents = students.filter((s) => {
    if (!Boolean(s.volunteerCommittee)) return false;
    if (festIds.length > 0 && Array.isArray(s.volunteerFestIds) && s.volunteerFestIds.length > 0) {
      return s.volunteerFestIds.some((id) => festIds.includes(String(id)));
    }
    return true;
  });
  const assignableStudents = committeeStudents;
  const assignedStudents = committeeStudents.filter((s) => Boolean(s.assignedDuty));
  const pendingAlerts = alerts.filter(
    (alert) => alert.status === 'Pending Response'
  ).length;

  const volunteerNavItems = [
    { id: 'duties', label: 'Assign Duties', icon: ClipboardCheck, badge: assignedStudents.length },
    { id: 'alerts', label: 'Emergency SOS', icon: AlertTriangle, badge: pendingAlerts > 0 ? pendingAlerts : null },
  ];

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const proximityRadius = 100;
    const maxShift = 14;
    const markerBase = 10;
    const markerLength = 24;
    const smoothing = 100;
    const count = volunteerNavItems.length;
    const target = new Array(count).fill(0);
    const current = new Array(count).fill(0);
    let pointerActive = false;
    let raf = 0;
    let last = 0;

    const apply = (i, p) => {
      const item = navItemRefs.current[i];
      const marker = navMarkerRefs.current[i];
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
        const el = navItemRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(e.clientY - (r.top + r.height / 2));
        let p = Math.max(0, 1 - dist / proximityRadius);
        p = p * p * (3 - 2 * p);
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
  }, [volunteerNavItems.length]);

  const handleAssignDuty = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!selectedStudentId) {
      setError('Please choose a student first.');
      return;
    }
    if (!dutyText.trim()) {
      setError('Please enter a duty / task (e.g. Stage help).');
      return;
    }

    const target = assignableStudents.find((s) => String(s.id) === String(selectedStudentId));
    if (!target) {
      setError('Selected student is not in the contributed volunteer list.');
      return;
    }

    setBusy(true);
    try {
      const festLabel = myFests.map((f) => f.name).join(', ');
      const formattedDuty = festLabel ? `${dutyText.trim()} (${festLabel})` : dutyText.trim();

      const res = await fetch(`${API_BASE}/users/${target.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          assignedDuty: formattedDuty,
          dutyTime: dutyTime.trim(),
          dutyLocation: dutyLocation.trim() || target.volunteerNote || 'Volunteer Committee',
          dutyAssignedBy: headUser?.name || 'Volunteer Head',
        }),
      });
      if (!res.ok) throw new Error('Could not assign duty. Please try again.');

      await loadData();
      setNotice(`Assigned "${formattedDuty}" to ${target.name}.`);
      setSelectedStudentId('');
      setDutyText('');
      setDutyTime('');
      setDutyLocation('');
    } catch (err) {
      setError(err.message || 'Could not save duty.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveDuty = async (student) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/users/${student.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          assignedDuty: '',
          dutyTime: '',
          dutyLocation: '',
          dutyAssignedBy: '',
        }),
      });
      if (!res.ok) throw new Error('Could not remove duty.');
      await loadData();
      setNotice(`Removed duty from ${student.name}.`);
    } catch (err) {
      setError(err.message || 'Could not remove duty.');
    } finally {
      setBusy(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    await resolveSosAlert(alertId);
    await loadAlerts();
  };

  const clearSession = () => {
    sessionStorage.removeItem('fest_user');
    localStorage.removeItem('fest_user');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8F8] text-slate-800 md:flex-row font-['DM_Sans',sans-serif]">
      {/* Desktop Sidebar */}
      <aside
        ref={asideRef}
        style={{ backgroundColor: '#072C31' }}
        className="hidden w-72 shrink-0 flex-col justify-between bg-[#072C31] p-6 text-white md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto"
      >
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Shield size={21} />
            </div>
            <div>
              <h2 className="fest-display text-lg font-extrabold">CampusFest</h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F5A623]">
                Volunteers Dashboard
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="truncate text-xs font-semibold text-white">
              {headUser?.name || 'Volunteer Head'}
            </p>
            <p className="mt-1 truncate text-[10px] text-[#F5A623]">
              {myFests.length > 0
                ? `Volunteer Head · ${myFests.map((f) => f.name).join(', ')}`
                : 'Volunteer Committee Head'}
            </p>
          </div>

          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[2px] text-white/50">
            Navigation
          </p>

          <nav aria-label="Volunteer Navigation" className="space-y-1">
            {volunteerNavItems.map((item, i) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => { navItemRefs.current[i] = el; }}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623] ${
                    active ? 'bg-white/5 font-bold text-[#F5A623]' : 'font-medium text-white/75 hover:text-white'
                  }`}
                  style={{ willChange: 'transform' }}
                >
                  <span
                    ref={(el) => { navMarkerRefs.current[i] = el; }}
                    aria-hidden="true"
                    className={`block h-px shrink-0 ${active ? 'bg-[#F5A623]' : 'bg-white/40 group-hover:bg-white/70'}`}
                    style={{ width: active ? 24 : 10 }}
                  />
                  <span aria-hidden="true" className="w-5 shrink-0 font-mono text-[11px] tabular-nums opacity-70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        active ? 'bg-[#F5A623] text-[#2A1A00]' : 'bg-white/15 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {headUser?.id && (
              <Link
                to={`/teacher/${headUser.id}`}
                className="mt-2 flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-white/75 transition-colors hover:text-white"
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>My Teacher Portal</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-5">
          <Link
            to="/login"
            onClick={clearSession}
            className="flex items-center gap-2 text-sm font-semibold text-[#F5A623] transition hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div style={{ backgroundColor: '#072C31' }} className="w-full bg-[#072C31] text-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623] text-[#2A1A00]">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-extrabold">CampusFest</span>
          </div>
          <Link
            to="/login"
            onClick={clearSession}
            className="text-xs font-semibold text-[#F5A623]"
          >
            Sign Out
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {volunteerNavItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? 'bg-[#F5A623] text-[#2A1A00]' : 'bg-white/10 text-white/80'
                }`}
              >
                {item.badge !== null && item.badge !== undefined ? `${item.label} (${item.badge})` : item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-9">
        <header className="relative mb-8 overflow-hidden rounded-2xl bg-[#072C31] text-white shadow-sm">
          <Photo
            src="/banner.png"
            alt=""
            eager
            className="absolute inset-0 h-full w-full"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#072C31] via-[#072C31]/80 to-[#072C31]/20"
          />
          <div className="relative z-10 flex flex-col justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
                <span className="h-2 w-2 rounded-full bg-[#F5A623]" />
                {myFests.length > 0 ? myFests.map((f) => f.name).join(' · ') : 'Volunteer Committee'}
              </div>
              <h1 className="fest-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Volunteers Dashboard
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/75">
                Assign volunteer duties to students contributed by departments and coordinate venue support.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              {headUser?.id && (
                <Link
                  to={`/teacher/${headUser.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Teacher Dashboard
                </Link>
              )}
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Back to Home
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </header>

        {notice && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {notice}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Committee Volunteers</p>
                <h2 className="fest-display mt-2 text-3xl font-extrabold text-[#072C31]">
                  {committeeStudents.length}
                </h2>
              </div>
              <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#072C31]">
                <Users size={22} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Contributed by department coordinators
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Duties Assigned</p>
                <h2 className="fest-display mt-2 text-3xl font-extrabold text-emerald-600">{assignedStudents.length}</h2>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <ClipboardCheck size={22} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Students with active volunteer duties</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending SOS Alerts</p>
                <h2 className="fest-display mt-2 text-3xl font-extrabold text-[#D6336C]">{pendingAlerts}</h2>
              </div>
              <div className="rounded-xl bg-[#FCE7EF] p-3 text-[#D6336C]">
                <Bell size={22} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Emergency alerts awaiting response</p>
          </div>
        </section>

        {activeTab === 'duties' && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="fest-display text-lg font-bold text-[#072C31]">Assign Duty to a Volunteer</h3>
              <p className="mt-1 text-xs text-slate-500">
                Showing only students contributed to the Volunteer Committee by department coordinators.
              </p>

              <form onSubmit={handleAssignDuty} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="volStudent" className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Choose Student
                  </label>
                  <select
                    id="volStudent"
                    value={selectedStudentId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setSelectedStudentId(sid);
                      const chosen = assignableStudents.find((s) => String(s.id) === String(sid));
                      if (chosen?.volunteerNote && !dutyLocation) {
                        setDutyLocation(chosen.volunteerNote);
                      }
                    }}
                    disabled={assignableStudents.length === 0}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#072C31] focus:ring-2 focus:ring-[#072C31]/10 disabled:opacity-60"
                  >
                    <option value="">
                      {assignableStudents.length > 0
                        ? '-- Select a contributed volunteer --'
                        : '-- No students contributed by departments yet --'}
                    </option>
                    {assignableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.department ? `(${s.department})` : ''} {s.registerNo ? `· ${s.registerNo}` : ''} {s.volunteerNote ? `— ${s.volunteerNote}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="volDuty" className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Task / Duty
                  </label>
                  <input
                    id="volDuty"
                    type="text"
                    placeholder="e.g. Stage help"
                    value={dutyText}
                    onChange={(e) => setDutyText(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#072C31] focus:ring-2 focus:ring-[#072C31]/10"
                  />
                </div>

                <div>
                  <label htmlFor="volTime" className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Scheduled Time
                  </label>
                  <input
                    id="volTime"
                    type="text"
                    placeholder="e.g. 9:30 AM – 1:00 PM"
                    value={dutyTime}
                    onChange={(e) => setDutyTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#072C31] focus:ring-2 focus:ring-[#072C31]/10"
                  />
                </div>

                <div>
                  <label htmlFor="volLocation" className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Committee / Location
                  </label>
                  <input
                    id="volLocation"
                    type="text"
                    placeholder="e.g. Main Stage / Registration Desk"
                    value={dutyLocation}
                    onChange={(e) => setDutyLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#072C31] focus:ring-2 focus:ring-[#072C31]/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={busy || assignableStudents.length === 0}
                    className="rounded-xl bg-[#072C31] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0D3D44] disabled:opacity-50"
                  >
                    {busy ? 'Saving...' : 'Assign Duty'}
                  </button>
                </div>
              </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
                <div>
                  <h3 className="fest-display text-lg font-bold text-[#072C31]">Assigned Student Volunteers</h3>
                  <p className="mt-1 text-xs text-slate-500">Students currently assigned a volunteer duty.</p>
                </div>
                <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#072C31]">
                  {assignedStudents.length} assigned
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="p-4">Student</th>
                      <th className="p-4">Department / Class</th>
                      <th className="p-4">Task</th>
                      <th className="p-4">Scheduled Time</th>
                      <th className="p-4">Committee / Location</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignedStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[#F5F8F8]">
                        <td className="p-4">
                          <div className="font-semibold text-[#072C31]">{s.name}</div>
                          {s.registerNo && <div className="font-mono text-[11px] text-slate-500">{s.registerNo}</div>}
                        </td>
                        <td className="p-4 text-xs text-slate-600">
                          {s.department || '—'}{s.classSection ? ` · ${s.classSection}` : ''}
                        </td>
                        <td className="p-4">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                            {s.assignedDuty}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-600">{s.dutyTime || '—'}</td>
                        <td className="p-4 text-xs text-slate-600">{s.dutyLocation || 'Volunteer Committee'}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveDuty(s)}
                            aria-label={`Remove duty from ${s.name}`}
                            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assignedStudents.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-10 text-center text-xs text-slate-500">
                          No volunteer duties assigned yet. Choose a volunteer above to assign one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'alerts' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#FCE7EF] p-2.5 text-[#D6336C]">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="fest-display text-lg font-bold text-[#072C31]">Active Emergency SOS Queue</h3>
                  <p className="mt-1 text-xs text-slate-500">Review and respond to reported emergencies</p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#FCE7EF] px-3 py-2 text-xs font-bold text-[#D6336C]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#D6336C]" />
                {pendingAlerts} Pending
              </span>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex flex-col gap-5 rounded-xl border p-5 transition lg:flex-row lg:items-center lg:justify-between ${
                    alert.status === 'Resolved & Attended'
                      ? 'border-emerald-100 bg-emerald-50/50'
                      : 'border-[#F5D6E1] bg-[#FFF9FA]'
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        alert.status === 'Resolved & Attended'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-[#FCE7EF] text-[#D6336C]'
                      }`}
                    >
                      {alert.status === 'Resolved & Attended' ? <CheckCircle2 size={22} /> : <PhoneCall size={22} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 sm:text-base">{alert.sender}</h4>
                        {alert.status === 'Pending Response' && (
                          <span className="rounded-full bg-[#FCE7EF] px-2 py-1 text-[10px] font-bold text-[#D6336C]">
                            SOS ALERT
                          </span>
                        )}
                      </div>

                      {alert.matter && (
                        <p className="mt-1.5 text-sm font-semibold text-[#D6336C]">
                          Matter: <span className="text-slate-800">{alert.matter}</span>
                        </p>
                      )}

                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin size={13} className="shrink-0 text-[#D99416]" />
                        <span>
                          Come to: <strong className="text-[#072C31]">{alert.location}</strong>
                        </span>
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={13} />
                        Reported at {alert.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <span
                      className={`rounded-full px-3 py-2 text-xs font-bold ${
                        alert.status === 'Resolved & Attended'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-[#FCE7EF] text-[#D6336C]'
                      }`}
                    >
                      {alert.status}
                    </span>
                    {alert.status !== 'Resolved & Attended' && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#072C31] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0D3D44]"
                      >
                        <CheckCircle2 size={15} />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="py-10 text-center text-xs text-slate-500">
                  No emergency SOS alerts reported yet.
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 pb-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} CampusFest Volunteer Support Dashboard
        </footer>
      </main>
    </div>
  );
}