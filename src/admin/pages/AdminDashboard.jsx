import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Trophy, Plus, Users, Calendar, DollarSign, Award, Trash2, ShieldAlert,
  UserCheck, ClipboardList, Send, Pencil, LogOut, CheckCircle2,
} from 'lucide-react';

/*
 * AdminDashboard (fest committee)
 * Works with json-server on port 3000. db.json needs these lists: users, fests, programs
 * (add "programs": [] if it is missing, then restart the server).
 * Fests and programs are saved on the server, not in this browser, so coordinators on other
 * computers can see them. A coordinator is a user with the dept_coordinator duty, so appointing
 * one updates that person's account and their login picks it up.
 */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
.fest-display { font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif; }
.fest-body { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
`;

const API_BASE = 'http://localhost:3000';

const LANGUAGES = ['Malayalam', 'English', 'Hindi', 'Arabic', 'Urdu', 'Sanskrit', 'Tamil'];

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw new Error(`Cannot reach the server at ${API_BASE}. Is it running?`);
  }
  if (!res.ok) {
    const isList = path.split('/').filter(Boolean).length === 1;
    if (res.status === 404 && isList) {
      throw new Error('The server has no list for this yet. Add "fests" and "programs" to db.json and restart it.');
    }
    throw new Error(res.status === 404 ? 'That item was not found. It may already have been removed.' : 'The server could not save that. Please try again.');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

const fmtDate = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const sameId = (a, b) => String(a) === String(b);
const hasAssignments = (p) => Object.values(p.assignments || {}).some((list) => list.length > 0);
// Staff = approved teachers. (Students, volunteers, judges and the committee are not teachers.)
const isTeacher = (u) => u.baseType === 'teacher' && u.approved !== false && !u.rejected;
const hasDuty = (u, duty) => (u.duties || []).includes(duty) || u.role === duty;
const DUTY_LABELS = {
  dept_coordinator: 'coordinator', class_teacher: 'class teacher', program_teacher: 'program teacher',
  board_incharge: 'board in-charge', volunteer: 'volunteer', judge: 'judge',
};
const dutyNames = (u) => (u.duties || []).map((d) => DUTY_LABELS[d] || d).join(', ');

// ---- Pending approvals: the five roles that can register ----
const PENDING_ROLES = [
  { id: 'all', label: 'All' },
  { id: 'student', label: 'Student' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'class_teacher', label: 'Class Teacher' },
  { id: 'program_teacher', label: 'Teacher' },
  { id: 'dept_coordinator', label: 'Department Coordinator' },
];

// Works out which of the five roles a registration is asking for
const roleKeyOf = (u) => {
  if (hasDuty(u, 'dept_coordinator')) return 'dept_coordinator';
  if (hasDuty(u, 'class_teacher')) return 'class_teacher';
  if (hasDuty(u, 'volunteer') || u.baseType === 'volunteer') return 'volunteer';
  if (u.baseType === 'student') return 'student';
  if (u.baseType === 'teacher') return 'program_teacher';
  return u.role || 'other';
};
const roleLabelOf = (u) =>
  PENDING_ROLES.find((r) => r.id === roleKeyOf(u))?.label || u.role || 'Unknown';

const inputStyle =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';
const cardStyle = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const primaryButton =
  'flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30 disabled:cursor-not-allowed disabled:opacity-60';
const ghostButton =
  'flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0B3F46] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#0B3F46]/10 disabled:cursor-not-allowed disabled:opacity-60';

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const EMPTY_FEST = { name: '', mode: 'College', deadline: '', festDate: '', venue: '', volunteerCoord: '', foodCoord: '', mediaCoord: '' };
const EMPTY_PROGRAM = { id: null, name: '', stage: 'onstage', language: [], kind: 'individual', maxGroupSize: '' };
const EMPTY_COORD = { teacherName: '', department: '' };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('fests');

  const [users, setUsers] = useState([]);
  const [fests, setFests] = useState(null);
  const [programs, setPrograms] = useState([]);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [festForm, setFestForm] = useState(EMPTY_FEST);
  const [programFestId, setProgramFestId] = useState('');
  const [programForm, setProgramForm] = useState(null); // null = closed
  const [coordForm, setCoordForm] = useState(EMPTY_COORD);
  const [roleFilter, setRoleFilter] = useState('all');

  // Load department submissions forwarded to Admin from localStorage
  const [adminSubmissions] = useState(() => {
    const allSubs = [];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('admin_department_submissions_')) {
        try {
          allSubs.push(JSON.parse(localStorage.getItem(key)));
        } catch (e) {
          console.error(e);
        }
      }
    });
    return allSubs;
  });

  const loadAll = useCallback(async () => {
    const [u, f, p] = await Promise.all([request('/users'), request('/fests'), request('/programs')]);
    setUsers(u);
    setFests(f);
    setPrograms(p);
  }, []);

  useEffect(() => {
    loadAll().catch((e) => { setError(e.message); setFests([]); });
  }, [loadAll]);

  // Pick a fest for the Programs tab as soon as there is one
  useEffect(() => {
    if (fests && fests.length > 0 && !fests.some((f) => sameId(f.id, programFestId))) {
      setProgramFestId(String(fests[fests.length - 1].id));
    }
  }, [fests, programFestId]);

  // Runs a save, reloads the data, and shows either a notice or the error.
  const run = async (fn, successMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await loadAll();
      if (successMessage) setNotice(successMessage);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (id) => { setActiveTab(id); setError(''); setNotice(''); };

  // Light check only: json-server has no real login protection.
  if (!localStorage.getItem('fest_user')) return <Navigate to="/login" replace />;

  const staff = users.filter(isTeacher);
  const coordinatorUsers = users.filter((u) => hasDuty(u, 'dept_coordinator') && u.approved !== false && !u.rejected);
  // Every registration waiting for approval: students, volunteers, class teachers, teachers, coordinators
  const pendingUsers = users.filter((u) => u.approved === false && !u.rejected);
  const visiblePending = roleFilter === 'all'
    ? pendingUsers
    : pendingUsers.filter((u) => roleKeyOf(u) === roleFilter);
  const programsOf = (festId) => programs.filter((p) => sameId(p.festId, festId));
  const selectedFest = (fests || []).find((f) => sameId(f.id, programFestId)) || null;
  const festPrograms = selectedFest ? programsOf(selectedFest.id) : [];

  // ---------- Fests ----------
  const handleCreateFest = async (e) => {
    e.preventDefault();
    const f = festForm;
    if (!f.name.trim() || !f.deadline || !f.festDate || !f.venue.trim()) {
      setError('Fill in the fest name, due date, fest date and venue.');
      return;
    }
    if (f.deadline > f.festDate) {
      setError('The data-entry due date must be on or before the fest date.');
      return;
    }
    if (fests.some((x) => x.name.trim().toLowerCase() === f.name.trim().toLowerCase())) {
      setError('A fest with this name already exists.');
      return;
    }
    const ok = await run(
      () => request('/fests', send('POST', {
        name: f.name.trim(),
        mode: f.mode,
        deadline: f.deadline,
        festDate: f.festDate,
        venue: f.venue.trim(),
        volunteerCoord: f.volunteerCoord || 'Unassigned',
        foodCoord: f.foodCoord || 'Unassigned',
        mediaCoord: f.mediaCoord || 'Unassigned',
        published: false,
        createdAt: new Date().toISOString(),
      })),
      'Fest created. Open Programs to add its programs, then publish the list.'
    );
    if (ok) setFestForm(EMPTY_FEST);
  };

  const handleDeleteFest = async (fest) => {
    if (programsOf(fest.id).some(hasAssignments)) {
      setError('Teachers are already assigned to programs in this fest, so it cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete "${fest.name}" with its programs?`)) return;
    await run(async () => {
      await Promise.all(programsOf(fest.id).map((p) => request(`/programs/${p.id}`, { method: 'DELETE' })));
      await request(`/fests/${fest.id}`, { method: 'DELETE' });
    }, 'Fest deleted.');
  };

  const openPrograms = (fest) => {
    setProgramFestId(String(fest.id));
    setProgramForm(null);
    switchTab('programs');
  };

  // ---------- Programs ----------
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    const p = programForm;
    const name = p.name.trim();
    if (name.length < 2) { setError('Enter a program name.'); return; }
    if (festPrograms.some((x) => !sameId(x.id, p.id) && x.name.trim().toLowerCase() === name.toLowerCase())) {
      setError('This fest already has a program with that name.');
      return;
    }
    let size = null;
    if (p.kind === 'group') {
      size = Number(p.maxGroupSize);
      if (!Number.isInteger(size) || size < 2 || size > 30) { setError('Group size must be a whole number from 2 to 30.'); return; }
    }
    const body = { name, stage: p.stage, language: p.language, kind: p.kind, maxGroupSize: size };
    const ok = await run(
      () => (p.id
        ? request(`/programs/${p.id}`, send('PATCH', body))
        : request('/programs', send('POST', { ...body, festId: selectedFest.id, assignments: {} }))),
      p.id ? 'Program updated.' : 'Program added.'
    );
    if (ok) setProgramForm(null);
  };

  const handleDeleteProgram = async (p) => {
    if (hasAssignments(p)) {
      setError('Teachers are already assigned to this program. Ask the coordinators to remove them first.');
      return;
    }
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    await run(() => request(`/programs/${p.id}`, { method: 'DELETE' }), 'Program deleted.');
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish the program list? Department coordinators will be able to see it and assign teachers. You can still add programs afterwards.')) return;
    await run(
      () => request(`/fests/${selectedFest.id}`, send('PATCH', { published: true, publishedAt: new Date().toISOString() })),
      'Program list published. Department coordinators can now assign teachers.'
    );
  };

  // ---------- Coordinators ----------
  const handleAssignCoordinator = async (e) => {
    e.preventDefault();
    const name = coordForm.teacherName.trim();
    const dept = coordForm.department.trim();

    if (!name || !dept) {
      setError('Please provide both the teacher name and department.');
      return;
    }

    const ok = await run(
      () => request('/users', send('POST', {
        name,
        department: dept,
        baseType: 'teacher',
        role: 'dept_coordinator',
        duties: ['dept_coordinator'],
        approved: true,
        staffId: '',
        email: '',
        createdAt: new Date().toISOString(),
      })),
      `${name} added as coordinator for ${dept}. Staff ID and Gmail will appear after their account is registered and approved.`
    );
    if (ok) setCoordForm(EMPTY_COORD);
  };

  const handleRemoveCoordinator = async (u) => {
    if (!window.confirm(`Remove ${u.name} as coordinator for ${u.department}?`)) return;
    await run(() => request(`/users/${u.id}`, { method: 'DELETE' }), `${u.name} is no longer a coordinator.`);
  };

  // ---------- Approvals ----------
  const handleDecide = async (user, approve) => {
    if (!approve && !window.confirm(`Reject the request from ${user.name}?`)) return;

    // Only teachers and coordinators can match a pre-added coordinator entry.
    // Students and volunteers may have no department, so they skip this.
    if (approve && (user.baseType === 'teacher' || hasDuty(user, 'dept_coordinator'))) {
      const existingCoord = users.find(
        (u) =>
          !sameId(u.id, user.id) &&
          hasDuty(u, 'dept_coordinator') &&
          (!u.staffId || !u.email) &&
          ((u.name || '').toLowerCase() === (user.name || '').toLowerCase() ||
            (u.department || '').toLowerCase() === (user.department || '').toLowerCase())
      );

      if (existingCoord) {
        await run(async () => {
          await request(`/users/${existingCoord.id}`, send('PATCH', {
            staffId: user.staffId,
            email: user.email,
            password: user.password,
          }));
          await request(`/users/${user.id}`, { method: 'DELETE' });
        }, `${user.name} approved. Staff ID and Gmail updated in the coordinator list.`);
        return;
      }
    }

    await run(
      () => request(`/users/${user.id}`, send('PATCH', approve ? { approved: true } : { rejected: true })),
      approve ? `${user.name} approved.` : `${user.name} rejected.`
    );
  };

  const navItems = [
    { id: 'fests', label: 'Manage Fests & Committees', icon: Calendar },
    { id: 'programs', label: 'Programs', icon: ClipboardList },
    { id: 'coordinators', label: 'Assign Coordinators', icon: Users },
    { id: 'approvals', label: `Pending Approvals (${pendingUsers.length})`, icon: UserCheck },
    { id: 'submissions', label: `Department Submissions (${adminSubmissions.length})`, icon: Send },
    { id: 'overview', label: 'Funds, Participation & Leaderboards', icon: DollarSign },
  ];

  const titles = {
    fests: 'Manage Fests & Committees',
    programs: 'Programs',
    coordinators: 'Manage Coordinators',
    approvals: 'Pending Approvals',
    submissions: 'Submitted Department Rosters',
    overview: 'Funds, Participation & Leaderboards',
  };

  const subtitles = {
    fests: 'Set up the fest, its dates and venue, and the committee heads.',
    programs: 'List the programs for each fest, then publish the list so coordinators can assign teachers.',
    coordinators: 'Appoint a coordinator for each department or section by entering their details below.',
    approvals: 'Review registrations from students, volunteers, class teachers, teachers and department coordinators.',
    submissions: 'Review participant rosters forwarded by department coordinators.',
    overview: 'A quick look at the fest. Some figures below are sample data.',
  };

  const setF = (key) => (e) => setFestForm((f) => ({ ...f, [key]: e.target.value }));
  const setP = (key) => (e) => setProgramForm((p) => ({ ...p, [key]: e.target.value }));

  const renderProgramGroup = (title, stage) => {
    const items = festPrograms.filter((p) => p.stage === stage);
    return (
      <section className={`${cardStyle} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h3 className="fest-display font-bold text-[#0B3F46]">
            {title} <span className="ml-1 text-sm font-medium text-slate-500">({items.length})</span>
          </h3>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500 sm:px-6">No {title.toLowerCase()} programs yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((p) => {
              const count = Object.values(p.assignments || {}).reduce((n, list) => n + list.length, 0);
              const langList = Array.isArray(p.language) ? p.language : (typeof p.language === 'string' && p.language !== 'Not applicable' ? [p.language] : []);
              return (
                <li key={p.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B3F46]">{p.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {langList.length > 0 && (
                        <>
                          {langList.join(', ')}
                          {' · '}
                        </>
                      )}
                      {p.kind === 'group' ? `Group, up to ${p.maxGroupSize}` : 'Individual'}
                      {count > 0 && ` · ${count} teacher${count === 1 ? '' : 's'} assigned`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setError('');
                        setProgramForm({
                          ...p,
                          maxGroupSize: p.maxGroupSize || '',
                          language: Array.isArray(p.language) ? p.language : (p.language && p.language !== 'Not applicable' ? [p.language] : []),
                        });
                      }}
                      aria-label={`Edit ${p.name}`}
                      className={ghostButton}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteProgram(p)}
                      aria-label={`Delete ${p.name}`}
                      className={ghostButton}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="fest-body flex min-h-screen bg-[#F5F8F8] text-slate-800">
      <style>{FONT_CSS}</style>

      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#072C31] p-6 text-white md:flex">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="fest-display text-lg font-extrabold">CampusFest</h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F5A623]">Super Admin Portal</p>
            </div>
          </div>

          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-white/40">Administration</p>

          <nav className="space-y-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#F5A623] ${
                  activeTab === id
                    ? 'border border-[#F5A623]/30 bg-[#F5A623] text-[#2A1A00] shadow-lg shadow-black/10'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-5">
          <div className="mb-5 rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">Fest Committee</p>
            <p className="mt-1 text-[10px] text-white/50">Super Administrator</p>
          </div>
          <Link
            to="/login"
            onClick={() => localStorage.removeItem('fest_user')}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-[#F5A623] transition hover:bg-rose-500/20 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D6336C]">
              <span className="h-2 w-2 rounded-full bg-[#D6336C]" />
              CampusFest Administration
            </div>
            <h1 className="fest-display text-2xl font-extrabold tracking-tight text-[#0B3F46] sm:text-3xl">{titles[activeTab]}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitles[activeTab]}</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B3F46] transition hover:border-[#F5A623] hover:bg-[#FFF8E9]"
            >
              ← Back to Home
            </Link>
            <Link
              to="/login"
              onClick={() => localStorage.removeItem('fest_user')}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 md:hidden"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Link>
          </div>
        </header>

        {/* Mobile navigation */}
        <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-5 md:hidden">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-[11px] font-semibold transition ${
                activeTab === id ? 'bg-[#0B3F46] text-white' : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        {notice && (
          <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>
        )}
        {error && (
          <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        )}
        {fests === null && !error && <p className="mb-6 text-sm text-slate-600">Loading...</p>}

        {/* FESTS & COMMITTEES */}
        {activeTab === 'fests' && fests && (
          <div className="space-y-8">
            <section className={`${cardStyle} p-6 sm:p-8`}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]"><Plus className="h-5 w-5" /></div>
                <div>
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Create a New Fest</h2>
                  <p className="mt-1 text-xs text-slate-500">You will add its programs on the Programs tab.</p>
                </div>
              </div>

              <form onSubmit={handleCreateFest} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field id="festName" label="Fest name">
                  <input id="festName" type="text" placeholder="e.g. Annual Arts Fest 2026" value={festForm.name} onChange={setF('name')} className={inputStyle} />
                </Field>
                <Field id="festMode" label="School or college">
                  <select id="festMode" value={festForm.mode} onChange={setF('mode')} className={inputStyle}>
                    <option value="College">College</option>
                    <option value="School">School</option>
                  </select>
                </Field>
                <Field id="festDeadline" label="Data entry closes">
                  <input id="festDeadline" type="date" value={festForm.deadline} onChange={setF('deadline')} className={inputStyle} />
                </Field>
                <Field id="festDate" label="Fest date">
                  <input id="festDate" type="date" value={festForm.festDate} onChange={setF('festDate')} className={inputStyle} />
                </Field>
                <Field id="festVenue" label="Venue">
                  <input id="festVenue" type="text" placeholder="e.g. Main Auditorium" value={festForm.venue} onChange={setF('venue')} className={inputStyle} />
                </Field>
                <Field id="volHead" label="Volunteer committee head">
                  <input id="volHead" type="text" placeholder="e.g. Dr. Rajesh Kumar" value={festForm.volunteerCoord} onChange={setF('volunteerCoord')} className={inputStyle} />
                </Field>
                <Field id="foodHead" label="Food committee head">
                  <input id="foodHead" type="text" placeholder="e.g. Prof. Priya Nair" value={festForm.foodCoord} onChange={setF('foodCoord')} className={inputStyle} />
                </Field>
                <Field id="mediaHead" label="Media and publicity head">
                  <input id="mediaHead" type="text" placeholder="e.g. Dr. Arun Das" value={festForm.mediaCoord} onChange={setF('mediaCoord')} className={inputStyle} />
                </Field>

                <div className="pt-2 sm:col-span-2 xl:col-span-3">
                  <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
                    <Plus className="h-4 w-4 text-[#F5A623]" />
                    {busy ? 'Saving...' : 'Create Fest'}
                  </button>
                </div>
              </form>
            </section>

            <section className={`${cardStyle} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h3 className="fest-display font-bold text-[#0B3F46]">Fests and Committees</h3>
                  <p className="mt-1 text-xs text-slate-500">Configured fests and their committee heads.</p>
                </div>
                <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
                  {fests.length} {fests.length === 1 ? 'Fest' : 'Fests'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th scope="col" className="p-4">Fest Name</th>
                      <th scope="col" className="p-4">Type</th>
                      <th scope="col" className="p-4">Entry Deadline / Fest Date</th>
                      <th scope="col" className="p-4">Venue</th>
                      <th scope="col" className="p-4">Committee Heads</th>
                      <th scope="col" className="p-4">Programs</th>
                      <th scope="col" className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {fests.map((fest) => (
                      <tr key={fest.id} className="transition hover:bg-[#F5F8F8]">
                        <td className="p-4">
                          <div className="font-semibold text-[#0B3F46]">{fest.name}</div>
                          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${fest.published ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FDEFD3] text-[#5C3B00]'}`}>
                            {fest.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fest.mode === 'College' ? 'bg-[#E6F1F2] text-[#0B3F46]' : 'bg-[#FCE7EF] text-[#D6336C]'}`}>
                            {fest.mode}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-4 text-xs text-slate-600">
                          <div>Due: <span className="font-medium">{fmtDate(fest.deadline)}</span></div>
                          <div className="text-slate-500">Fest: <span>{fmtDate(fest.festDate)}</span></div>
                        </td>
                        <td className="p-4 text-xs text-slate-600">{fest.venue}</td>
                        <td className="p-4 text-xs text-slate-600">
                          <div><span className="font-semibold text-[#0B3F46]">Volunteer:</span> {fest.volunteerCoord}</div>
                          <div><span className="font-semibold text-[#0B3F46]">Food:</span> {fest.foodCoord}</div>
                          <div><span className="font-semibold text-[#0B3F46]">Media:</span> {fest.mediaCoord}</div>
                        </td>
                        <td className="p-4 text-sm font-semibold text-[#0B3F46]">{programsOf(fest.id).length}</td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openPrograms(fest)} className={ghostButton}>
                              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" /> Programs
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDeleteFest(fest)}
                              aria-label={`Delete ${fest.name}`}
                              className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {fests.length === 0 && (
                      <tr><td colSpan="7" className="p-10 text-center text-xs text-slate-500">No fests yet. Create the first one above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* PROGRAMS */}
        {activeTab === 'programs' && fests && (
          <div className="space-y-6">
            {fests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
                <p className="font-semibold text-slate-900">Create a fest first.</p>
                <p className="mt-1 text-sm text-slate-600">Programs are listed inside a fest.</p>
              </div>
            ) : (
              selectedFest && (
                <>
                  <section className={`${cardStyle} p-6`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="w-full max-w-sm">
                        <Field id="programFest" label="Fest">
                          <select
                            id="programFest"
                            value={programFestId}
                            onChange={(e) => { setProgramFestId(e.target.value); setProgramForm(null); setError(''); setNotice(''); }}
                            className={inputStyle}
                          >
                            {fests.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </Field>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedFest.published ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FDEFD3] text-[#5C3B00]'}`}>
                          {selectedFest.published ? 'Published' : 'Draft'}
                        </span>
                        {!programForm && (
                          <button type="button" disabled={busy} onClick={() => { setError(''); setProgramForm(EMPTY_PROGRAM); }} className={primaryButton}>
                            <Plus className="h-4 w-4 text-[#F5A623]" /> Add program
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                      {selectedFest.published ? (
                        <p className="text-sm text-slate-600">
                          The list is published, so coordinators can assign teachers. You can still add programs. A program with teachers assigned cannot be deleted.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-600">Coordinators cannot see this fest yet. Publish the list when your programs are ready.</p>
                          <button type="button" onClick={handlePublish} disabled={busy || festPrograms.length === 0} className={primaryButton}>
                            <Send className="h-4 w-4 text-[#F5A623]" /> Publish program list
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {programForm && (
                    <form onSubmit={handleSaveProgram} noValidate className={`${cardStyle} space-y-4 p-6`}>
                      <h3 className="fest-display text-lg font-bold text-[#0B3F46]">{programForm.id ? 'Edit program' : 'Add a program'}</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="progName" label="Program name">
                          <input id="progName" autoFocus type="text" placeholder="e.g. English Recitation" value={programForm.name} onChange={setP('name')} className={inputStyle} />
                        </Field>

                        <Field id="progLanguage" label="Languages" hint="Select applicable languages (leave unchecked for items like dance or music).">
                          <div className="flex flex-wrap gap-3 pt-2">
                            {LANGUAGES.map((l) => (
                              <label key={l} className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  value={l}
                                  checked={Array.isArray(programForm.language) && programForm.language.includes(l)}
                                  onChange={(e) => {
                                    const { checked, value } = e.target;
                                    setProgramForm((prev) => ({
                                      ...prev,
                                      language: checked
                                        ? [...(Array.isArray(prev.language) ? prev.language : []), value]
                                        : (Array.isArray(prev.language) ? prev.language : []).filter((item) => item !== value),
                                    }));
                                  }}
                                  className="rounded border-slate-300 text-[#0B3F46] focus:ring-[#0B3F46]"
                                />
                                {l}
                              </label>
                            ))}
                          </div>
                        </Field>

                        <Field id="progStage" label="Where it is held">
                          <select id="progStage" value={programForm.stage} onChange={setP('stage')} className={inputStyle}>
                            <option value="onstage">On stage</option>
                            <option value="offstage">Off stage</option>
                          </select>
                        </Field>
                        <Field id="progKind" label="Who takes part">
                          <select id="progKind" value={programForm.kind} onChange={setP('kind')} className={inputStyle}>
                            <option value="individual">Individual</option>
                            <option value="group">Group</option>
                          </select>
                        </Field>
                        {programForm.kind === 'group' && (
                          <Field id="progSize" label="Largest group size" hint="Between 2 and 30 students.">
                            <input id="progSize" type="number" min="2" max="30" value={programForm.maxGroupSize} onChange={setP('maxGroupSize')} className={inputStyle} />
                          </Field>
                        )}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Saving...' : 'Save program'}</button>
                        <button type="button" disabled={busy} onClick={() => setProgramForm(null)} className={`${ghostButton} px-5 py-3 text-sm`}>Cancel</button>
                      </div>
                    </form>
                  )}

                  {festPrograms.length === 0 && !programForm ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
                      <p className="font-semibold text-slate-900">No programs yet.</p>
                      <p className="mt-1 text-sm text-slate-600">Add the first program to build the list.</p>
                    </div>
                  ) : (
                    <>
                      {renderProgramGroup('On stage', 'onstage')}
                      {renderProgramGroup('Off stage', 'offstage')}
                    </>
                  )}
                </>
              )
            )}
          </div>
        )}

        {/* COORDINATORS */}
        {activeTab === 'coordinators' && fests && (
          <div className="space-y-8">
            <section className={`${cardStyle} p-6 sm:p-8`}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#FCE7EF] p-3 text-[#D6336C]"><Users className="h-5 w-5" /></div>
                <div>
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Add Section / Department Coordinator</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Type the teacher's name and department directly. Staff ID and Gmail will appear after their account is registered and approved.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAssignCoordinator} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Field id="teacherName" label="Teacher Name">
                  <input
                    id="teacherName"
                    type="text"
                    placeholder="e.g. Dr Reshmi"
                    value={coordForm.teacherName}
                    onChange={(e) => setCoordForm((prev) => ({ ...prev, teacherName: e.target.value }))}
                    className={inputStyle}
                  />
                </Field>
                <Field id="department" label="Department / Section">
                  <input
                    id="department"
                    type="text"
                    placeholder="e.g. AIML"
                    value={coordForm.department}
                    onChange={(e) => setCoordForm((prev) => ({ ...prev, department: e.target.value }))}
                    className={inputStyle}
                  />
                </Field>
                <button type="submit" disabled={busy} className={primaryButton}>
                  <Users className="h-4 w-4 text-[#F5A623]" />
                  {busy ? 'Saving...' : 'Add Coordinator'}
                </button>
              </form>
            </section>

            <section className={`${cardStyle} overflow-hidden`}>
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h3 className="fest-display font-bold text-[#0B3F46]">Appointed Coordinators</h3>
                <p className="mt-1 text-xs text-slate-500">Active department and section coordinators.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th scope="col" className="p-4">Name</th>
                      <th scope="col" className="p-4">Department / Section</th>
                      <th scope="col" className="p-4">Staff ID</th>
                      <th scope="col" className="p-4">Email</th>
                      <th scope="col" className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {coordinatorUsers.map((u) => (
                      <tr key={u.id} className="transition hover:bg-[#F5F8F8]">
                        <td className="p-4 font-semibold text-[#0B3F46]">{u.name}</td>
                        <td className="p-4 font-medium text-[#0E4D55]">{u.department}</td>
                        <td className="p-4 text-slate-600">{u.staffId || <span className="text-slate-400 italic">Pending registration</span>}</td>
                        <td className="p-4 text-slate-500">{u.email || <span className="text-slate-400 italic">Pending registration</span>}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveCoordinator(u)}
                            aria-label={`Remove ${u.name} as coordinator`}
                            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coordinatorUsers.length === 0 && (
                      <tr><td colSpan="5" className="p-10 text-center text-xs text-slate-500">No coordinators appointed yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* APPROVALS */}
        {activeTab === 'approvals' && fests && (
          <section className={`${cardStyle} p-6 sm:p-8`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]"><UserCheck className="h-5 w-5" /></div>
              <div>
                <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Pending Registrations</h2>
                <p className="mt-1 text-xs text-slate-500">Approve or reject accounts before they can sign in.</p>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {PENDING_ROLES.map(({ id, label }) => {
                const count = id === 'all' ? pendingUsers.length : pendingUsers.filter((u) => roleKeyOf(u) === id).length;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRoleFilter(id)}
                    aria-pressed={roleFilter === id}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      roleFilter === id ? 'bg-[#0B3F46] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                    <th scope="col" className="p-3">Name & Email</th>
                    <th scope="col" className="p-3">ID</th>
                    <th scope="col" className="p-3">Department / Class</th>
                    <th scope="col" className="p-3">Requested Role</th>
                    <th scope="col" className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePending.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-[#0B3F46]">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </td>
                      <td className="p-3 text-xs">{user.staffId || user.registerNo || user.studentId || user.admissionNo || '—'}</td>
                      <td className="p-3 text-xs font-medium text-[#0E4D55]">
                        {user.department || '—'}{user.className ? ` · ${user.className}` : ''}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{roleLabelOf(user)}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDecide(user, true)}
                            className="rounded-xl bg-[#0B3F46] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0E4D55] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button type="button" disabled={busy} onClick={() => handleDecide(user, false)} className={ghostButton}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visiblePending.length === 0 && (
                    <tr><td colSpan="5" className="p-10 text-center text-xs text-slate-500">No pending registrations{roleFilter !== 'all' ? ' for this role' : ''}. All clear!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SUBMISSIONS */}
        {activeTab === 'submissions' && fests && (
          <section className={`${cardStyle} p-6 sm:p-8 space-y-6`}>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]"><Send className="h-5 w-5" /></div>
              <div>
                <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Department Submissions</h2>
                <p className="mt-1 text-xs text-slate-500">Review participant lists forwarded by department coordinators.</p>
              </div>
            </div>

            {adminSubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No department rosters have been submitted to Admin yet.</p>
            ) : (
              <div className="space-y-6">
                {adminSubmissions.map((sub, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="font-extrabold text-[#0B3F46] text-base">Department: {sub.department}</h3>
                        <p className="text-xs text-slate-500">Forwarded by Coordinator: <span className="font-semibold text-slate-700">{sub.coordinatorName}</span></p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">Forwarded on: {new Date(sub.forwardedAt).toLocaleString()}</span>
                    </div>

                    <div className="space-y-3">
                      {sub.submissions.map((teacherSub, tIdx) => (
                        <div key={tIdx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <p className="text-xs font-bold text-[#0E4D55]">Teacher In-Charge: {teacherSub.teacherName}</p>
                          <div className="space-y-1.5 pl-2">
                            {teacherSub.participants.map((p, pIdx) => (
                              <div key={pIdx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <div>
                                  <span className="font-bold text-slate-800">{p.studentName}</span> (ID: <span className="font-mono">{p.studentId}</span>)
                                  <span className="mx-2 text-slate-400">|</span>
                                  Program: <span className="font-semibold text-[#0B3F46]">{p.eventName}</span> ({p.eventType})
                                </div>
                                <span className="mt-1 sm:mt-0 inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit">
                                  <CheckCircle2 size={12} /> {p.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && fests && (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`${cardStyle} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]"><Calendar className="h-5 w-5" /></div>
                  <span className="text-xs font-medium text-slate-500">Fests</span>
                </div>
                <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">{fests.length}</p>
                <p className="mt-1 text-sm text-slate-500">{programs.length} programs listed in total</p>
              </div>

              <div className={`${cardStyle} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]"><Users className="h-5 w-5" /></div>
                  <span className="text-xs font-medium text-slate-500">Coordinators</span>
                </div>
                <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">{coordinatorUsers.length}</p>
                <p className="mt-1 text-sm text-slate-500">Department and section coordinators</p>
              </div>

              <div className={`${cardStyle} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-[#FCE7EF] p-3 text-[#D6336C]"><Award className="h-5 w-5" /></div>
                  <span className="text-xs font-medium text-slate-500">Minimum rule</span>
                </div>
                <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">3</p>
                <p className="mt-1 text-sm text-slate-500">Students (school) or departments (college)</p>
              </div>
            </div>

            <section className={`${cardStyle} p-6 sm:p-8`}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]"><ShieldAlert className="h-5 w-5" /></div>
                <div>
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Program Participation and Cancellation Monitor</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Sample data. Programs below the minimum are flagged for cancellation once data entry closes. A school program needs at least 3 participants. A college program needs at least 3 departments.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0B3F46]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Going ahead
                  </h4>
                  <ul className="space-y-3 text-xs text-slate-600">
                    <li className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-1 flex justify-between font-semibold text-[#0B3F46]">
                        <span>English Recitation</span><span className="text-emerald-700">5 depts / 14 students</span>
                      </div>
                      <p className="text-[11px] text-slate-500">CSE, ECE, ME, EEE, CE</p>
                    </li>
                    <li className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-1 flex justify-between font-semibold text-[#0B3F46]">
                        <span>Classical Dance</span><span className="text-emerald-700">4 depts / 8 students</span>
                      </div>
                      <p className="text-[11px] text-slate-500">CSE, ECE, ME, CE</p>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-700">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Cancelled (below the minimum)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <div className="flex justify-between gap-2"><span>Sanskrit Drama</span><span className="font-semibold text-rose-700">1 department</span></div>
                      <p className="mt-1 text-[11px] text-slate-500">Had joined: Arjun, Rahul</p>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className={`${cardStyle} p-6`}>
                <h3 className="fest-display mb-1 flex items-center gap-2 font-bold text-[#0B3F46]">
                  <DollarSign className="h-5 w-5 text-[#B87908]" /> Department-wise Fund Collection
                </h3>
                <p className="mb-4 text-xs text-slate-500">Sample data.</p>
                <div className="space-y-3 text-xs">
                  {[['Computer Science (CSE)', '₹12,450'], ['Electronics and Communication (ECE)', '₹9,800'], ['Mechanical Engineering (ME)', '₹11,200']].map(([dept, amount]) => (
                    <div key={dept} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="font-semibold text-slate-700">{dept}</span>
                      <span className="font-bold text-[#0B3F46]">{amount}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`${cardStyle} p-6`}>
                <h3 className="fest-display mb-1 flex items-center gap-2 font-bold text-[#0B3F46]">
                  <Trophy className="h-5 w-5 text-[#F5A623]" /> Leaderboard and Results
                </h3>
                <p className="mb-4 text-xs text-slate-500">Sample data. Final standings come from the judges&rsquo; verified scores.</p>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <span className="font-bold text-amber-900">1st: Department of Computer Science</span>
                    <span className="font-bold text-amber-800">145 points</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="font-semibold text-slate-700">2nd: Department of ECE</span>
                    <span className="font-bold text-slate-700">120 points</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} CampusFest. Fest management for schools and colleges.
        </footer>
      </main>
    </div>
  );
}