import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Award, Layers } from 'lucide-react';
import { API_BASE, authHeaders } from '../../services/api';
import AdminLayout from '../../admin/components/Adminlayout';
import Photo from '../../components/Photo';

// Points for each rank. Change these numbers to change the department totals.
const POINTS = {
  '1st Place': 5,
  '2nd Place': 3,
  '3rd Place': 1,
  'A Grade': 0,
  'B Grade': 0,
};

function getLoggedInUser() {
  try {
    return JSON.parse((sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user')));
  } catch {
    return null;
  }
}

async function getList(name, allowMissing = false) {
  const res = await fetch(`${API_BASE}/${name}`, {
    headers: authHeaders(),
  });
  if (allowMissing && res.status === 404) return [];
  if (!res.ok) throw new Error(`Could not load ${name}.`);
  return res.json();
}

const cleanDept = (r) =>
  String(r.department || r.deptKey || 'Unknown').replace(/"/g, '').trim();

export default function JudgeResults() {
  const user = getLoggedInUser();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [fests, setFests] = useState([]);
  const [festId, setFestId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, f] = await Promise.all([getList('results', true), getList('fests')]);
        setResults(Array.isArray(r) ? r : []);
        setFests(Array.isArray(f) ? f : []);
        setError('');
      } catch (err) {
        setError(err.message || 'Could not load results. Is the server running?');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submitted = useMemo(() => {
    const byReg = new Map();
    results
      .filter((x) => !x.status || x.status === 'submitted' || x.status === 'published' || x.status === 'final')
      .filter((x) => !festId || String(x.festId) === String(festId))
      .forEach((x, idx) => {
        const key = x.registrationId || `${x.programId || ''}-${x.studentName || ''}-${x.id || idx}`;
        const old = byReg.get(key);
        if (!old || String(x.submittedAt || '') >= String(old.submittedAt || '')) {
          byReg.set(key, x);
        }
      });
    return [...byReg.values()];
  }, [results, festId]);

  const byProgram = useMemo(() => {
    const map = new Map();
    submitted.forEach((x) => {
      const key = String(x.programId || x.programName || 'program');
      if (!map.has(key)) map.set(key, { name: x.programName || 'Program', rows: [] });
      map.get(key).rows.push(x);
    });
    return [...map.values()].map((p) => ({
      ...p,
      rows: [...p.rows].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)),
    }));
  }, [submitted]);

  const deptTotals = useMemo(() => {
    const map = new Map();
    submitted.forEach((x) => {
      const key = x.deptKey || cleanDept(x);
      if (!map.has(key)) {
        map.set(key, { name: cleanDept(x), points: 0, first: 0, second: 0, third: 0 });
      }
      const d = map.get(key);
      d.points += POINTS[x.rank] || 0;
      if (x.rank === '1st Place') d.first += 1;
      if (x.rank === '2nd Place') d.second += 1;
      if (x.rank === '3rd Place') d.third += 1;
    });
    return [...map.values()].sort((a, b) => b.points - a.points);
  }, [submitted]);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== 'committee' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F8] p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm text-center shadow-sm">
          <p className="text-slate-700 mb-4">Please sign in as the fest admin to see results.</p>
          <Link to="/login" className="font-bold text-[#0B3F46] hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleSidebarSelect = (tabId) => {
    sessionStorage.setItem('admin_tab', tabId);
    navigate('/admin');
  };

  const leader = deptTotals[0] || null;

  return (
    <AdminLayout activeTab="overview" onSelect={handleSidebarSelect}>
      <header className="relative mb-8 overflow-hidden rounded-2xl bg-[#0B3F46] text-white shadow-sm">
        <Photo
          src="/banner.png"
          alt=""
          eager
          className="absolute inset-0 h-full w-full"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0B3F46] via-[#0B3F46]/80 to-[#0B3F46]/20"
        />
        <div className="relative z-10 flex flex-col justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
              <span className="h-2 w-2 rounded-full bg-[#F5A623]" />
              CampusFest Administration
            </div>
            <h1 className="fest-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Judge Results & Leaderboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              Submitted marks by program and total points earned by each department.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-[#F5A623]/40"
            >
              <ArrowLeft size={14} /> Back to Overview
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {fests.length > 0 && (
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div className="w-full max-w-sm">
              <label htmlFor="resultsFest" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Fest
              </label>
              <select
                id="resultsFest"
                value={festId}
                onChange={(e) => setFestId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10"
              >
                <option value="">All fests</option>
                {fests.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </section>
        )}

        {!loading && !error && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]">
                  <Trophy className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-500">Leader</span>
              </div>
              <p className="fest-display text-2xl font-extrabold text-[#0B3F46]">
                {leader ? leader.name : '—'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {leader ? `${leader.points} points total` : 'No scores yet'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-500">Programs Judged</span>
              </div>
              <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">{byProgram.length}</p>
              <p className="mt-1 text-sm text-slate-500">Submitted program scorecards</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-[#FCE7EF] p-3 text-[#D6336C]">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-500">Scored Entries</span>
              </div>
              <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">{submitted.length}</p>
              <p className="mt-1 text-sm text-slate-500">Participants evaluated</p>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-600">Loading results...</p>
        ) : submitted.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
            No results yet. They appear here when a judge submits a program.
          </div>
        ) : (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-5 sm:px-6">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-[#B7791F]" />
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Department Totals</h2>
                </div>
                <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
                  {deptTotals.length} {deptTotals.length === 1 ? 'Department' : 'Departments'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="p-4">Pos</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">1st</th>
                      <th className="p-4">2nd</th>
                      <th className="p-4">3rd</th>
                      <th className="p-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deptTotals.map((d, i) => (
                      <tr key={d.name} className={i === 0 ? 'bg-amber-50/50' : 'hover:bg-[#F5F8F8]'}>
                        <td className="p-4 font-bold text-slate-700">{i + 1}</td>
                        <td className="p-4 font-bold text-[#0B3F46]">{d.name}</td>
                        <td className="p-4">{d.first}</td>
                        <td className="p-4">{d.second}</td>
                        <td className="p-4">{d.third}</td>
                        <td className="p-4 text-right font-extrabold text-[#0B3F46]">{d.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-slate-100 bg-[#F8FAFA] px-6 py-3.5 text-xs text-slate-500">
                Points: 1st = {POINTS['1st Place']}, 2nd = {POINTS['2nd Place']}, 3rd = {POINTS['3rd Place']}. Grades give no points.
              </p>
            </section>

            {byProgram.map((p) => (
              <section key={p.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">{p.name}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {p.rows.length} {p.rows.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-left text-sm">
                    <thead>
                      <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="p-4">Participant</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Marks</th>
                        <th className="p-4">Rank</th>
                        <th className="p-4">Judge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {p.rows.map((x, idx) => (
                        <tr key={x.id || `${p.name}-${idx}`} className="hover:bg-[#F5F8F8]">
                          <td className="p-4 font-bold text-[#0B3F46]">{x.studentName}</td>
                          <td className="p-4">{cleanDept(x)}</td>
                          <td className="p-4 font-mono">{x.score}</td>
                          <td className="p-4">
                            <span className="rounded-full bg-[#E6F1F2] px-2.5 py-1 text-xs font-semibold text-[#0B3F46]">
                              {x.rank || '—'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{x.judgeName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CampusFest. Fest management for schools and colleges.
      </footer>
    </AdminLayout>
  );
}