import React, { useState, useEffect, useCallback } from 'react';
import { normalizeDept } from '../../utils/deptKeys';
import { API_BASE } from '../../services/api';
import { Link } from 'react-router-dom';
import { useDepartmentStorage } from '../../hooks/useDepartmentStorage';
import Coordinatorlayout from '../components/Coordinatorlayout';
import TeachersTab from '../components/TeachersTab';
import FundsTab from '../components/FundsTab';
import ClassListsTab from '../components/ClassListsTab';
import StudentApprovalsTab from '../components/StudentApprovalsTab';
import VolunteersTab from '../components/VolunteersTab';
import SubmissionsTab from '../components/SubmissionsTab';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(`Cannot reach the server at ${API_BASE}. Is it running?`);
  }
  if (!res.ok) {
    const isList = path.split('/').filter(Boolean).length === 1;
    if (res.status === 404 && isList) {
      throw new Error('The server has no list for this yet.');
    }
    throw new Error(res.status === 404 ? 'That item was not found.' : 'The server could not save that.');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });
const sameId = (a, b) => String(a) === String(b);

export default function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState('teachers');
  const [coordinator, setCoordinator] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fest_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCoordinator(parsed);
        if (parsed.id) {
          fetch(`${API_BASE}/users/${parsed.id}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((fresh) => fresh && setCoordinator(fresh))
            .catch(() => {});
        }
      } catch (error) {
        console.error('Error loading coordinator:', error);
      }
    }
  }, []);

  const dept = coordinator?.department?.trim() || 'Department';
  const deptKey = normalizeDept(dept);

  const [users, setUsers] = useState([]);
  const [fests, setFests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedFestId, setSelectedFestId] = useState('');
  const [deptFunds, setDeptFunds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [teacherNotice, setTeacherNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [classInputs, setClassInputs] = useState({});
  const [programPick, setProgramPick] = useState({});
  const [fundInput, setFundInput] = useState('');
  const [sectionInput, setSectionInput] = useState('');
  const [staffLists, setStaffLists] = useState([]);

  const loadAll = useCallback(async () => {
    const optional = (path) => request(path).catch(() => []);
    const [u, f, p, sec, df, pay, regs, staff] = await Promise.all([
      request('/users'),
      request('/fests'),
      request('/programs'),
      optional('/sections'),
      optional('/deptFunds'),
      optional('/payments'),
      optional('/registrations'),
      optional('/staffLists'),
    ]);
    setUsers(Array.isArray(u) ? u : []);
    setFests(Array.isArray(f) ? f : []);
    setPrograms(Array.isArray(p) ? p : []);
    setSections(Array.isArray(sec) ? sec : []);
    setDeptFunds(Array.isArray(df) ? df : []);
    setPayments(Array.isArray(pay) ? pay : []);
    setRegistrations(Array.isArray(regs) ? regs : []);
    setStaffLists(Array.isArray(staff) ? staff : []);
  }, []);

  useEffect(() => {
    loadAll().then(() => setLoadError('')).catch((e) => setLoadError(e.message));
  }, [loadAll]);

  useEffect(() => {
    const refresh = () => { loadAll().catch(() => {}); };
    window.addEventListener('focus', refresh);
    const timer = setInterval(refresh, 15000);
    return () => {
      window.removeEventListener('focus', refresh);
      clearInterval(timer);
    };
  }, [loadAll]);

  const run = async (fn, successMessage) => {
    setBusy(true);
    setTeacherError('');
    setTeacherNotice('');
    try {
      await fn();
      await loadAll();
      if (successMessage) setTeacherNotice(successMessage);
      return true;
    } catch (e) {
      setTeacherError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const deptTeachers = users.filter(
    (u) => u.baseType === 'teacher' && u.approved !== false && !u.rejected && (u.staffId || u.email) && normalizeDept(u.department || '') === deptKey
  );

  const myFestIds = Array.isArray(coordinator?.festIds) && coordinator.festIds.length > 0 ? coordinator.festIds : null;
  const myFests = fests.filter((f) => !myFestIds || myFestIds.some((id) => sameId(id, f.id)));
  const myFestKey = myFests.map((f) => f.id).join(',');

  useEffect(() => {
    if (myFests.length > 0 && !myFests.some((f) => sameId(f.id, selectedFestId))) {
      setSelectedFestId(String(myFests[myFests.length - 1].id));
    }
  }, [myFestKey, selectedFestId, myFests]);

  const selectedFest = myFests.find((f) => sameId(f.id, selectedFestId)) || null;
  const publishedPrograms = selectedFest && selectedFest.published ? programs.filter((p) => sameId(p.festId, selectedFest.id)) : [];
  const programsOfTeacher = (teacherId) => publishedPrograms.filter((p) => ((p.assignments || {})[deptKey] || []).some((id) => sameId(id, teacherId)));
  const isClassTeacher = (u) => (u.duties || []).includes('class_teacher') && !!u.classSection;

  const handleSetClassTeacher = async (teacher) => {
    const section = (classInputs[teacher.id] || '').trim();
    if (section.length < 2) {
      setTeacherError('Choose a class first.');
      return;
    }
    const duties = Array.from(new Set([...(teacher.duties || ['teacher']), 'class_teacher']));
    const ok = await run(() => request(`/users/${teacher.id}`, send('PATCH', { duties, classSection: section })), `${teacher.name} is now class teacher.`);
    if (ok) setClassInputs((prev) => ({ ...prev, [teacher.id]: '' }));
  };

  const handleRemoveClassTeacher = async (teacher) => {
    if (!window.confirm(`Remove ${teacher.name}?`)) return;
    const duties = (teacher.duties || []).filter((d) => d !== 'class_teacher');
    await run(() => request(`/users/${teacher.id}`, send('PATCH', { duties, classSection: null })), `${teacher.name} removed.`);
  };

  const handleAssignProgram = async (teacher) => {
    const programId = programPick[teacher.id];
    if (!programId) return;
    const prog = programs.find((p) => sameId(p.id, programId));
    if (!prog) return;
    const list = (prog.assignments || {})[deptKey] || [];
    const ok = await run(() => request(`/programs/${prog.id}`, send('PATCH', { assignments: { ...(prog.assignments || {}), [deptKey]: [...list, teacher.id] } })), `Assigned.`);
    if (ok) setProgramPick((prev) => ({ ...prev, [teacher.id]: '' }));
  };

  const handleUnassignProgram = async (teacher, prog) => {
    const list = ((prog.assignments || {})[deptKey] || []).filter((id) => !sameId(id, teacher.id));
    await run(() => request(`/programs/${prog.id}`, send('PATCH', { assignments: { ...(prog.assignments || {}), [deptKey]: list } })), `Removed.`);
  };

  const deptRegistrations = registrations.filter((r) => r.deptKey === deptKey && selectedFest && sameId(r.festId, selectedFest.id) && r.status !== 'Pending Submission');
  const teacherSubmissions = Object.values(deptRegistrations.reduce((acc, r) => {
    const key = String(r.teacherId);
    if (!acc[key]) acc[key] = { teacherName: r.teacherName, submittedAt: r.submittedAt, participants: [] };
    acc[key].participants.push(r);
    return acc;
  }, {}));

  const toForward = deptRegistrations.filter((r) => r.status === 'Submitted to Coordinator');
  const forwardedCount = deptRegistrations.length - toForward.length;

  const handleForwardToAdmin = async () => {
    if (toForward.length === 0) return;
    const now = new Date().toISOString();
    await run(() => Promise.all(toForward.map((r) => request(`/registrations/${r.id}`, send('PATCH', { status: 'Forwarded to Admin', forwardedAt: now })))), `Forwarded entries.`);
  };

  const deptFund = (selectedFest && deptFunds.find((f) => f.deptKey === deptKey && sameId(f.festId, selectedFest.id))) || null;
  const deptSections = sections.filter((s) => s.deptKey === deptKey);
  const allDeptStudents = users.filter((u) => u.baseType === 'student' && !u.rejected && normalizeDept(u.department || '') === deptKey);
  const deptStudents = allDeptStudents.filter((u) => u.approved !== false);

  const paidPaymentOf = (studentId) => payments.find((p) => sameId(p.studentId, studentId) && p.status === 'paid' && selectedFest && sameId(p.festId, selectedFest.id));
  const classTeacherOfSection = (name) => deptTeachers.find((t) => isClassTeacher(t) && t.classSection === name);

  const sectionStats = (sec) => {
    const students = deptStudents.filter((u) => u.classSection === sec.name);
    const paidList = students.filter((u) => paidPaymentOf(u.id));
    const collected = paidList.reduce((sum, u) => sum + (Number(paidPaymentOf(u.id).amount) || 0), 0);
    return { total: students.length, paid: paidList.length, collected };
  };

  const totalCollected = deptSections.reduce((sum, sec) => sum + sectionStats(sec).collected, 0);
  const takenSections = deptTeachers.filter(isClassTeacher).map((t) => t.classSection);
  const freeSections = deptSections.filter((sec) => !takenSections.includes(sec.name));

  const handleSaveFund = async (e) => {
    e.preventDefault();
    const amount = Number(fundInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const body = { festId: selectedFest.id, deptKey, department: dept, amount, updatedAt: new Date().toISOString() };
    const ok = await run(() => deptFund ? request(`/deptFunds/${deptFund.id}`, send('PATCH', body)) : request('/deptFunds', send('POST', body)), `Fund saved.`);
    if (ok) setFundInput('');
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    const name = sectionInput.trim();
    if (name.length < 2) return;
    const ok = await run(() => request('/sections', send('POST', { deptKey, department: dept, name })), `Class added.`);
    if (ok) setSectionInput('');
  };

  const handleDeleteSection = async (sec) => {
    if (!window.confirm(`Delete class "${sec.name}"?`)) return;
    await run(() => request(`/sections/${sec.id}`, { method: 'DELETE' }), 'Class deleted.');
  };

  const volunteersKey = `coord_volunteers_${deptKey}`;
  const [volunteers, setVolunteers] = useDepartmentStorage(volunteersKey, [{ id: 201, name: 'Ananya S.', role: 'Stage Assistance', classSection: `3rd Year ${dept}` }]);
  const [volName, setVolName] = useState('');
  const [volRole, setVolRole] = useState('');
  const [volClass, setVolClass] = useState('');

  const handleAddVolunteer = (e) => {
    e.preventDefault();
    if (!volName.trim() || !volRole.trim() || !volClass.trim()) return;
    setVolunteers((prev) => [...prev, { id: Date.now(), name: volName.trim(), role: volRole.trim(), classSection: volClass.trim() }]);
    setVolName(''); setVolRole(''); setVolClass('');
  };

  const handleDeleteVolunteer = (id) => setVolunteers((prev) => prev.filter((v) => v.id !== id));

  // Calculate pending student approvals count for the sidebar badge
  const pendingApprovalsCount = users.filter(
    (u) => u.baseType === 'student' && u.approved === false && u.department === dept
  ).length;

  const badges = {
    approvals: pendingApprovalsCount,
  };

  const cardStyle = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
  const inputStyle = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';
  const primaryButton = 'flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55]';
  const smallButton = 'flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B3F46] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0E4D55]';

  return (
    <Coordinatorlayout
      activeTab={activeTab}
      onSelect={setActiveTab}
      badges={badges}
      coordinator={coordinator}
      dept={dept}
    >
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="fest-display text-2xl font-extrabold text-[#0B3F46] sm:text-3xl">
            {activeTab === 'teachers' && `My Teachers (${dept})`}
            {activeTab === 'funds' && `Classes & Fund (${dept})`}
            {activeTab === 'classLists' && `Class Lists (${dept})`}
            {activeTab === 'approvals' && `Student Approvals (${dept})`}
            {activeTab === 'volunteers' && `Department Volunteers (${dept})`}
            {activeTab === 'submissions' && `Submissions to Admin (${dept})`}
          </h1>
        </div>
        <Link to="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B3F46] hover:bg-[#FFF8E9]">
          ← Back to Home
        </Link>
      </header>

      {activeTab === 'teachers' && (
        <TeachersTab
          teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError}
          myFests={myFests} selectedFestId={selectedFestId} setSelectedFestId={setSelectedFestId}
          setProgramPick={setProgramPick} setTeacherError={setTeacherError} setTeacherNotice={setTeacherNotice}
          selectedFest={selectedFest} publishedPrograms={publishedPrograms} deptTeachers={deptTeachers}
          programsOfTeacher={programsOfTeacher} isClassTeacher={isClassTeacher} classInputs={classInputs}
          staffLists={staffLists}
          setClassInputs={setClassInputs} freeSections={freeSections} handleSetClassTeacher={handleSetClassTeacher}
          handleRemoveClassTeacher={handleRemoveClassTeacher} handleAssignProgram={handleAssignProgram}
          handleUnassignProgram={handleUnassignProgram} programPick={programPick} busy={busy} dept={dept}
          cardStyle={cardStyle} inputStyle={inputStyle} smallButton={smallButton}
        />
      )}

      {activeTab === 'funds' && (
        <FundsTab
          teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError}
          myFests={myFests} selectedFestId={selectedFestId} setSelectedFestId={setSelectedFestId}
          setProgramPick={setProgramPick} setFundInput={setFundInput} setTeacherError={setTeacherError}
          setTeacherNotice={setTeacherNotice} selectedFest={selectedFest} deptFund={deptFund}
          fundInput={fundInput} handleSaveFund={handleSaveFund} totalCollected={totalCollected}
          sectionInput={sectionInput} setSectionInput={setSectionInput} handleAddSection={handleAddSection}
          deptSections={deptSections} sectionStats={sectionStats} classTeacherOfSection={classTeacherOfSection}
          handleDeleteSection={handleDeleteSection} busy={busy} dept={dept} cardStyle={cardStyle}
          inputStyle={inputStyle} smallButton={smallButton}
        />
      )}

      {activeTab === 'classLists' && (
        <ClassListsTab
          teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError}
          deptSections={deptSections} staffLists={staffLists} run={run} request={request}
          dept={dept} cardStyle={cardStyle} inputStyle={inputStyle} smallButton={smallButton}
        />
      )}

      {activeTab === 'approvals' && (
        <StudentApprovalsTab
          teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError}
          users={users} run={run} request={request} dept={dept} cardStyle={cardStyle}
        />
      )}

      {activeTab === 'volunteers' && (
        <VolunteersTab
          volunteers={volunteers} volName={volName} setVolName={setVolName}
          volRole={volRole} setVolRole={setVolRole} volClass={volClass} setVolClass={setVolClass}
          handleAddVolunteer={handleAddVolunteer} handleDeleteVolunteer={handleDeleteVolunteer}
          dept={dept} cardStyle={cardStyle} inputStyle={inputStyle} primaryButton={primaryButton}
        />
      )}

      {activeTab === 'submissions' && (
        <SubmissionsTab
          teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError}
          myFests={myFests} selectedFestId={selectedFestId} setSelectedFestId={setSelectedFestId}
          setProgramPick={setProgramPick} setTeacherError={setTeacherError} setTeacherNotice={setTeacherNotice}
          selectedFest={selectedFest} loadAll={loadAll} handleForwardToAdmin={handleForwardToAdmin}
          toForward={toForward} forwardedCount={forwardedCount} teacherSubmissions={teacherSubmissions}
          busy={busy} dept={dept} cardStyle={cardStyle} inputStyle={inputStyle}
        />
      )}
    </Coordinatorlayout>
  );
}