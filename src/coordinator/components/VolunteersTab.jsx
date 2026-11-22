import React from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert';

export default function VolunteersTab({
  teacherNotice,
  teacherError,
  loadError,
  deptStudents = [],
  committeeStudents = [],
  selectedStudentId,
  setSelectedStudentId,
  volRole,
  setVolRole,
  handleContributeVolunteer,
  handleRemoveVolunteer,
  busy = false,
  dept,
  cardStyle,
  inputStyle,
  primaryButton,
}) {
  const alreadyIds = new Set(committeeStudents.map((s) => String(s.id)));
  const availableStudents = deptStudents.filter((s) => !alreadyIds.has(String(s.id)));

  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError} />

      <section className={`${cardStyle} p-6`}>
        <h2 className="fest-display mb-1 font-bold text-[#0B3F46]">
          Contribute to Volunteer Committee ({dept})
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Select approved students from {dept} to join the Volunteer Committee so the Volunteer Head can assign them duties.
        </p>

        <form onSubmit={handleContributeVolunteer} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="vcDeptStudent" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Student ({dept})
            </label>
            <select
              id="vcDeptStudent"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className={inputStyle}
              required
            >
              <option value="">-- Choose a {dept} student --</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.registerNo ? `(${s.registerNo})` : ''} {s.classSection ? `· ${s.classSection}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vcCommitteeRole" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Preferred Area / Note (optional)
            </label>
            <input
              id="vcCommitteeRole"
              type="text"
              placeholder="e.g. Stage & Crowd Support"
              value={volRole}
              onChange={(e) => setVolRole(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" disabled={busy || availableStudents.length === 0} className={primaryButton}>
              <UserPlus className="h-4 w-4" /> {busy ? 'Adding...' : 'Contribute Student to Committee'}
            </button>
          </div>
        </form>
      </section>

      <div className={`${cardStyle} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="fest-display font-bold text-[#0B3F46]">
            Contributed Volunteer Committee Members ({dept})
          </h3>
          <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
            {committeeStudents.length}
          </span>
        </div>

        <div className="space-y-2">
          {committeeStudents.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:flex-row sm:items-center"
            >
              <div>
                <span className="font-semibold text-slate-800">{s.name}</span>
                {s.registerNo && <span className="ml-2 font-mono text-slate-500">({s.registerNo})</span>}
                {s.volunteerNote && (
                  <span className="ml-2 text-[#0B3F46]">— {s.volunteerNote}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600">
                  {s.assignedDuty ? `Duty: ${s.assignedDuty}` : s.classSection || dept}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemoveVolunteer(s)}
                  className="text-rose-500 hover:text-rose-700 disabled:opacity-50"
                  aria-label={`Remove ${s.name} from Volunteer Committee`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {committeeStudents.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400">
              No students from {dept} contributed to the Volunteer Committee yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}