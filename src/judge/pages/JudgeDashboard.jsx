import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Save,
  Send,
  Home,
  ArrowLeft,
  ClipboardList,
  Clock,
  MapPin,
  Trophy,
} from 'lucide-react';
import { API_BASE } from '../../services/api';

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

const RANKS = ['1st Place', '2nd Place', '3rd Place', 'A Grade', 'B Grade'];

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

export default function JudgeDashboard() {
  const user = getLoggedInUser();

  const [fests, setFests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [edits, setEdits] = useState({}); // { [registrationId]: { score, rank } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    try {
      const [f, p, r, s] = await Promise.all([
        getList('fests'),
        getList('programs'),
        getList('registrations'),
        getList('results', true),
      ]);
      setFests(f);
      setPrograms(p);
      setRegistrations(r);
      setResults(s);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load data. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const isJudge = user && user.role === 'judge';

  // Programs of fests the admin has published.
  // If a program lists judgeIds, only those judges see it.
  const myPrograms = useMemo(() => {
    const publishedIds = fests.filter((f) => f.published).map((f) => String(f.id));
    return programs.filter((p) => {
      if (!publishedIds.includes(String(p.festId))) return false;
      if (Array.isArray(p.judgeIds) && p.judgeIds.length > 0) {
        return p.judgeIds.includes(user?.id);
      }
      return true;
    });
  }, [fests, programs, user]);

  const contestantsFor = (programId) =>
    registrations.filter(
      (r) => String(r.programId) === String(programId) && r.status === 'Forwarded to Admin'
    );

  const savedResultFor = (registrationId) =>
    results.find((x) => x.registrationId === registrationId && x.judgeId === user?.id);

  const statusOf = (program) => {
    const list = contestantsFor(program.id);
    if (list.length === 0) return 'No entries yet';
    const allDone = list.every((c) => savedResultFor(c.id)?.status === 'submitted');
    return allDone ? 'Completed' : 'Pending Evaluation';
  };

  const selected = myPrograms.find((p) => String(p.id) === String(selectedId)) || myPrograms[0] || null;
  const contestants = selected ? contestantsFor(selected.id) : [];

  const completedCount = myPrograms.filter((p) => statusOf(p) === 'Completed').length;
  const pendingCount = myPrograms.filter((p) => statusOf(p) === 'Pending Evaluation').length;

  const valueOf = (reg, field) => {
    if (edits[reg.id] && edits[reg.id][field] !== undefined) return edits[reg.id][field];
    const saved = savedResultFor(reg.id);
    return saved ? saved[field] : '';
  };

  const handleChange = (regId, field, value) => {
    setEdits((prev) => ({ ...prev, [regId]: { ...prev[regId], [field]: value } }));
    setMessage('');
  };

  const saveRows = async (finalSubmit) => {
    setMessage('');
    setError('');

    const rows = contestants
      .filter((c) => savedResultFor(c.id)?.status !== 'submitted')
      .map((c) => ({ reg: c, score: valueOf(c, 'score'), rank: valueOf(c, 'rank') }));

    const filled = rows.filter((r) => r.score !== '' && r.rank !== '');

    if (finalSubmit && filled.length !== rows.length) {
      setError('Enter a score and a rank for every contestant before submitting.');
      return;
    }
    if (filled.some((r) => Number(r.score) < 0 || Number(r.score) > 100)) {
      setError('Scores must be between 0 and 100.');
      return;
    }
    if (filled.length === 0) {
      setError('Nothing to save yet.');
      return;
    }

    setSaving(true);
    try {
      for (const { reg, score, rank } of filled) {
        const body = {
          festId: selected.festId,
          programId: selected.id,
          programName: selected.name,
          registrationId: reg.id,
          studentId: reg.studentId,
          studentName: reg.studentName,
          department: reg.department,
          deptKey: reg.deptKey,
          score: Number(score),
          rank,
          judgeId: user.id,
          judgeName: user.name,
          status: finalSubmit ? 'submitted' : 'draft',
          updatedAt: new Date().toISOString(),
        };
        if (finalSubmit) body.submittedAt = new Date().toISOString();

        const existing = savedResultFor(reg.id);
        const res = await fetch(
          existing ? `${API_BASE}/results/${existing.id}` : `${API_BASE}/results`,
          {
            method: existing ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) throw new Error('The server did not accept the marks.');
      }
      setEdits({});
      await loadAll();
      setMessage(
        finalSubmit
          ? 'Results submitted to the Fest Committee.'
          : 'Draft saved. You can still change the marks.'
      );
    } catch (err) {
      setError(err.message || 'Saving failed. Is the server running?');
    } finally {
      setSaving(false);
    }
  };

  if (!isJudge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8F8] p-6 font-['DM_Sans']">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm text-center shadow-sm">
          <p className="text-slate-700 mb-4">Please sign in with a judge account to see this page.</p>
          <Link to="/login" className="font-bold text-[#0B3F46] hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const allLocked =
    contestants.length > 0 && contestants.every((c) => savedResultFor(c.id)?.status === 'submitted');

  return (
    <div className="min-h-screen flex bg-[#F5F8F8] text-slate-800 font-['DM_Sans']">
      <style>{FONT_CSS}</style>

      <aside className="hidden md:flex w-64 bg-[#072C31] text-white flex-col justify-between p-6 shrink-0">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#072C31]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-['Bricolage_Grotesque']">CampusFest</h2>
              <p className="text-[10px] text-[#F5A623] uppercase tracking-[2px] font-bold">Judge Committee</p>
            </div>
          </Link>

          <nav className="space-y-2">
            <div className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold bg-[#F5A623] text-[#072C31] shadow-lg">
              <ClipboardList size={17} />
              Scorecard & Markings
            </div>
          </nav>

          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-[#F5A623] mb-2">
              <Trophy size={16} />
              <span className="text-xs font-bold">{user.name}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter marks and ranks, then submit them to the Fest Committee.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <Link
            to="/login"
            onClick={() => localStorage.removeItem('fest_user')}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-[#F5A623] font-semibold transition"
          >
            <ArrowLeft size={15} />
            Sign Out
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              Judge Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Programs appear here once the admin publishes the fest.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0B3F46] hover:text-[#D6336C] transition"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </header>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-2">Programs for you</p>
            <h3 className="text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              {myPrograms.length}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Clock size={14} /> Waiting for your marks
            </p>
            <h3 className="text-3xl font-extrabold text-[#B7791F] font-['Bricolage_Grotesque']">{pendingCount}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Submitted
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600 font-['Bricolage_Grotesque']">{completedCount}</h3>
          </div>
        </section>

        {loading ? (
          <p className="text-sm text-slate-500">Loading programs...</p>
        ) : myPrograms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-sm text-slate-600">
            No programs yet. They appear here after the admin publishes the fest.
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white border border-slate-200 p-5 sm:p-7 rounded-3xl shadow-sm">
              <h2 className="text-lg font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque'] mb-1">
                Your programs
              </h2>
              <p className="text-xs text-slate-400 mb-5">Choose a program to enter marks.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myPrograms.map((prog) => {
                  const status = statusOf(prog);
                  const active = selected && prog.id === selected.id;
                  return (
                    <button
                      type="button"
                      key={prog.id}
                      onClick={() => {
                        setSelectedId(prog.id);
                        setEdits({});
                        setMessage('');
                        setError('');
                      }}
                      className={`text-left bg-[#F5F8F8] border p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 transition ${
                        active ? 'border-[#F5A623] ring-2 ring-[#F5A623]/20' : 'border-slate-200 hover:border-[#F5A623]'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-[#0B3F46] text-sm">{prog.name}</h3>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#D6336C]" />
                          {prog.stage === 'onstage' ? 'On stage' : 'Off stage'}
                          {' · '}
                          {contestantsFor(prog.id).length} entries
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit px-3 py-1.5 rounded-full text-[11px] font-bold ${
                          status === 'Completed'
                            ? 'bg-[#E6F5EC] text-emerald-700'
                            : status === 'Pending Evaluation'
                            ? 'bg-[#FFF3D6] text-[#B7791F]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {selected && (
              <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100">
                  <h3 className="font-extrabold text-[#0B3F46] text-lg font-['Bricolage_Grotesque']">
                    Scorecard: {selected.name}
                  </h3>
                </div>

                {contestants.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No entries have reached the admin for this program yet.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-[#F5F8F8] text-slate-500 text-[11px] tracking-wider">
                            <th className="p-4 font-bold">Chest no</th>
                            <th className="p-4 font-bold">Participant</th>
                            <th className="p-4 font-bold">Marks (out of 100)</th>
                            <th className="p-4 font-bold">Rank</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {contestants.map((c) => {
                            const locked = savedResultFor(c.id)?.status === 'submitted';
                            return (
                              <tr key={c.id}>
                                <td className="p-4 font-mono text-[#D6336C] font-bold">C-{String(c.id).padStart(2, '0')}</td>
                                <td className="p-4 font-bold text-[#0B3F46]">
                                  {c.studentName}
                                  <span className="block text-xs font-normal text-slate-500">
                                    {String(c.department || '').replace(/"/g, '')}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    disabled={locked}
                                    value={valueOf(c, 'score')}
                                    onChange={(e) => handleChange(c.id, 'score', e.target.value)}
                                    className="bg-[#F5F8F8] border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-28 font-mono focus:outline-none focus:border-[#F5A623] disabled:opacity-60"
                                    aria-label={`Marks for ${c.studentName}`}
                                  />
                                </td>
                                <td className="p-4">
                                  <select
                                    disabled={locked}
                                    value={valueOf(c, 'rank')}
                                    onChange={(e) => handleChange(c.id, 'rank', e.target.value)}
                                    className="bg-[#F5F8F8] border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-36 focus:outline-none focus:border-[#F5A623] disabled:opacity-60"
                                    aria-label={`Rank for ${c.studentName}`}
                                  >
                                    <option value="">Select rank</option>
                                    {RANKS.map((r) => (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <p className="text-xs text-slate-400">
                        {allLocked
                          ? 'These results are submitted and locked.'
                          : 'Save a draft any time. Submit when every row is done.'}
                      </p>
                      {!allLocked && (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveRows(false)}
                            className="inline-flex items-center gap-2 bg-[#0B3F46] hover:bg-[#072C31] text-white px-5 py-3 rounded-xl text-xs font-bold transition disabled:opacity-60"
                          >
                            <Save size={15} />
                            Save draft
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveRows(true)}
                            className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#FFB83D] text-[#072C31] px-5 py-3 rounded-xl text-xs font-extrabold transition disabled:opacity-60"
                          >
                            <Send size={15} />
                            Submit results
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}