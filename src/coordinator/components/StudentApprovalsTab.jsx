import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert';

export default function StudentApprovalsTab({
  teacherNotice,
  teacherError,
  loadError,
  users = [], // Default to an empty array to prevent undefined errors
  run,
  request,
  dept,
  cardStyle,
}) {
  // Safely filter pending students belonging to this department
  const pendingStudents = Array.isArray(users)
    ? users.filter(
        (u) => u.baseType === 'student' && u.approved === false && u.department === dept
      )
    : [];

  const handleApprove = async (studentId) => {
    await run(
      () => request(`/users/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, rejected: false }),
      }),
      'Student approved successfully.'
    );
  };

  const handleReject = async (studentId) => {
    if (!window.confirm('Reject this student registration?')) return;
    await run(
      () => request(`/users/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, rejected: true }),
      }),
      'Student registration rejected.'
    );
  };

  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError} />

      <section className={`${cardStyle} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="fest-display font-bold text-[#0B3F46]">Pending Student Approvals ({dept})</h2>
            <p className="mt-1 text-xs text-slate-500">Approve or reject student registrations waiting for review.</p>
          </div>
          <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
            {pendingStudents.length} Pending
          </span>
        </div>

        {pendingStudents.length === 0 ? (
          <p className="p-10 text-center text-xs text-slate-500">No pending student approvals at this time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="p-4">Name</th>
                  <th className="p-4">Register No</th>
                  <th className="p-4">Class Section</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F5F8F8]">
                    <td className="p-4 font-semibold text-[#0B3F46]">{student.name}</td>
                    <td className="p-4 font-mono text-slate-600">{student.registerNo || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{student.classSection || 'Not specified'}</td>
                    <td className="p-4 text-slate-600">{student.email}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(student.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(student.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}