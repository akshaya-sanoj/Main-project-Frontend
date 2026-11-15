import React from 'react';
import { BadgeCheck, CheckCircle2 } from 'lucide-react';

const LIST_CHECK = {
  dob_mismatch: { text: 'On the class list, but the date of birth did not match. Check carefully.', tone: 'bg-rose-50 text-rose-700' },
  other_class: { text: "Register number is on another class's list.", tone: 'bg-amber-50 text-amber-800' },
  not_on_list: { text: 'Not on the class list.', tone: 'bg-slate-100 text-slate-500' },
  unchecked: { text: 'Date of birth could not be checked.', tone: 'bg-slate-100 text-slate-500' },
};
const listCheckBadge = (u) => {
  const c = LIST_CHECK[u.listCheck];
  return c ? (
    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.tone}`}>{c.text}</span>
  ) : null;
};
const approvalTag = (u) =>
  ({ class_list: 'Approved by class list', class_teacher: 'Approved by class teacher', coordinator: 'Approved by coordinator' }[u.approvalMethod] || 'Approved');

export default function StudentApprovalsTab({
  classSection,
  pendingStudents = [],
  classStudents = [],
  fundMessage,
  approvalBusy,
  handleDecideStudent,
  handleRemoveStudentAccount,
}) {
  return (
    <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 bg-[#FFF3D6] text-[#C47A08] rounded-xl flex items-center justify-center">
          <BadgeCheck size={21} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#0B3F46]">Student Approvals · {classSection}</h2>
          <p className="text-xs text-[#718589] mt-1">
            Students whose register number is on your class list are approved automatically. The others wait here for you.
          </p>
        </div>
      </div>

      {fundMessage.text && (
        <p
          role={fundMessage.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 rounded-xl border px-4 py-3 text-xs font-bold ${
            fundMessage.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          {fundMessage.text}
        </p>
      )}

      {pendingStudents.length === 0 ? (
        <p className="rounded-xl bg-[#F8FAFA] border border-[#DCE7E7] p-4 text-center text-xs text-[#718589]">
          No students are waiting for your approval.
        </p>
      ) : (
        <ul className="divide-y divide-[#EDF1F1]">
          {pendingStudents.map((stu) => {
            const isVol = stu.role === 'volunteer' || (stu.duties || []).includes('volunteer');
            return (
              <li key={stu.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-sm text-[#173B40]">
                    {stu.name}
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {isVol ? 'Volunteer' : 'Student'}
                    </span>
                  </p>
                  <p className="text-xs text-[#718589] font-mono">
                    Reg: {stu.registerNo || '—'}{stu.email ? ` · ${stu.email}` : ''}
                  </p>
                  {listCheckBadge(stu)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={approvalBusy}
                    onClick={() => handleDecideStudent(stu, true)}
                    className="rounded-xl bg-[#0B3F46] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B6870] disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={approvalBusy}
                    onClick={() => handleDecideStudent(stu, false)}
                    className="rounded-xl border border-[#DCE7E7] bg-white px-4 py-2 text-xs font-bold text-[#D6336C] hover:bg-[#FCE7EF] disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-5 rounded-xl border border-[#DCE7E7] bg-[#F8FAFA] p-4">
        <summary className="cursor-pointer text-xs font-bold text-[#0B3F46]">
          All approved students in {classSection} ({classStudents.length})
        </summary>
        <p className="mt-2 text-xs text-[#718589]">
          If someone registered with another student's number, remove that account. The real student can then register again.
        </p>
        <ul className="mt-3 divide-y divide-[#EDF1F1]">
          {classStudents.map((stu) => (
            <li key={stu.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#173B40]">{stu.name}</p>
                <p className="text-xs text-[#718589] font-mono">
                  Reg: {stu.registerNo || '—'} · {approvalTag(stu)}
                </p>
                {listCheckBadge(stu)}
              </div>
              <button
                type="button"
                disabled={approvalBusy}
                onClick={() => handleRemoveStudentAccount(stu)}
                className="w-fit rounded-lg border border-[#DCE7E7] bg-white px-3 py-1.5 text-xs font-bold text-[#D6336C] hover:bg-[#FCE7EF] disabled:opacity-60"
              >
                Remove account
              </button>
            </li>
          ))}
          {classStudents.length === 0 && (
            <li className="py-3 text-xs text-[#91A1A3]">No approved students yet.</li>
          )}
        </ul>
      </details>
    </section>
  );
}