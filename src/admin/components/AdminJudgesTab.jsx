import React, { useState, useEffect, useCallback } from 'react';
import { Scale, UserPlus, CheckSquare, Square, Trash2, Save } from 'lucide-react';
import { API_BASE, authHeaders } from '../../services/api';

const sameId = (a, b) => String(a) === String(b);

export default function AdminJudgesTab({ fests = [], programs = [], onProgramsUpdated }) {
  const [judges, setJudges] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [selectedFestId, setSelectedFestId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const loadJudges = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!res.ok) return;
      const all = await res.json();
      const list = (Array.isArray(all) ? all : []).filter(
        (u) => u.role === 'judge' || u.baseType === 'judge'
      );
      setJudges(list);
      if (list.length > 0 && !list.some((j) => sameId(j.id, selectedJudgeId))) {
        setSelectedJudgeId(String(list[0].id));
      }
    } catch (err) {
      console.error('Failed to load judges:', err);
    }
  }, [selectedJudgeId]);

  useEffect(() => {
    loadJudges();
  }, [loadJudges]);

  useEffect(() => {
    if (fests.length > 0 && !fests.some((f) => sameId(f.id, selectedFestId))) {
      setSelectedFestId(String(fests[0].id));
    }
  }, [fests, selectedFestId]);

  const handleCreateJudge = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    if (judges.some((j) => String(j.email || '').toLowerCase() === email.trim().toLowerCase())) {
      setNotice({ type: 'error', text: 'A judge with this email already exists.' });
      return;
    }

    setBusy(true);
    setNotice({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: 'judge',
          baseType: 'judge',
          approved: true,
          createdAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Could not create judge account.');
      const created = await res.json();
      await loadJudges();
      if (created?.id) setSelectedJudgeId(String(created.id));
      setName('');
      setEmail('');
      setPassword('');
      setNotice({ type: 'ok', text: `Judge "${created.name || name.trim()}" created. They can now sign in on /login.` });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleProgram = async (program) => {
    if (!selectedJudgeId) return;
    const currentJudges = Array.isArray(program.judgeIds) ? program.judgeIds.map(String) : [];
    const targetId = String(selectedJudgeId);
    const exists = currentJudges.includes(targetId);
    const updatedJudgeIds = exists
      ? currentJudges.filter((id) => id !== targetId)
      : [...currentJudges, targetId];

    setBusy(true);
    setNotice({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/programs/${program.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ judgeIds: updatedJudgeIds }),
      });
      if (!res.ok) throw new Error('Could not update program judge assignment.');
      if (onProgramsUpdated) await onProgramsUpdated();
      setNotice({
        type: 'ok',
        text: exists
          ? `Removed judge from "${program.name}".`
          : `Assigned judge to "${program.name}".`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteJudge = async (judge) => {
    if (!window.confirm(`Remove judge ${judge.name}?`)) return;
    setBusy(true);
    setNotice({ type: '', text: '' });
    try {
      // Remove judge ID from any assigned programs first
      const assigned = programs.filter((p) =>
        (p.judgeIds || []).some((jid) => sameId(jid, judge.id))
      );
      await Promise.all(
        assigned.map((p) =>
          fetch(`${API_BASE}/programs/${p.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders(),
            },
            body: JSON.stringify({
              judgeIds: (p.judgeIds || []).filter((jid) => !sameId(jid, judge.id)),
            }),
          })
        )
      );

      const res = await fetch(`${API_BASE}/users/${judge.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Could not delete judge account.');
      if (onProgramsUpdated) await onProgramsUpdated();
      await loadJudges();
      setNotice({ type: 'ok', text: `Judge "${judge.name}" removed.` });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const festPrograms = programs.filter((p) =>
    selectedFestId ? sameId(p.festId, selectedFestId) : true
  );
  const selectedJudge = judges.find((j) => sameId(j.id, selectedJudgeId)) || null;

  return (
    <div className="space-y-6">
      {notice.text && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-xs font-bold ${
            notice.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 1. Create Judge Account */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#072C31] text-[#F5A623]">
            <UserPlus size={20} />
          </div>
          <div>
            <h2 className="fest-display text-lg font-extrabold text-[#072C31]">
              Create Judge Account
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Create login credentials for an external or internal judge. They sign in at /login using their email and password.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateJudge} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Judge Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Meera Nair"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#072C31] focus:ring-2 focus:ring-[#072C31]/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Judge Email</label>
            <input
              type="email"
              placeholder="e.g. judge1@campusfest.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#072C31] focus:ring-2 focus:ring-[#072C31]/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Login Password</label>
            <input
              type="text"
              placeholder="e.g. Judge@2026"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#072C31] focus:ring-2 focus:ring-[#072C31]/10"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#072C31] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0D3D44] disabled:opacity-50"
            >
              <Save size={16} />
              {busy ? 'Saving...' : 'Create Judge'}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Assign Programs to Selected Judge */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3D6] text-[#C47A08]">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="fest-display text-lg font-extrabold text-[#072C31]">
                Assign Programs to Judge
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Each judge only sees and enters marks for the programs checked below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedJudgeId}
              onChange={(e) => setSelectedJudgeId(e.target.value)}
              disabled={judges.length === 0}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#072C31] outline-none focus:border-[#072C31]"
            >
              {judges.length === 0 ? (
                <option value="">-- Create a judge first --</option>
              ) : (
                judges.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.email})
                  </option>
                ))
              )}
            </select>

            {fests.length > 0 && (
              <select
                value={selectedFestId}
                onChange={(e) => setSelectedFestId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#072C31] outline-none focus:border-[#072C31]"
              >
                {fests.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {!selectedJudge ? (
          <p className="rounded-xl border border-slate-200 bg-[#F5F8F8] p-6 text-center text-xs text-slate-500">
            Create a judge above to start assigning programs.
          </p>
        ) : festPrograms.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-[#F5F8F8] p-6 text-center text-xs text-slate-500">
            No programs found for this fest yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {festPrograms.map((prog) => {
              const isAssigned = (prog.judgeIds || []).some((jid) => sameId(jid, selectedJudge.id));
              return (
                <button
                  key={prog.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggleProgram(prog)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition ${
                    isAssigned
                      ? 'border-[#072C31] bg-[#E6F1F2] text-[#072C31]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-[#F5F8F8]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p className="truncate text-sm font-bold">{prog.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {prog.kind === 'group' ? 'Group Event' : 'Single Event'}
                    </p>
                  </div>
                  {isAssigned ? (
                    <CheckSquare size={20} className="shrink-0 text-[#072C31]" />
                  ) : (
                    <Square size={20} className="shrink-0 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Active Judges Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
          <h3 className="fest-display text-base font-extrabold text-[#072C31]">
            Registered Judges ({judges.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-bold">Judge Name</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Assigned Programs</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {judges.map((j) => {
                const assignedList = programs.filter((p) =>
                  (p.judgeIds || []).some((jid) => sameId(jid, j.id))
                );
                return (
                  <tr key={j.id} className="hover:bg-[#F5F8F8]">
                    <td className="px-4 py-3 font-bold text-[#072C31]">{j.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{j.email}</td>
                    <td className="px-4 py-3">
                      {assignedList.length === 0 ? (
                        <span className="text-xs text-slate-400">No programs assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedList.map((p) => (
                            <span
                              key={p.id}
                              className="rounded-full bg-[#E6F1F2] px-2.5 py-0.5 text-[11px] font-semibold text-[#072C31]"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteJudge(j)}
                        aria-label={`Delete ${j.name}`}
                        className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {judges.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-xs text-slate-400">
                    No judges created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}