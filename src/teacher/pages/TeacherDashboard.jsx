import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { normalizeDept } from '../../utils/deptKeys';
import { API_BASE } from '../../services/api';
import Teacherlayout from '../components/Teacherlayout';
import { getTeacherNavItems } from '../components/Teachernav';
import CommitteeDutiesTab from '../components/CommitteeDutiesTab';
import StudentApprovalsTab from '../components/StudentApprovalsTab';
import ClassFundTab from '../components/ClassFundTab';
import ProgramEntryTab from '../components/ProgramEntryTab';

const sameId = (a, b) => String(a) === String(b);
const norm = (v) => String(v || '').trim().toLowerCase();

const PENDING = 'Pending Submission';
const SUBMITTED = 'Submitted to Coordinator';
const FORWARDED = 'Forwarded to Admin';

export default function TeacherDashboard() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('fest_user') || 'null');
    } catch (e) {
      saved = null;
    }
    const uid = id || saved?.id;

    if (!uid) {
      if (saved) setTeacher(saved);
      return;
    }

    fetch(`${API_BASE}/users/${uid}`)
      .then((res) => {
        if (!res.ok) throw new Error('Profile not found');
        return res.json();
      })
      .then((data) => {
        setTeacher(data);
        setProfileError('');
      })
      .catch((err) => {
        console.error('Failed to fetch teacher profile', err);
        if (saved) setTeacher(saved);
        else setProfileError('Could not load your profile. Is the server running?');
      });
  }, [id]);

  const teacherKey = teacher ? teacher.id || teacher.email : null;
  const dept = teacher?.department?.trim() || 'Department';
  const deptKey = normalizeDept(dept);

  const classSection = teacher?.classSection || '';
  const isClassTeacher =
    Array.isArray(teacher?.duties) &&
    teacher.duties.includes('class_teacher') &&
    !!classSection;

  const [assignedEvents, setAssignedEvents] = useState([]);

  useEffect(() => {
    if (!teacher?.id) return;
    let active = true;

    Promise.all([
      fetch(`${API_BASE}/programs`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/fests`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([programs, fests]) => {
        if (!active) return;
        const publishedIds = (Array.isArray(fests) ? fests : [])
          .filter((f) => f.published)
          .map((f) => f.id);

        const mine = (Array.isArray(programs) ? programs : []).filter(
          (p) =>
            publishedIds.some((fid) => sameId(fid, p.festId)) &&
            ((p.assignments || {})[deptKey] || []).some((tid) => sameId(tid, teacher.id))
        );

        setAssignedEvents(
          mine.map((p) => ({
            id: String(p.id),
            festId: p.festId,
            festName: (Array.isArray(fests) ? fests : []).find((f) => sameId(f.id, p.festId))?.name || '',
            eventName: p.name,
            eventType: p.kind === 'group' ? 'Group' : 'Single',
            maxGroupSize: p.maxGroupSize || null,
          }))
        );
      })
      .catch((err) => {
        console.error('Error loading teacher assignments:', err);
        if (active) setAssignedEvents([]);
      });

    return () => {
      active = false;
    };
  }, [teacher?.id, deptKey]);

  const hasProgramDuty = assignedEvents.length > 0;
  const committeeDutiesKey = teacherKey ? `teacher_committee_duties_${teacherKey}` : null;

  const [participants, setParticipants] = useState([]);
  const [regBusy, setRegBusy] = useState(false);

  const loadParticipants = useCallback(async () => {
    if (!teacher?.id) return;
    try {
      const res = await fetch(`${API_BASE}/registrations`);
      if (!res.ok) throw new Error('Registrations list is missing');
      const all = await res.json();
      setParticipants((Array.isArray(all) ? all : []).filter((r) => sameId(r.teacherId, teacher.id)));
    } catch (err) {
      console.error('Failed to load registrations', err);
    }
  }, [teacher?.id]);

  useEffect(() => {
    loadParticipants();
    window.addEventListener('focus', loadParticipants);
    return () => window.removeEventListener('focus', loadParticipants);
  }, [loadParticipants]);

  const [committeeDuties, setCommitteeDuties] = useState([]);
  useEffect(() => {
    if (!committeeDutiesKey) return;
    try {
      const saved = localStorage.getItem(committeeDutiesKey);
      setCommitteeDuties(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCommitteeDuties([]);
    }
  }, [committeeDutiesKey]);

  // Set default active tab dynamically when duty state loads
  useEffect(() => {
    if (!activeTab) {
      if (isClassTeacher) setActiveTab('approvals');
      else if (hasProgramDuty) setActiveTab('programs');
      else if (committeeDuties.length > 0) setActiveTab('committee');
    }
  }, [isClassTeacher, hasProgramDuty, committeeDuties.length, activeTab]);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState(dept);
  const [semester, setSemester] = useState('');
  const [phone, setPhone] = useState('');
  const [groupMembers, setGroupMembers] = useState('');

  useEffect(() => {
    setDepartment(dept);
  }, [dept]);

  useEffect(() => {
    if (assignedEvents.length > 0 && !assignedEvents.some((ev) => sameId(ev.id, selectedEventId))) {
      setSelectedEventId(String(assignedEvents[0].id));
    }
  }, [assignedEvents, selectedEventId]);

  const chosenEvent =
    assignedEvents.find((ev) => sameId(ev.id, selectedEventId)) || assignedEvents[0];
  const isGroupEvent = chosenEvent?.eventType === 'Group';

  const jsonHeaders = { 'Content-Type': 'application/json' };
  const SAVE_HINT = 'Could not save. Check that "registrations" is in db.json and the server is running.';

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !chosenEvent) return;

    const idText = studentId.trim();
    if (participants.some((p) => sameId(p.programId, chosenEvent.id) && norm(p.studentId) === norm(idText))) {
      alert('This student is already entered for this program.');
      return;
    }

    let memberList = [];
    if (isGroupEvent && groupMembers.trim()) {
      memberList = groupMembers.split(',').map((m) => m.trim()).filter(Boolean);
    }

    setRegBusy(true);
    try {
      const res = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          festId: chosenEvent.festId,
          festName: chosenEvent.festName,
          programId: chosenEvent.id,
          eventName: chosenEvent.eventName,
          eventType: chosenEvent.eventType,
          studentName: isGroupEvent ? `${studentName.trim()} (Team Leader)` : studentName.trim(),
          studentId: idText,
          department: department.trim() || dept,
          semester: semester.trim(),
          phone: phone.trim(),
          members: memberList,
          teacherId: teacher.id,
          teacherName: teacher.name || 'Faculty',
          teacherEmail: teacher.email || '',
          teacherDept: dept,
          deptKey,
          status: PENDING,
          createdAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(SAVE_HINT);
      await loadParticipants();
      setStudentName('');
      setStudentId('');
      setSemester('');
      setPhone('');
      setGroupMembers('');
    } catch (err) {
      alert(err.message || SAVE_HINT);
    } finally {
      setRegBusy(false);
    }
  };

  const handleDeleteParticipant = async (item) => {
    if (item.status === FORWARDED) {
      alert('This entry has already been forwarded to the Admin and cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete the entry for ${item.studentName}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/registrations/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete the entry.');
      await loadParticipants();
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingCount = participants.filter((p) => p.status === PENDING).length;

  const handleSubmitRoster = async () => {
    const pending = participants.filter((p) => p.status === PENDING);
    if (pending.length === 0) {
      alert('There are no new entries to submit.');
      return;
    }

    const now = new Date().toISOString();
    setRegBusy(true);
    try {
      await Promise.all(
        pending.map(async (p) => {
          const res = await fetch(`${API_BASE}/registrations/${p.id}`, {
            method: 'PATCH',
            headers: jsonHeaders,
            body: JSON.stringify({ status: SUBMITTED, submittedAt: now, submittedBy: teacher?.name || 'Faculty' }),
          });
          if (!res.ok) throw new Error('Could not submit some entries. Please try again.');
        })
      );
      await loadParticipants();
      alert(`Successfully submitted ${pending.length} participant records to the Department Coordinator for ${dept}!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setRegBusy(false);
    }
  };

  const [classStudents, setClassStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [payments, setPayments] = useState([]);
  const [deptFunds, setDeptFunds] = useState([]);
  const [allFests, setAllFests] = useState([]);
  const [fundFestId, setFundFestId] = useState('');
  const [fundMessage, setFundMessage] = useState({ type: '', text: '' });
  const [fundBusy, setFundBusy] = useState(false);

  const loadFundData = useCallback(async () => {
    if (!teacher?.id || !isClassTeacher) return;
    const get = (path) => fetch(`${API_BASE}${path}`).then((r) => (r.ok ? r.json() : []));
    try {
      const [users, pays, funds, fests] = await Promise.all([
        get('/users'),
        get('/payments'),
        get('/deptFunds'),
        get('/fests'),
      ]);
      setClassStudents(
        (Array.isArray(users) ? users : []).filter(
          (u) =>
            u.baseType === 'student' &&
            u.approved !== false &&
            !u.rejected &&
            normalizeDept(u.department || '') === deptKey &&
            u.classSection === classSection
        )
      );
      setPendingStudents(
        (Array.isArray(users) ? users : []).filter(
          (u) =>
            u.baseType === 'student' &&
            u.approved === false &&
            !u.rejected &&
            normalizeDept(u.department || '') === deptKey &&
            u.classSection === classSection
        )
      );
      setPayments(Array.isArray(pays) ? pays : []);
      setDeptFunds(
        (Array.isArray(funds) ? funds : []).filter(
          (f) => f.deptKey === deptKey && f.festId !== undefined && f.festId !== null
        )
      );
      setAllFests(Array.isArray(fests) ? fests : []);
    } catch (err) {
      console.error('Failed to load class fund data', err);
    }
  }, [teacher?.id, isClassTeacher, classSection, deptKey]);

  useEffect(() => {
    loadFundData();
    window.addEventListener('focus', loadFundData);
    return () => window.removeEventListener('focus', loadFundData);
  }, [loadFundData]);

  const fundFests = allFests.filter((f) => deptFunds.some((d) => sameId(d.festId, f.id)));
  const fundFestKey = fundFests.map((f) => f.id).join(',');

  useEffect(() => {
    if (fundFests.length > 0 && !fundFests.some((f) => sameId(f.id, fundFestId))) {
      setFundFestId(String(fundFests[fundFests.length - 1].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundFestKey, fundFestId]);

  const selectedFundFest = fundFests.find((f) => sameId(f.id, fundFestId)) || null;
  const deptFund = selectedFundFest
    ? deptFunds.find((d) => sameId(d.festId, selectedFundFest.id)) || null
    : null;

  const paidPaymentOf = (studentId) =>
    payments.find(
      (p) =>
        sameId(p.studentId, studentId) &&
        p.status === 'paid' &&
        selectedFundFest &&
        sameId(p.festId, selectedFundFest.id)
    );

  const handleDecideStudent = async (stu, approve) => {
    if (!approve && !window.confirm(`Reject the registration of ${stu.name}?`)) return;
    setApprovalBusy(true);
    setFundMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/users/${stu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          approve
            ? { approved: true, approvalMethod: 'class_teacher', approvedBy: teacher.name || 'Class teacher', approvedAt: new Date().toISOString() }
            : { rejected: true, rejectedBy: teacher.name || 'Class teacher' }
        ),
      });
      if (!res.ok) throw new Error('Could not save the decision. Please try again.');
      await loadFundData();
      setFundMessage({ type: 'ok', text: approve ? `${stu.name} approved.` : `${stu.name} rejected.` });
    } catch (err) {
      setFundMessage({ type: 'error', text: err.message });
    } finally {
      setApprovalBusy(false);
    }
  };

  const handleRemoveStudentAccount = async (stu) => {
    if (!window.confirm(`Remove the account of ${stu.name}? If this was not the real student, they can register again.`)) return;
    setApprovalBusy(true);
    setFundMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/users/${stu.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected: true, rejectedBy: teacher.name || 'Class teacher', rejectedReason: 'Account removed' }),
      });
      if (!res.ok) throw new Error('Could not remove the account. Please try again.');
      await loadFundData();
      setFundMessage({ type: 'ok', text: `Account of ${stu.name} removed. The real student can register again.` });
    } catch (err) {
      setFundMessage({ type: 'error', text: err.message });
    } finally {
      setApprovalBusy(false);
    }
  };

  const handleMarkCashPaid = async (student) => {
    if (!selectedFundFest || !deptFund?.amount) {
      setFundMessage({ type: 'error', text: 'The fest fund amount has not been set by your coordinator yet.' });
      return;
    }
    if (paidPaymentOf(student.id)) return;
    setFundBusy(true);
    setFundMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festId: selectedFundFest.id,
          festName: selectedFundFest.name,
          studentId: student.id,
          studentName: student.name,
          registerNo: student.registerNo || '',
          department: dept,
          deptKey,
          classSection,
          amount: Number(deptFund.amount),
          currency: 'INR',
          status: 'paid',
          provider: 'cash',
          providerRef: null,
          recordedBy: teacher.id,
          paidAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Could not save the payment.');
      await loadFundData();
      setFundMessage({ type: 'ok', text: `${student.name} marked as paid in cash for ${selectedFundFest.name}.` });
    } catch (err) {
      setFundMessage({ type: 'error', text: err.message });
    } finally {
      setFundBusy(false);
    }
  };

  const handleUndoCash = async (student) => {
    const pay = paidPaymentOf(student.id);
    if (!pay || pay.provider !== 'cash') return;
    if (!window.confirm(`Undo the cash payment recorded for ${student.name}?`)) return;
    setFundBusy(true);
    setFundMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/payments/${pay.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not undo the payment.');
      await loadFundData();
      setFundMessage({ type: 'ok', text: `Cash payment for ${student.name} removed.` });
    } catch (err) {
      setFundMessage({ type: 'error', text: err.message });
    } finally {
      setFundBusy(false);
    }
  };

  const handleEmergencyCall = () => {
    alert('Connecting to Fest Emergency Volunteer Response Team (Hotline: +91 98765 43210)...');
  };

  const navItems = getTeacherNavItems({
    isClassTeacher,
    hasProgramDuty,
    committeeCount: committeeDuties.length,
  });

  const badges = {
    approvals: pendingStudents.length,
    committee: committeeDuties.length,
  };

  const hasAnyDuty = isClassTeacher || hasProgramDuty || committeeDuties.length > 0;

  return (
    <Teacherlayout
      activeTab={activeTab}
      onSelect={setActiveTab}
      navItems={navItems}
      badges={badges}
      teacher={teacher}
      dept={dept}
      isClassTeacher={isClassTeacher}
      classSection={classSection}
      onEmergencyCall={handleEmergencyCall}
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E7] mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6336C] uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#D6336C]" />
            Faculty Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3F46]">
            Teacher Dashboard ({teacher?.name || 'Faculty'})
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {isClassTeacher && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Class teacher · {classSection}
              </span>
            )}
            {hasProgramDuty && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Program data entry · {assignedEvents.length} {assignedEvents.length === 1 ? 'program' : 'programs'}
              </span>
            )}
          </div>
          <p className="text-sm text-[#718589] mt-2">
            Your duties for {dept} appear below as your department coordinator assigns them.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0B3F46] bg-white border border-[#DCE7E7] px-4 py-2.5 rounded-xl hover:border-[#F5A623] transition w-fit"
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>
      </header>

      {profileError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">
          {profileError}
        </p>
      )}

      {teacher && !hasAnyDuty && (
        <section className="bg-white border border-[#E4ECEC] rounded-3xl p-8 text-center shadow-sm">
          <h2 className="text-lg font-extrabold text-[#0B3F46]">No duties assigned yet</h2>
          <p className="text-sm text-[#718589] mt-2 max-w-md mx-auto">
            Your account is approved. Your department coordinator will assign you as a class teacher
            and/or give you programs for data entry. Refresh this page after they do.
          </p>
        </section>
      )}

      {activeTab === 'approvals' && isClassTeacher && (
        <StudentApprovalsTab
          classSection={classSection}
          pendingStudents={pendingStudents}
          classStudents={classStudents}
          fundMessage={fundMessage}
          approvalBusy={approvalBusy}
          handleDecideStudent={handleDecideStudent}
          handleRemoveStudentAccount={handleRemoveStudentAccount}
        />
      )}

      {activeTab === 'fund' && isClassTeacher && (
        <ClassFundTab
          classSection={classSection}
          deptFund={deptFund}
          fundFests={fundFests}
          fundFestId={fundFestId}
          setFundFestId={setFundFestId}
          setFundMessage={setFundMessage}
          fundMessage={fundMessage}
          classStudents={classStudents}
          paidStudents={classStudents.filter((u) => paidPaymentOf(u.id))}
          paidPaymentOf={paidPaymentOf}
          fundBusy={fundBusy}
          handleMarkCashPaid={handleMarkCashPaid}
          handleUndoCash={handleUndoCash}
        />
      )}

      {activeTab === 'programs' && hasProgramDuty && (
        <ProgramEntryTab
          assignedEvents={assignedEvents}
          selectedEventId={selectedEventId}
          setSelectedEventId={setSelectedEventId}
          studentName={studentName}
          setStudentName={setStudentName}
          studentId={studentId}
          setStudentId={setStudentId}
          department={department}
          setDepartment={setDepartment}
          semester={semester}
          setSemester={setSemester}
          phone={phone}
          setPhone={setPhone}
          groupMembers={groupMembers}
          setGroupMembers={setGroupMembers}
          chosenEvent={chosenEvent}
          isGroupEvent={isGroupEvent}
          handleAddParticipant={handleAddParticipant}
          regBusy={regBusy}
          handleSubmitRoster={handleSubmitRoster}
          participants={participants}
          pendingCount={pendingCount}
          handleDeleteParticipant={handleDeleteParticipant}
          PENDING={PENDING}
        />
      )}

      {activeTab === 'committee' && committeeDuties.length > 0 && (
        <CommitteeDutiesTab committeeDuties={committeeDuties} />
      )}

      <footer className="mt-10 pt-5 border-t border-[#DCE7E7] flex flex-col sm:flex-row justify-between gap-2 text-xs text-[#91A1A3]">
        <p>© 2026 CampusFest. Faculty Portal.</p>
        <p>Making every campus event memorable.</p>
      </footer>
    </Teacherlayout>
  );
}