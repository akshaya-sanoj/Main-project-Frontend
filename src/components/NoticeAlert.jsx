import React from 'react';

export default function NoticeAlert({ teacherNotice, teacherError, loadError }) {
  return (
    <>
      {teacherNotice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {teacherNotice}
        </p>
      )}
      {(teacherError || loadError) && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {teacherError || loadError}
        </p>
      )}
    </>
  );
}