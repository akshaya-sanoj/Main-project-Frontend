import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { groupByFest, fmtDateTime } from './rosterGroups';

/*
 * The body of the "Department Submissions" tab: one card per fest.
 * Clicking a card opens /admin/submissions/:festId (FestListDetail).
 */
export default function SubmissionsFestCards({ registrations, onRefresh }) {
  const navigate = useNavigate();
  const fests = useMemo(() => groupByFest(registrations), [registrations]);

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]"><Send className="h-5 w-5" /></div>
          <div>
            <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Department Submissions</h2>
            <p className="mt-1 text-xs text-slate-500">
              Choose a fest to see the Lists its departments forwarded. This page refreshes by itself.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0B3F46] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#0B3F46]/10"
        >
          Refresh
        </button>
      </div>

      {fests.length === 0 ? (
        <p className="py-12 text-center text-xs text-slate-400">No department Lists have been submitted to Admin yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {fests.map((f) => (
            <button
              key={f.festId}
              type="button"
              onClick={() => navigate(`/admin/submissions/${encodeURIComponent(f.festId)}`)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-[#F5F8F8] text-left transition hover:border-[#F5A623] hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5A623]/40"
            >
              <div className="h-1.5 bg-[#F5A623]" />
              <div className="p-5">
                <h3 className="fest-display text-xl font-extrabold text-[#0B3F46]">{f.festName}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="fest-display text-2xl font-extrabold text-[#0B3F46]">{f.departmentCount}</p>
                    <p className="text-xs text-slate-500">{f.departmentCount === 1 ? 'Department' : 'Departments'}</p>
                  </div>
                  <div>
                    <p className="fest-display text-2xl font-extrabold text-[#0B3F46]">{f.studentCount}</p>
                    <p className="text-xs text-slate-500">{f.studentCount === 1 ? 'Student' : 'Students'}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">Last forwarded {fmtDateTime(f.latest)}</p>
                <p className="mt-3 text-sm font-semibold text-[#0B3F46] group-hover:underline">View Lists</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}