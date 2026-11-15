import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

export default function MyProgramsTab({ myPrograms = [] }) {
  if (myPrograms.length === 0) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="fest-display font-bold text-[#0B3F46] mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-[#0B3F46]" /> My Registered Programs
      </h3>

      <div className="space-y-3 text-xs">
        {myPrograms.map((prog) => (
          <div
            key={prog.id}
            className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 border border-slate-200"
          >
            <div>
              <span className="font-bold text-slate-800 block text-sm">{prog.eventName}</span>
              <span className="text-[11px] text-slate-500">
                {prog.eventType} Event · {prog.role}{prog.festName ? ` · ${prog.festName}` : ''}
              </span>
            </div>

            <span
              className={`rounded-full px-3 py-1 font-semibold flex items-center gap-1 border ${
                prog.status !== 'Pending Submission'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {prog.status !== 'Pending Submission' && <CheckCircle2 className="h-3.5 w-3.5" />}
              {prog.status !== 'Pending Submission' ? 'Registered' : 'Pending Submission'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}