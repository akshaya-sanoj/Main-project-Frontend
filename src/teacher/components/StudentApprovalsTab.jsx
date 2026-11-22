import React from 'react';
import { BadgeCheck } from 'lucide-react';

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
  ({
    class_list: 'Approved by class list',
    class_teacher: 'Approved by class teacher',
    coordinator: 'Approved by coordinator',
  }[u.approvalMethod] || 'Approved');

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
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF3D6] text-[#C47A08]">
          <BadgeCheck size={21} />
        </div>
        <div>
          <h2 className="fest-display text-lg font-extrabold text-[#072C31]">Student Approvals · {classSection}</h2>
          <p className="mt-1 text-xs text-slate-500">
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

      {/* Pending Students Table */}
      {pendingStudents.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-[#F5F8F8] p-4 text-center text-xs text-slate-500">
          No students are waiting for your approval.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-bold">#</th>
                <th className="px-4 py-3 font-bold">Student</th>
                <th className="px-4 py-3 font-bold">Register No</th>
                <th className="px-4 py-3 font-bold">List Verification</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingStudents.map((stu, idx) => {
                const isVol = stu.role === 'volunteer' || (stu.duties || []).includes('volunteer');
                return (
                  <tr key={stu.id} className="transition hover:bg-[#F5F8F8]">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#072C31]">
                        {stu.name}
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {isVol ? 'Volunteer' : 'Student'}
                        </span>
                      </p>
                      {stu.email && <p className="text-xs text-slate-500">{stu.email}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {stu.registerNo || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {listCheckBadge(stu) || (
                        <span className="text-xs text-slate-400">Manual review</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          disabled={approvalBusy}
                          onClick={() => handleDecideStudent(stu, true)}
                          className="rounded-xl bg-[#072C31] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0D3D44] disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={approvalBusy}
                          onClick={() => handleDecideStudent(stu, false)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#D6336C] transition hover:bg-[#FCE7EF] disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Approved Students Section (Always Visible Table) */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="fest-display text-sm font-extrabold text-[#072C31]">
              All Approved Students in {classSection}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              If someone registered with another student&apos;s number, remove that account. The real student can then register again.
            </p>
          </div>
          <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#072C31]">
            {classStudents.length} {classStudents.length === 1 ? 'student' : 'students'}
          </span>
        </div>

        {classStudents.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-[#F5F8F8] p-4 text-center text-xs text-slate-400">
            No approved students yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[580px] text-left text-sm">
              <thead>
                <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-bold">#</th>
                  <th className="px-4 py-3 font-bold">Student Name</th>
                  <th className="px-4 py-3 font-bold">Register No</th>
                  <th className="px-4 py-3 font-bold">Approval Status</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((stu, idx) => (
                  <tr key={stu.id} className="transition hover:bg-[#F5F8F8]">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#072C31]">
                      {stu.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {stu.registerNo || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        {approvalTag(stu)}
                      </span>
                      {listCheckBadge(stu)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={approvalBusy}
                        onClick={() => handleRemoveStudentAccount(stu)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        Remove account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}