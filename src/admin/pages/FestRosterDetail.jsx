import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../services/api';
import AdminLayout from '../../admin/components/Adminlayout';
import StudentCard, { CARD_THEMES } from '../components/StudentCard';
import { groupDepartments, fmtDateTime } from './rosterGroups';

/*
 * Page for one fest, grouped by PROGRAM.
 * 1. Shows a card for every program that has registrations (e.g. Recitations).
 * 2. Clicking a program shows every student registered for it, grouped by department.
 * Route: /admin/submissions/:festId
 */
export default function FestRosterDetail() {
  const { festId } = useParams();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState(null);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/registrations`);
      if (!res.ok) throw new Error();
      setRegistrations(await res.json());
      setError('');
    } catch {
      setError(`Cannot load the rosters from ${API_BASE}. Is the server running?`);
      setRegistrations((r) => r || []);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const departments = useMemo(() => groupDepartments(registrations || [], festId), [registrations, festId]);

  const festName = departments.length
    ? (registrations || []).find((r) => String(r.festId) === String(festId))?.festName || 'Fest'
    : 'Fest';

  // Regroup every forwarded student by program, remembering which department they came from
  const programs = useMemo(() => {
    const map = new Map();
    departments.forEach((d) => {
      d.teachers.forEach((t) => {
        t.participants.forEach((p) => {
          const name = (p.eventName || 'Unnamed program').trim();
          const key = name.toLowerCase();
          if (!map.has(key)) {
            map.set(key, { key, name, eventType: p.eventType, students: [], deptNames: new Set() });
          }
          const g = map.get(key);
          g.students.push({
            ...p,
            deptName: d.department,
            deptKey: d.deptKey,
            teacherName: t.teacherName,
            forwardedAt: d.forwardedAt,
          });
          g.deptNames.add(d.department);
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [departments]);

  const studentCount = new Set(
    departments.flatMap((d) => d.teachers.flatMap((t) => t.participants.map((p) => String(p.studentId))))
  ).size;

  // Count shown beside "Department Submissions" in the sidebar
  const submissionCount = new Set(
    (registrations || [])
      .filter((r) => r.status === 'Forwarded to Admin')
      .map((r) => `${r.festId}|${r.deptKey}`)
  ).size;

  const selected = programs.find((p) => p.key === selectedKey) || null;

  // Students of the selected program, grouped by department
  const selectedByDept = useMemo(() => {
    if (!selected) return [];
    const map = new Map();
    selected.students.forEach((s) => {
      if (!map.has(s.deptKey)) map.set(s.deptKey, { deptKey: s.deptKey, department: s.deptName, students: [] });
      map.get(s.deptKey).students.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.department.localeCompare(b.department));
  }, [selected]);

  if (!localStorage.getItem('fest_user')) return <Navigate to="/login" replace />;

  return (
    <AdminLayout activeTab="submissions" badges={{ submissions: submissionCount }}>
      <header className="mb-8 border-b border-slate-200 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B3F46] transition hover:border-[#F5A623] hover:bg-[#FFF8E9] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30"
        >
          ← Back to Department Submissions
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="fest-display text-2xl font-extrabold tracking-tight text-[#0B3F46] sm:text-3xl">{festName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {departments.length} {departments.length === 1 ? 'department has' : 'departments have'} forwarded {studentCount}{' '}
              {studentCount === 1 ? 'student' : 'students'} across {programs.length} {programs.length === 1 ? 'program' : 'programs'}.
            </p>
          </div>
        </div>
      </header>

      {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {registrations === null && !error && <p className="text-sm text-slate-600">Loading...</p>}

      {registrations !== null && programs.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
          <p className="font-semibold text-slate-900">No rosters forwarded for this fest.</p>
          <p className="mt-1 text-sm text-slate-600">
            Go back and pick another fest, or wait for department coordinators to forward theirs.
          </p>
        </div>
      )}

      {/* STEP 1: list of programs */}
      {!selected && programs.length > 0 && (
        <section>
          <h2 className="fest-display mb-1 text-lg font-bold text-[#0B3F46]">Programs</h2>
          <p className="mb-5 text-xs text-slate-500">Click a program to see every student registered for it, from all departments.</p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {programs.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedKey(p.key)}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#F5A623] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="fest-display text-lg font-extrabold text-[#0B3F46]">{p.name}</h3>
                    {p.eventType && (
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        p.eventType === 'Group' ? 'bg-[#FCE7EF] text-[#D6336C]' : 'bg-[#E6F1F2] text-[#0B6870]'
                      }`}>
                        {p.eventType}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:text-[#F5A623]" />
                </div>

                <div className="mt-5 flex gap-8">
                  <div>
                    <p className="fest-display text-2xl font-extrabold text-[#0B3F46]">{p.students.length}</p>
                    <p className="text-xs text-slate-500">{p.students.length === 1 ? 'Student' : 'Students'}</p>
                  </div>
                  <div>
                    <p className="fest-display text-2xl font-extrabold text-[#0B3F46]">{p.deptNames.size}</p>
                    <p className="text-xs text-slate-500">{p.deptNames.size === 1 ? 'Department' : 'Departments'}</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">{Array.from(p.deptNames).join(', ')}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* STEP 2: students of the chosen program, grouped by department */}
      {selected && (
        <section>
          <button
            type="button"
            onClick={() => setSelectedKey(null)}
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B3F46] transition hover:border-[#F5A623] hover:bg-[#FFF8E9] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30"
          >
            ← All programs
          </button>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="fest-display text-2xl font-extrabold text-[#0B3F46]">{selected.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selected.students.length} {selected.students.length === 1 ? 'student' : 'students'} from{' '}
                {selected.deptNames.size} {selected.deptNames.size === 1 ? 'department' : 'departments'}
                {selected.eventType ? ` · ${selected.eventType} event` : ''}
              </p>
            </div>
          </div>

          {/* Colour key: one colour per department */}
          <div className="mb-5 flex flex-wrap gap-2">
            {selectedByDept.map((d, i) => (
              <span
                key={d.deptKey}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#0B3F46]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: CARD_THEMES[i % CARD_THEMES.length].from }}
                />
                {d.department} ({d.students.length})
              </span>
            ))}
          </div>

          {/* All students in one grid of cards, in rows */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {selectedByDept.flatMap((d, i) =>
              d.students.map((s) => (
                <StudentCard
                  key={`${s.deptKey}-${s.id}`}
                  student={s}
                  themeIndex={i}
                  formatDate={fmtDateTime}
                />
              ))
            )}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}