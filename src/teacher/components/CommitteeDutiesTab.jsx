import React from 'react';
import { BadgeCheck } from 'lucide-react';

export default function CommitteeDutiesTab({ committeeDuties = [] }) {
  if (committeeDuties.length === 0) return null;
  return (
    <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 bg-[#FFF3D6] text-[#C47A08] rounded-xl flex items-center justify-center">
          <BadgeCheck size={21} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#0B3F46]">Fest Committee Assigned Duties</h2>
          <p className="text-xs text-[#718589] mt-1">Official responsibilities allocated to you by the fest committee.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committeeDuties.map((duty) => (
          <div key={duty.id} className="bg-[#F8FAFA] border border-[#DCE7E7] rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#E6F1F2] text-[#0B6870]">
                  {duty.committee}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {duty.status}
                </span>
              </div>
              <p className="text-sm font-extrabold text-[#0B3F46] mt-1">{duty.role}</p>
            </div>
            <p className="text-xs text-[#718589] mt-4 pt-3 border-t border-[#EDF1F1] flex items-center gap-1.5">
              🕒 Timing: <span className="font-bold text-[#173B40]">{duty.timing}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}