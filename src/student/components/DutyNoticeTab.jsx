import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DutyNoticeTab({ assignedDuty, student }) {
  const task =
    typeof assignedDuty === 'object' && assignedDuty !== null
      ? assignedDuty.task
      : assignedDuty || student?.assignedDuty;

  if (!task) return null;

  const time =
    (typeof assignedDuty === 'object' && assignedDuty?.time) ||
    student?.dutyTime ||
    'During Fest Hours';

  const committeeOrLocation =
    (typeof assignedDuty === 'object' && assignedDuty?.committee) ||
    student?.dutyLocation ||
    'Volunteer Committee';

  const assignedBy = student?.dutyAssignedBy;

  return (
    <div className="rounded-2xl border-2 border-[#F5A623] bg-[#FFF8E9] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-xl bg-[#F5A623] p-2.5 text-[#2A1A00]">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="fest-display font-bold text-[#0B3F46] text-base">
            Committee Duty Assignment Notice
          </h3>
          <p className="text-xs text-slate-600">
            Assigned by {assignedBy ? `${assignedBy} (Volunteer Committee)` : 'committee management for your event'}.
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-white p-4 border border-amber-200/60 text-sm space-y-1.5">
        <p className="font-semibold text-slate-800">Task: {task}</p>
        <p className="text-xs text-slate-500">
          Scheduled Time: <span className="font-medium text-[#0B3F46]">{time}</span>
        </p>
        <p className="text-xs text-slate-500">
          Committee / Location: <span className="font-semibold text-[#D6336C]">{committeeOrLocation}</span>
        </p>
      </div>
    </div>
  );
}