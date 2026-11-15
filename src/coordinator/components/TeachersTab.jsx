import React from 'react';
import { Plus, X } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert';
import DeptStaffList from '../../components/DeptStaffList';


const DUTY_LABELS = {
  dept_coordinator: 'Coordinator',
  class_teacher: 'Class teacher',
  program_teacher: 'Program teacher',
  volunteer: 'Volunteer',
};

const squash = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function TeachersTab({
  teacherNotice,
  teacherError,
  loadError,
  myFests,
  selectedFestId,
  setSelectedFestId,
  setProgramPick,
  setTeacherError,
  setTeacherNotice,
  selectedFest,
  publishedPrograms,
  deptTeachers,
  programsOfTeacher,
  isClassTeacher,
  classInputs,
  setClassInputs,
  freeSections,
  handleSetClassTeacher,
  handleRemoveClassTeacher,
  handleAssignProgram,
  handleUnassignProgram,
  programPick,
  busy,
  dept,
  cardStyle,
  inputStyle,
  smallButton,
  staffLists = [],
}) {
  // Only flag teachers once the committee has actually uploaded a staff list
  const hasStaffList = staffLists.length > 0;
  const isOnStaffList = (t) => staffLists.some((s) => squash(s.staffId) === squash(t.staffId));

  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError} />

      {myFests.length === 0 && !loadError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          You have not been appointed as coordinator for any fest yet. Ask the Fest Committee Admin to add you. You can still set class teachers.
        </p>
      ) : (
        <section className={`${cardStyle} p-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-sm">
              <label htmlFor="coordFest" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Fest
              </label>
              <select
                id="coordFest"
                value={selectedFestId}
                onChange={(e) => {
                  setSelectedFestId(e.target.value);
                  setProgramPick({});
                  setTeacherError('');
                  setTeacherNotice('');
                }}
                className={inputStyle}
              >
                {myFests.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            {selectedFest && (
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                selectedFest.published ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FDEFD3] text-[#5C3B00]'
              }`}>
                {selectedFest.published ? 'Programs published' : 'Programs not published yet'}
              </span>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Program duties below are for the selected fest only. Class teachers stay the same across fests.
          </p>
          {selectedFest && publishedPrograms.length === 0 && !loadError && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              {selectedFest.published ? 'This fest has no programs yet.' : 'The admin has not published this fest\'s program list yet, so program duties cannot be assigned.'}
            </p>
          )}
        </section>
      )}

      {/* Staff the fest committee has listed for this department */}
      <DeptStaffList department={dept} />

      <section className={`${cardStyle} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="fest-display font-bold text-[#0B3F46]">Approved Teachers ({dept})</h2>
            <p className="mt-1 text-xs text-slate-500">Only teachers of your department who the admin has approved appear here.</p>
          </div>
          <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
            {deptTeachers.length} {deptTeachers.length === 1 ? 'Teacher' : 'Teachers'}
          </span>
        </div>

        {deptTeachers.length === 0 ? (
          <p className="p-10 text-center text-xs text-slate-500">
            No approved teachers in {dept} yet. Teachers appear here after they register and the admin approves them.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {deptTeachers.map((t) => {
              const myPrograms = programsOfTeacher(t.id);
              const classTeacher = isClassTeacher(t);
              const duties = Array.from(new Set([
                ...(t.duties || []).filter((d) => d !== 'teacher'),
                ...(myPrograms.length > 0 ? ['program_teacher'] : []),
              ]));
              const notOnList = hasStaffList && t.staffId && !isOnStaffList(t);

              return (
                <li key={t.id} className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#0B3F46]">{t.name}</p>
                      <p className="text-xs text-slate-500">
                        {t.staffId ? `ID ${t.staffId}` : 'ID pending'}{t.email ? ` · ${t.email}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {notOnList && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          Not on staff list
                        </span>
                      )}
                      {duties.length === 0 ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">No duties yet</span>
                      ) : (
                        duties.map((d) => (
                          <span key={d} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                            {DUTY_LABELS[d] || d}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Class teacher duty</h3>
                      {classTeacher ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[#0B3F46]">Class teacher of {t.classSection}</p>
                          <button type="button" disabled={busy} onClick={() => handleRemoveClassTeacher(t)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            aria-label={`Class for ${t.name}`}
                            value={classInputs[t.id] || ''}
                            onChange={(e) => setClassInputs((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            className={inputStyle}
                            disabled={freeSections.length === 0}
                          >
                            <option value="">{freeSections.length === 0 ? 'No free classes' : 'Choose a class'}</option>
                            {freeSections.map((sec) => (
                              <option key={sec.id} value={sec.name}>{sec.name}</option>
                            ))}
                          </select>
                          <button type="button" disabled={busy} onClick={() => handleSetClassTeacher(t)} className={smallButton}>Set</button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Program data entry</h3>
                      {myPrograms.length > 0 && (
                        <ul className="mb-3 flex flex-wrap gap-2">
                          {myPrograms.map((p) => (
                            <li key={p.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-xs font-semibold text-[#0B3F46]">
                              {p.name}
                              <button type="button" disabled={busy} onClick={() => handleUnassignProgram(t, p)} aria-label={`Remove ${t.name} from ${p.name}`} className="rounded-full p-1 text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                                <X className="h-3 w-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2">
                        <select
                          aria-label={`Program for ${t.name}`}
                          value={programPick[t.id] || ''}
                          onChange={(e) => setProgramPick((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          className={inputStyle}
                          disabled={publishedPrograms.length === 0}
                        >
                          <option value="">Choose a program</option>
                          {publishedPrograms.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <button type="button" disabled={busy || publishedPrograms.length === 0} onClick={() => handleAssignProgram(t)} className={smallButton}>
                          <Plus className="h-3.5 w-3.5 text-[#F5A623]" /> Assign
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}