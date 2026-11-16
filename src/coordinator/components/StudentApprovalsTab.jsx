import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert';
import { normalizeDept } from '../../utils/deptKeys';
import { LIST_CHECK } from '../../utils/classList';

export default function StudentApprovalsTab({
  teacherNotice,
  teacherError,
  loadError,
  users = [],
  run,
  request,
  busy,
  dept,
  coordinatorName = 'Coordinator',
  cardStyle,
}) {
  const deptKey = normalizeDept(dept);
  const list = Array.isArray(users) ? users : [];

  // Same department matching as the rest of the dashboard (not an exact text comparison)
  const pendingStudents = list.filter(
    (u) => u.baseType === 'student' && u.approved === false && !u.rejected && normalizeDept(u.department || '') === deptKey
  );

  const classTeacherOf = (section) =>
    list.find(
      (t) =>
        t.baseType === 'teacher' &&
        t.approved !== false &&
        !t.rejected &&
        (t.duties || []).includes('class_teacher') &&
        t.classSection === section &&
        normalizeDept(t.department || '') === deptKey
    );

  // Classes with no class teacher first: those need the coordinator most
  const sorted = pendingStudents
    .slice()
    .sort((a, b) => Number(!!classTeacherOf(a.classSection)) - Number(!!classTeacherOf(b.classSection)));

  const handleApprove = async (student) => {
    await run(
      () => request(`/users/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          approved: true,
          rejected: false,
          approvalMethod: 'coordinator',
          approvedBy: coordinatorName,
          approvedAt: new Date().toISOString(),
        }),
      }),
      `${student.name} approved.`
    );
  };

  const handleReject = async (student) => {
    if (!window.confirm(`Reject the registration of ${student.name}?`)) return;
    await run(
      () => request(`/users/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ approved: false, rejected: true, rejectedBy: coordinatorName }),
      }),
      `${student.name} rejected.`
    );
  };

  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError} />

      <section className={`${cardStyle} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="fest-display font-bold text-[#0B3F46]">Pending Student Approvals ({dept})</h2>
            <p className="mt-1 text-xs text-slate-500">
              Class teachers approve their own students. Use this list for classes that have no class teacher yet, or as a backup.
            </p>
          </div>
          <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
            {pendingStudents.length} Pending
          </span>
        </div>

        {sorted.length === 0 ? (
          <p className="p-10 text-center text-xs text-slate-500">No pending student approvals at this time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="p-4">Name & Register No</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Class teacher</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((student) => {
                  const ct = classTeacherOf(student.classSection);
                  const check = LIST_CHECK[student.listCheck];
                  const isVol = student.role === 'volunteer' || (student.duties || []).includes('volunteer');
                  return (
                    <tr key={student.id} className="hover:bg-[#F5F8F8]">
                      <td className="p-4">
                        <div className="font-semibold text-[#0B3F46]">{student.name}</div>
                        <div className="font-mono text-xs text-slate-500">{student.registerNo || 'N/A'}</div>
                        {student.email && <div className="text-xs text-slate-500">{student.email}</div>}
                        {check && (
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${check.tone}`}>
                            {check.text}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-medium text-[#0E4D55]">{student.classSection || 'Not specified'}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          {isVol ? 'Volunteer' : 'Student'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        {ct ? ct.name : <span className="font-semibold text-amber-700">No class teacher yet</span>}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleApprove(student)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleReject(student)}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}