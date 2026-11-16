import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { API_BASE } from '../../services/api';

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
    return JSON.parse(localStorage.getItem('fest_user'));
  } catch {
    return null;
  }
}

async function getList(name, allowMissing = false) {
  const res = await fetch(`${API_BASE}/${name}`);
  if (allowMissing && res.status === 404) return [];
  if (!res.ok) throw new Error(`Could not load ${name}.`);
  return res.json();
}

const cleanDept = (r) =>
  String(r.department || r.deptKey || 'Unknown').replace(/"/g, '').trim();

export default function JudgeResults() {
  const user = getLoggedInUser();
  const [results, setResults] = useState([]);
  const [fests, setFests] = useState([]);
  const [festId, setFestId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, f] = await Promise.all([getList('results', true), getList('fests')]);
        setResults(r);
        setFests(f);
        setError('');
      } catch (err) {
        setError(err.message || 'Could not load results. Is the server running?');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Only submitted marks count. If a student has two submitted rows, keep the latest.
  const submitted = useMemo(() => {
    const byReg = new Map();
    results
      .filter((x) => x.status === 'submitted')
      .filter((x) => !festId || String(x.festId) === String(festId))
      .forEach((x) => {
        const old = byReg.get(x.registrationId);
        if (!old || String(x.submittedAt) > String(old.submittedAt)) byReg.set(x.registrationId, x);
      });
    return [...byReg.values()];
  }, [results, festId]);

  const byProgram = useMemo(() => {
    const map = new Map();
    submitted.forEach((x) => {
      const key = x.programId;
      if (!map.has(key)) map.set(key, { name: x.programName, rows: [] });
      map.get(key).rows.push(x);
    });
    return [...map.values()].map((p) => ({
      ...p,
      rows: [...p.rows].sort((a, b) => b.score - a.score),
    }));
  }, [submitted]);

  const deptTotals = useMemo(() => {
    const map = new Map();
    submitted.forEach((x) => {
      const key = x.deptKey || cleanDept(x);
      if (!map.has(key)) map.set(key, { name: cleanDept(x), points: 0, first: 0, second: 0, third: 0 });
      const d = map.get(key);
      d.points += POINTS[x.rank] || 0;
      if (x.rank === '1st Place') d.first += 1;
      if (x.rank === '2nd Place') d.second += 1;
      if (x.rank === '3rd Place') d.third += 1;
    });
    return [...map.values()].sort((a, b) => b.points - a.points);
  }, [submitted]);

  if (!user || user.role !== 'committee') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F8] p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm text-center">
          <p className="text-slate-700 mb-4">Please sign in as the fest admin to see results.</p>
          <Link to="/login" className="font-bold text-[#0B3F46] hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8F8] text-slate-800 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0B3F46] hover:text-[#D6336C] mb-6"
        >
          <ArrowLeft size={16} />
          Back to admin
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3F46]">Judge results</h1>
            <p className="text-sm text-slate-500 mt-1">
              Marks the judges have submitted, and the points each department has earned.
            </p>
          </div>
          <select
            value={festId}
            onChange={(e) => setFestId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            aria-label="Choose fest"
          >
            <option value="">All fests</option>
            {fests.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading results...</p>
        ) : submitted.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-sm text-slate-600">
            No results yet. They appear here when a judge submits a program.
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <Trophy size={18} className="text-[#B7791F]" />
                <h2 className="font-extrabold text-[#0B3F46] text-lg">Department totals</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-slate-500 text-xs">
                      <th className="p-4 font-bold">Position</th>
                      <th className="p-4 font-bold">Department</th>
                      <th className="p-4 font-bold">1st</th>
                      <th className="p-4 font-bold">2nd</th>
                      <th className="p-4 font-bold">3rd</th>
                      <th className="p-4 font-bold">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deptTotals.map((d, i) => (
                      <tr key={d.name}>
                        <td className="p-4 font-bold">{i + 1}</td>
                        <td className="p-4 font-bold text-[#0B3F46]">{d.name}</td>
                        <td className="p-4">{d.first}</td>
                        <td className="p-4">{d.second}</td>
                        <td className="p-4">{d.third}</td>
                        <td className="p-4 font-extrabold text-[#0B3F46]">{d.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="p-4 text-xs text-slate-400">
                Points: 1st = {POINTS['1st Place']}, 2nd = {POINTS['2nd Place']}, 3rd = {POINTS['3rd Place']}. Grades give no points.
              </p>
            </section>

            {byProgram.map((p) => (
              <section key={p.name} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h2 className="font-extrabold text-[#0B3F46] text-lg">{p.name}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[520px]">
                    <thead>
                      <tr className="bg-[#F5F8F8] text-slate-500 text-xs">
                        <th className="p-4 font-bold">Participant</th>
                        <th className="p-4 font-bold">Department</th>
                        <th className="p-4 font-bold">Marks</th>
                        <th className="p-4 font-bold">Rank</th>
                        <th className="p-4 font-bold">Judge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {p.rows.map((x) => (
                        <tr key={x.id}>
                          <td className="p-4 font-bold text-[#0B3F46]">{x.studentName}</td>
                          <td className="p-4">{cleanDept(x)}</td>
                          <td className="p-4 font-mono">{x.score}</td>
                          <td className="p-4">{x.rank}</td>
                          <td className="p-4 text-slate-500">{x.judgeName}</td>
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
    </div>
  );
}