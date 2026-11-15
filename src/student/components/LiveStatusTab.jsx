import React from 'react';
import { Radio, Clock } from 'lucide-react';

export default function LiveStatusTab() {
  const stagePrograms = [
    { id: 1, name: 'Classical Dance (Solo)', stage: 'Stage 1 - Main Auditorium', status: 'Running Now', currentParticipant: 'Ananya S. (ECE)' },
    { id: 2, name: 'English Recitation', stage: 'Stage 2 - Seminar Hall', status: 'Up Next', currentParticipant: 'Rahul V. (CSE)' },
    { id: 3, name: 'Light Music (Solo)', stage: 'Stage 1 - Main Auditorium', status: 'Completed', result: '1st: Diya M. (EEE) · 2nd: Karthik R. (ME)' },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <h3 className="fest-display font-bold text-[#0B3F46] flex items-center gap-2">
          <Radio className="h-5 w-5 text-[#D6336C] animate-pulse" /> Live Stage Status & Results Board
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-200">
          🔴 Live Feed
        </span>
      </div>

      <div className="space-y-3">
        {stagePrograms.map((prog) => (
          <div key={prog.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm block">{prog.name}</span>
              <span className="text-slate-500 font-medium">{prog.stage}</span>
              {prog.currentParticipant && (
                <p className="text-xs text-[#0B3F46] mt-1 font-semibold">On Stage Now: {prog.currentParticipant}</p>
              )}
              {prog.result && (
                <p className="text-xs text-emerald-800 mt-1 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                  🏆 Results: {prog.result}
                </p>
              )}
            </div>

            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                prog.status === 'Running Now' ? 'bg-red-50 text-red-700 border border-red-200' :
                prog.status === 'Up Next' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {prog.status === 'Running Now' && <Clock size={12} className="animate-spin" />}
                {prog.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}