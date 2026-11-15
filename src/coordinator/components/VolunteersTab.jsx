import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function VolunteersTab({
  volunteers,
  volName,
  setVolName,
  volRole,
  setVolRole,
  volClass,
  setVolClass,
  handleAddVolunteer,
  handleDeleteVolunteer,
  dept,
  cardStyle,
  inputStyle,
  primaryButton,
}) {
  return (
    <div className="space-y-6">
      <section className={`${cardStyle} p-6`}>
        <h2 className="fest-display mb-4 font-bold text-[#0B3F46]">Register Department Volunteers ({dept})</h2>
        <form onSubmit={handleAddVolunteer} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input type="text" placeholder="Volunteer Name" value={volName} onChange={(e) => setVolName(e.target.value)} className={inputStyle} required />
          <input type="text" placeholder="Assigned Role" value={volRole} onChange={(e) => setVolRole(e.target.value)} className={inputStyle} required />
          <input type="text" placeholder={`Class (e.g. 3rd Year ${dept})`} value={volClass} onChange={(e) => setVolClass(e.target.value)} className={inputStyle} required />
          <div className="sm:col-span-3">
            <button type="submit" className={primaryButton}>
              <Plus className="h-4 w-4" /> Add Volunteer
            </button>
          </div>
        </form>
      </section>

      <div className={`${cardStyle} p-6`}>
        <h3 className="fest-display mb-4 font-bold text-[#0B3F46]">Volunteer Roster ({dept})</h3>
        <div className="space-y-2">
          {volunteers.map((v) => (
            <div key={v.id} className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:flex-row sm:items-center">
              <div>
                <span className="font-semibold text-slate-800">{v.name}</span> — <span className="text-[#0B3F46]">{v.role}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-500">{v.classSection}</span>
                <button type="button" onClick={() => handleDeleteVolunteer(v.id)} className="text-rose-500 hover:text-rose-700" aria-label="Delete volunteer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {volunteers.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400">No volunteers registered for {dept} yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}