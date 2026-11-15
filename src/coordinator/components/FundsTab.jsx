import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert';

export default function FundsTab({
  teacherNotice,
  teacherError,
  loadError,
  myFests,
  selectedFestId,
  setSelectedFestId,
  setProgramPick,
  setFundInput,
  setTeacherError,
  setTeacherNotice,
  selectedFest,
  deptFund,
  fundInput,
  handleSaveFund,
  totalCollected,
  sectionInput,
  setSectionInput,
  handleAddSection,
  deptSections,
  sectionStats,
  classTeacherOfSection,
  handleDeleteSection,
  busy,
  dept,
  cardStyle,
  inputStyle,
  smallButton,
}) {
  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError} />

      {myFests.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          You have not been appointed as coordinator for any fest yet, so a fest fund cannot be set. Ask the Fest Committee Admin to add you. You can still create classes below.
        </p>
      ) : (
        <section className={`${cardStyle} p-5`}>
          <div className="w-full max-w-sm">
            <label htmlFor="fundFest" className="mb-1.5 block text-xs font-semibold text-slate-600">Fest</label>
            <select
              id="fundFest"
              value={selectedFestId}
              onChange={(e) => {
                setSelectedFestId(e.target.value);
                setProgramPick({});
                setFundInput('');
                setTeacherError('');
                setTeacherNotice('');
              }}
              className={inputStyle}
            >
              {myFests.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-slate-500">Each fest has its own fund amount and its own payments. Switch the fest to see or change another one.</p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${cardStyle} p-6`}>
          <h2 className="fest-display font-bold text-[#0B3F46]">
            Fest fund per student ({dept}){selectedFest ? ` · ${selectedFest.name}` : ''}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Every student of {dept} pays this amount for this fest from their own dashboard.</p>
          <p className="mt-4 font-mono text-3xl font-bold text-[#0E4D55]">
            {deptFund ? `₹${deptFund.amount}` : 'Not set'}
          </p>
          <form onSubmit={handleSaveFund} className="mt-4 flex gap-2">
            <input
              type="number"
              min="1"
              placeholder={deptFund ? 'New amount (₹)' : 'Amount (₹)'}
              value={fundInput}
              onChange={(e) => setFundInput(e.target.value)}
              className={inputStyle}
              disabled={!selectedFest}
            />
            <button type="submit" disabled={busy || !selectedFest} className={smallButton}>
              {deptFund ? 'Update' : 'Set'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="fest-display font-bold text-[#0B3F46]">
            Collected so far{selectedFest ? ` · ${selectedFest.name}` : ''}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Calculated from student payments.</p>
          <p className="mt-4 font-mono text-3xl font-bold text-[#0E4D55]">₹{totalCollected}</p>
        </section>
      </div>

      <section className={`${cardStyle} overflow-hidden`}>
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h2 className="fest-display font-bold text-[#0B3F46]">Classes of {dept}</h2>
          <p className="mt-1 text-xs text-slate-500">Create each class here first.</p>
          <form onSubmit={handleAddSection} className="mt-4 flex max-w-md gap-2">
            <input
              type="text"
              placeholder="e.g. S6 CSE - A"
              value={sectionInput}
              onChange={(e) => setSectionInput(e.target.value)}
              className={inputStyle}
            />
            <button type="submit" disabled={busy} className={smallButton}>
              <Plus className="h-3.5 w-3.5 text-[#F5A623]" /> Add
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                <th className="p-4">Class</th>
                <th className="p-4">Class teacher</th>
                <th className="p-4">Students</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Collected</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptSections.map((sec) => {
                const st = sectionStats(sec);
                const ct = classTeacherOfSection(sec.name);
                return (
                  <tr key={sec.id} className="hover:bg-[#F5F8F8]">
                    <td className="p-4 font-semibold text-[#0B3F46]">{sec.name}</td>
                    <td className="p-4 text-slate-600">{ct ? ct.name : <span className="italic text-slate-400">Not assigned</span>}</td>
                    <td className="p-4 text-slate-600">{st.total}</td>
                    <td className="p-4 text-slate-600">{st.paid}/{st.total}</td>
                    <td className="p-4 font-mono font-bold text-[#0E4D55]">₹{st.collected}</td>
                    <td className="p-4 text-right">
                      <button type="button" disabled={busy} onClick={() => handleDeleteSection(sec)} aria-label={`Delete ${sec.name}`} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}