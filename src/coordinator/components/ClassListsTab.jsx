import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import NoticeAlert from '../../components/NoticeAlert'; // Make sure the path to NoticeAlert is correct

export default function ClassListsTab({
  teacherNotice,
  teacherError,
  loadError,
  deptSections = [], // <-- Add default fallback array
  staffLists = [],   // <-- Add default fallback array
  run,
  request,
  dept,
  cardStyle,
  inputStyle,
  smallButton,
}) {
  const [selectedClass, setSelectedClass] = useState('');
  const [pastedList, setPastedList] = useState('');
  const [busy, setBusy] = useState(false);

  // Safely filter staff lists if needed
  const classListsForDept = Array.isArray(staffLists) ? staffLists : [];

  const handleUploadList = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      alert('Please select a class first.');
      return;
    }
    if (!pastedList.trim()) {
      alert('Please enter or paste the student list.');
      return;
    }

    setBusy(true);
    try {
      await request('/staffLists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          department: dept,
          content: pastedList.trim(),
          updatedAt: new Date().toISOString(),
        }),
      });
      setPastedList('');
      alert('Class roster saved successfully!');
    } catch (err) {
      alert('Failed to save roster: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <NoticeAlert teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError} />

      <section className={`${cardStyle} p-6`}>
        <h2 className="fest-display mb-2 text-lg font-bold text-[#0B3F46]">
          Upload a class list ({dept})
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          A student whose register number and date of birth match their class list is approved automatically.
        </p>

        <form onSubmit={handleUploadList} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={inputStyle}
              required
            >
              <option value="">Select a class</option>
              {Array.isArray(deptSections) && deptSections.map((sec) => (
                <option key={sec.id} value={sec.name}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Or paste the list here (Register No, Name, Date of Birth)
            </label>
            <textarea
              rows="6"
              placeholder="REG202601, Anu Mathew, 05/03/2004&#10;REG202602, Rahul Varma, 17/11/2003"
              value={pastedList}
              onChange={(e) => setPastedList(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={smallButton}>
              <Plus className="h-4 w-4 text-[#F5A623]" /> Add to list
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}