import React from 'react';

export default function DeptStaffList({ department, staffLists = [] }) {
  if (staffLists.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold text-[#0B3F46]">Staff List ({department})</h2>
      <ul className="mt-3 divide-y divide-slate-100">
        {staffLists.map((s, i) => (
          <li key={s.staffId || i} className="py-2">
            <p className="text-sm font-semibold">{s.name}</p>
            <p className="text-xs text-slate-500">ID {s.staffId}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}