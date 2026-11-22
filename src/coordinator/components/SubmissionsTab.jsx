import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert';

export default function SubmissionsTab({
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
  loadAll,
  handleForwardToAdmin,
  toForward,
  forwardedCount,
  teacherSubmissions,
  busy,
  dept,
  cardStyle,
  inputStyle,
}) {
  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError} />

      {myFests.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          You have not been appointed as coordinator for any fest yet, so there are no Lists to show.
        </p>
      ) : (
        <section className={`${cardStyle} p-5`}>
          <div className="w-full max-w-sm">
            <label htmlFor="subFest" className="mb-1.5 block text-xs font-semibold text-slate-600">Fest</label>
            <select
              id="subFest"
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
        </section>
      )}

      <div className={`${cardStyle} p-6 sm:p-8`}>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="fest-display text-lg font-bold text-[#0B3F46]">
              Submitted Teacher Lists ({dept}){selectedFest ? ` · ${selectedFest.name}` : ''}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Review student lists sent by your teachers, then forward them to the Admin.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadAll().catch((e) => setTeacherError(e.message))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-[#0B3F46] hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleForwardToAdmin}
              disabled={busy || !selectedFest || toForward.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-[#F5A623]" />
              {toForward.length > 0
                ? `Forward ${toForward.length} ${toForward.length === 1 ? 'entry' : 'entries'} to Admin`
                : forwardedCount > 0
                  ? 'All forwarded to Admin ✓'
                  : 'Nothing to forward'}
            </button>
          </div>
        </div>

        {forwardedCount > 0 && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900">
            <CheckCircle2 size={16} className="text-emerald-700" />
            {forwardedCount} {forwardedCount === 1 ? 'entry has' : 'entries have'} already been forwarded to the Super Admin.
          </div>
        )}

        {teacherSubmissions.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No teacher Lists have been submitted to your department for this fest yet.</p>
        ) : (
          <div className="space-y-4">
            {teacherSubmissions.map((sub, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-sm font-bold text-[#0B3F46]">Faculty: {sub.teacherName}</span>
                  <span className="text-xs text-slate-500">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''}</span>
                </div>
                <div className="space-y-2">
                  {sub.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{p.studentName}</span> ({p.studentId}) — <span className="font-semibold text-[#0E4D55]">{p.eventName}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 font-bold ${
                        p.status === 'Forwarded to Admin' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {p.status === 'Forwarded to Admin' ? 'Forwarded to Admin' : 'Waiting to forward'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}