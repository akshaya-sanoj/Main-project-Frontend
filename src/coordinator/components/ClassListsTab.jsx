import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert';
import { normalizeDept } from '../../utils/deptKeys';
import { normReg, inChunks, hashDob, parseClassList } from '../../utils/classList';

// Saves each student of a class as one record in /classLists:
// { deptKey, department, classSection, registerNo, name, dobHash, hasDob }
// Registration checks exactly these records. Dates of birth are saved only as a fingerprint.
export default function ClassListsTab({
  teacherNotice,
  teacherError,
  loadError,
  deptSections = [],
  classLists = [],
  users = [],
  run,
  request,
  busy,
  dept,
  coordinatorName = 'Coordinator',
  cardStyle,
  inputStyle,
  primaryButton,
}) {
  const deptKey = normalizeDept(dept);
  const [listClassId, setListClassId] = useState('');
  const [listText, setListText] = useState('');
  const [fileError, setFileError] = useState('');

  const listSection = deptSections.find((sec) => String(sec.id) === String(listClassId)) || deptSections[0] || null;
  const parsedList = parseClassList(listText);

  const entriesOf = (sec) =>
    classLists.filter((c) => sec && c.deptKey === deptKey && c.classSection === sec.name);

  // Account status of each student, looked up by register number
  const studentByReg = new Map();
  users
    .filter((u) => u.baseType === 'student' && !u.rejected)
    .forEach((u) => studentByReg.set(normReg(u.registerNo), u));

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setListText(await file.text());
      setFileError('');
    } catch (err) {
      setFileError('Could not read that file. Save it as CSV and try again.');
    }
    e.target.value = '';
  };

  const handleSave = async (mode) => {
    if (!listSection || parsedList.rows.length === 0) return;

    const current = entriesOf(listSection);
    const inThisClass = new Set(current.map((c) => normReg(c.registerNo)));
    // A register number can belong to one class only
    const elsewhere = new Set(
      classLists
        .filter((c) => !(c.deptKey === deptKey && c.classSection === listSection.name))
        .map((c) => normReg(c.registerNo))
    );

    const skippedElsewhere = parsedList.rows.filter((r) => elsewhere.has(normReg(r.registerNo))).length;
    const toAdd = parsedList.rows.filter(
      (r) => !elsewhere.has(normReg(r.registerNo)) && (mode === 'replace' || !inThisClass.has(normReg(r.registerNo)))
    );

    if (mode === 'replace' && !window.confirm(`Replace the whole list of ${listSection.name} with ${toAdd.length} students?`)) return;

    const now = new Date().toISOString();
    const ok = await run(async () => {
      if (mode === 'replace') {
        await inChunks(current, (c) => request(`/classLists/${c.id}`, { method: 'DELETE' }));
      }
      await inChunks(toAdd, async (r) => {
        const dobHash = r.dob ? await hashDob(r.registerNo, r.dob) : null;
        return request('/classLists', {
          method: 'POST',
          body: JSON.stringify({
            deptKey,
            department: dept,
            classSection: listSection.name,
            registerNo: r.registerNo,
            name: r.name,
            dobHash,
            hasDob: !!dobHash,
            uploadedAt: now,
            uploadedBy: coordinatorName,
          }),
        });
      });
    }, `${toAdd.length} students saved to ${listSection.name}.${skippedElsewhere > 0 ? ` ${skippedElsewhere} skipped because they are already on another class list.` : ''}`);
    if (ok) setListText('');
  };

  const handleRemoveEntry = async (c) => {
    await run(() => request(`/classLists/${c.id}`, { method: 'DELETE' }), `${c.registerNo} removed from the list.`);
  };

  // Remove a wrong account (for example someone who registered with another student's number).
  // The real student can then register again.
  const handleRemoveAccount = async (u) => {
    if (!window.confirm(`Remove the account of ${u.name} (${u.registerNo})? If this was not the real student, they can register again.`)) return;
    await run(
      () => request(`/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rejected: true, rejectedBy: coordinatorName, rejectedReason: 'Account removed' }),
      }),
      `Account of ${u.name} removed. The real student can register again.`
    );
  };

  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={fileError || teacherError} loadError={loadError} />

      <section className={`${cardStyle} p-6 sm:p-8`}>
        <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Upload a class list ({dept})</h2>
        <p className="mt-1 text-xs text-slate-500">
          A student whose register number and date of birth match their class's list is approved automatically when they register. Everyone else waits for the class teacher. Volunteers always wait for the class teacher. Dates of birth are written day first (05/03/2004) and are saved only as a fingerprint, never as readable text. A student without a date of birth on the list is matched by register number alone, so add the dates for the strongest check.
        </p>

        {deptSections.length === 0 ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            Create your classes first on the Classes & Fund tab, then upload a list for each one.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="max-w-sm">
              <label htmlFor="listClass" className="mb-1.5 block text-xs font-semibold text-slate-600">Class</label>
              <select
                id="listClass"
                value={listSection ? listSection.id : ''}
                onChange={(e) => setListClassId(e.target.value)}
                className={inputStyle}
              >
                {deptSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="listFile" className="mb-1.5 block text-xs font-semibold text-slate-600">
                CSV file (Register No, Name, Date of Birth)
              </label>
              <input
                id="listFile"
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleFile}
                className="block w-full max-w-sm text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#E6F1F2] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#0B3F46]"
              />
              <p className="mt-1.5 text-xs text-slate-500">From Excel: File, Save As, CSV. Or copy the columns in Excel and paste them below.</p>
            </div>

            <div>
              <label htmlFor="listText" className="mb-1.5 block text-xs font-semibold text-slate-600">Or paste the list here</label>
              <textarea
                id="listText"
                rows={6}
                value={listText}
                onChange={(e) => setListText(e.target.value)}
                placeholder={'Register No, Name, Date of Birth\nREG202601, Anu Mathew, 05/03/2004\nREG202602, Rahul Varma, 17/11/2003'}
                className={`${inputStyle} font-mono`}
              />
            </div>

            <p className="text-xs text-slate-600">
              {parsedList.rows.length > 0
                ? `${parsedList.rows.length} students found, ${parsedList.withDob} with a date of birth${parsedList.duplicates > 0 ? `, ${parsedList.duplicates} repeated register numbers ignored` : ''}.`
                : 'Nothing to save yet.'}
              {parsedList.badDob > 0 && (
                <span className="ml-1 font-semibold text-amber-700">
                  {parsedList.badDob} dates could not be read. Use day/month/year, for example 05/03/2004.
                </span>
              )}
            </p>

            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy || parsedList.rows.length === 0} onClick={() => handleSave('add')} className={primaryButton}>
                <Plus className="h-4 w-4 text-[#F5A623]" /> Add to list
              </button>
              <button
                type="button"
                disabled={busy || parsedList.rows.length === 0}
                onClick={() => handleSave('replace')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0B3F46] hover:bg-slate-50 disabled:opacity-50"
              >
                Replace whole list
              </button>
            </div>
          </div>
        )}
      </section>

      {listSection && (
        <section className={`${cardStyle} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h3 className="fest-display font-bold text-[#0B3F46]">List of {listSection.name}</h3>
              <p className="mt-1 text-xs text-slate-500">Students on this list are approved automatically when they register.</p>
            </div>
            <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
              {entriesOf(listSection).length} students
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="p-4">Register No</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Date of birth</th>
                  <th className="p-4">Account</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entriesOf(listSection).map((c) => {
                  const acct = studentByReg.get(normReg(c.registerNo));
                  return (
                    <tr key={c.id} className="hover:bg-[#F5F8F8]">
                      <td className="p-4 font-mono text-xs text-[#0B3F46]">{c.registerNo}</td>
                      <td className="p-4 text-slate-700">{c.name || '—'}</td>
                      <td className="p-4">
                        {c.hasDob ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Added</span>
                        ) : (
                          <span className="text-xs italic text-slate-400">Not added</span>
                        )}
                      </td>
                      <td className="p-4">
                        {!acct ? (
                          <span className="text-xs italic text-slate-400">Not registered yet</span>
                        ) : acct.approved === false ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Waiting for approval</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Registered</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {acct && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveAccount(acct)}
                            className="mr-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            Remove account
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleRemoveEntry(c)}
                          aria-label={`Remove ${c.registerNo} from the list`}
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {entriesOf(listSection).length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-xs text-slate-500">No list uploaded for this class yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}