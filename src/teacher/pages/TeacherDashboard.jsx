import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { normalizeDept } from '../../utils/deptKeys';
import { API_BASE, authHeaders } from '../../services/api';
import Teacherlayout from '../components/Teacherlayout';
import { getTeacherNavItems } from '../components/Teachernav';
import CommitteeDutiesTab from '../components/CommitteeDutiesTab';
import StudentApprovalsTab from '../components/StudentApprovalsTab';
import ClassFundTab from '../components/ClassFundTab';
import ProgramEntryTab from '../components/ProgramEntryTab';
import Photo from '../../components/Photo';
import { triggerSosAlert } from '../../utils/sosAlerts';
import SosModal from '../../components/SosModal';

const sameId = (a, b) => String(a) === String(b);
const norm = (v) => String(v || '').trim().toLowerCase();
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const PENDING = 'Pending Submission';
const SUBMITTED = 'Submitted to Coordinator';
const FORWARDED = 'Forwarded to Admin';

export default function TeacherDashboard() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [volunteerHeadFests, setVolunteerHeadFests] = useState([]);
  const [sosOpen, setSosOpen] = useState(false);

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse((sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user')) || 'null');
    } catch {
      saved = null;
    }
    const uid = id || saved?.id;

    if (!uid) {
      if (saved) setTeacher(saved);
      return;
    }

    fetch(`${API_BASE}/users/${uid}`, { headers: authHeaders() })
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

  useEffect(() => {
    if (!teacher?.name) {
      setVolunteerHeadFests([]);
      return;
    }
    const myNorm = normName(teacher.name);
    fetch(`${API_BASE}/fests`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((fests) => {
        const matched = (Array.isArray(fests) ? fests : []).filter(
          (f) =>
            f.volunteerCoord &&
            f.volunteerCoord !== 'Unassigned' &&
            normName(f.volunteerCoord) === myNorm
        );
        setVolunteerHeadFests(matched);
      })
      .catch(() => setVolunteerHeadFests([]));
  }, [teacher?.name]);

  const isVolunteerHead = volunteerHeadFests.length > 0;
  const volunteerDashboardPath = teacher?.id
    ? `/volunteer-dashboard/${teacher.id}`
    : '/volunteer-dashboard';

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
    const headers = authHeaders();

    Promise.all([
      fetch(`${API_BASE}/programs`, { headers }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/fests`, { headers }).then((r) => (r.ok ? r.json() : [])),
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
      const res = await fetch(`${API_BASE}/registrations`, { headers: authHeaders() });
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
    } catch {
      setCommitteeDuties([]);
    }
  }, [committeeDutiesKey]);

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

  const SAVE_HINT = 'Could not save. Check that the backend server and "registrations" endpoint are running.';

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
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
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
      const res = await fetch(`${API_BASE}/registrations/${item.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Could not delete the entry.');
      await loadParticipants();
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingCount = participants.filter((p) => p.status === PENDING).length;

  const handleSubmitList = async () => {
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
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders(),
            },
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
  const [remittances, setRemittances] = useState([]);
  const [fundFestId, setFundFestId] = useState('');
  const [fundMessage, setFundMessage] = useState({ type: '', text: '' });
  const [fundBusy, setFundBusy] = useState(false);
  const [remitBusy, setRemitBusy] = useState(false);

  const loadFundData = useCallback(async () => {
    if (!teacher?.id || !isClassTeacher) return;
    const headers = authHeaders();
    const get = (path) => fetch(`${API_BASE}${path}`, { headers }).then((r) => (r.ok ? r.json() : []));
    try {
      const [users, pays, funds, fests, rems] = await Promise.all([
        get('/users'),
        get('/payments'),
        get('/deptFunds'),
        get('/fests'),
        get('/fundRemittances').catch(() => []),
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
      setRemittances(Array.isArray(rems) ? rems : []);
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

  const paidClassStudents = classStudents.filter((u) => paidPaymentOf(u.id));

  const onlineClassStudents = paidClassStudents.filter(
    (u) => paidPaymentOf(u.id)?.provider !== 'cash'
  );
  const cashClassStudents = paidClassStudents.filter(
    (u) => paidPaymentOf(u.id)?.provider === 'cash'
  );

  const onlineClassAmount = onlineClassStudents.reduce(
    (sum, u) => sum + (Number(paidPaymentOf(u.id)?.amount) || 0),
    0
  );
  const cashClassAmount = cashClassStudents.reduce(
    (sum, u) => sum + (Number(paidPaymentOf(u.id)?.amount) || 0),
    0
  );

  const currentRemittance =
    selectedFundFest &&
    remittances.find(
      (r) =>
        sameId(r.festId, selectedFundFest.id) &&
        r.deptKey === deptKey &&
        r.classSection === classSection
    );

  const handleSendToCoordinator = async () => {
    if (!selectedFundFest) {
      setFundMessage({ type: 'error', text: 'Select a fest first.' });
      return;
    }
    if (cashClassAmount <= 0 || cashClassStudents.length === 0) {
      setFundMessage({
        type: 'error',
        text: 'No cash collected to send yet. Online Stripe payments go directly to the coordinator.',
      });
      return;
    }

    setRemitBusy(true);
    setFundMessage({ type: '', text: '' });
    try {
      const payload = {
        festId: selectedFundFest.id,
        festName: selectedFundFest.name,
        department: dept,
        deptKey,
        classSection,
        teacherId: teacher.id,
        teacherName: teacher.name || 'Class Teacher',
        paidStudentCount: paidClassStudents.length,
        totalStudentCount: classStudents.length,
        amount: cashClassAmount,
        status: 'sent',
        sentAt: new Date().toISOString(),
      };

      const res = await fetch(
        currentRemittance ? `${API_BASE}/fundRemittances/${currentRemittance.id}` : `${API_BASE}/fundRemittances`,
        {
          method: currentRemittance ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('Could not send collected cash to the Department Coordinator.');
      await loadFundData();
      setFundMessage({
        type: 'ok',
        text: `Sent ₹${cashClassAmount.toLocaleString('en-IN')} cash (${cashClassStudents.length} cash payments) to ${dept} Coordinator.`,
      });
    } catch (err) {
      setFundMessage({ type: 'error', text: err.message });
    } finally {
      setRemitBusy(false);
    }
  };

  const handleDecideStudent = async (stu, approve) => {
    if (!approve && !window.confirm(`Reject the registration of ${stu.name}?`)) return;
    setApprovalBusy(true);
    setFundMessage({ type: '', text: '' });
    try {
      const endpoint = approve ? `/users/${stu.id}/approve` : `/users/${stu.id}/reject`;
      const payload = approve
        ? { approvalMethod: 'class_teacher', approvedBy: teacher.name || 'Class teacher' }
        : { rejectedBy: teacher.name || 'Class teacher' };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
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
      const res = await fetch(`${API_BASE}/users/${stu.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ rejectedBy: teacher.name || 'Class teacher', rejectedReason: 'Account removed' }),
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
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
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
      const res = await fetch(`${API_BASE}/payments/${pay.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Could not undo the payment.');
      await loadFundData();
      setFundMessage({ type: 'ok', text: `Cash payment for ${student.name} removed.` });
    } catch (err) {
      setFundMessage({ type: 'error', text: err.message });
    } finally {
      setFundBusy(false);
    }
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
      onEmergencyCall={() => setSosOpen(true)}
    >
    <header className="relative mb-8 overflow-hidden rounded-2xl bg-[#072C31] text-white shadow-sm">
        <Photo src="/banner.png" alt="" eager className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#072C31] via-[#072C31]/80 to-[#072C31]/10" />
        <div className="relative z-10 flex flex-col justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
              <span className="h-2 w-2 rounded-full bg-[#F5A623]" />
              Faculty Workspace
            </div>
            <h1 className="fest-display text-2xl font-extrabold tracking-tight sm:text-3xl">
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
              {isVolunteerHead && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  Volunteer Head · {volunteerHeadFests.map((f) => f.name).join(', ')}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-md text-sm text-white/75">
              Your duties for {dept} appear below as your department coordinator assigns them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {isVolunteerHead && (
              <Link
                to={volunteerDashboardPath}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2.5 text-sm font-bold text-[#2A1A00] shadow-sm transition hover:bg-[#FFB83D]"
              >
                <Shield size={15} />
                Volunteers Dashboard
              </Link>
            )}
            <Link to="/" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
              <ArrowLeft size={15} />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {profileError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">
          {profileError}
        </p>
      )}

      {teacher && !hasAnyDuty && (
        <section className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="fest-display text-lg font-extrabold text-[#0B3F46]">
            {isVolunteerHead ? 'Volunteer Head Assigned' : 'No duties assigned yet'}
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isVolunteerHead
              ? `You are assigned as Volunteer Head for ${volunteerHeadFests.map((f) => f.name).join(', ')}. Open the Volunteers Dashboard to assign student duties and manage alerts.`
              : 'Your account is approved. Your department coordinator will assign you as a class teacher and/or give you programs for data entry. Refresh this page after they do.'}
          </p>
          {isVolunteerHead && (
            <div className="mt-5">
              <Link
                to={volunteerDashboardPath}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0E4D55]"
              >
                <Shield size={16} className="text-[#F5A623]" />
                Open Volunteers Dashboard
              </Link>
            </div>
          )}
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
        <div className="space-y-4">
          {selectedFundFest && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {selectedFundFest.name} · {classSection}
                  </p>
                  <h3 className="fest-display text-base font-extrabold text-[#0B3F46]">
                    Fund Collection Overview
                  </h3>
                </div>
                <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
                  Total Collected: ₹{(onlineClassAmount + cashClassAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200/80 bg-[#F4FBF7] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#218653]">
                      Paid Online (Stripe)
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#218653]">
                      {onlineClassStudents.length} {onlineClassStudents.length === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-2xl font-extrabold text-[#0B3F46]">
                    ₹{onlineClassAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Sent directly online. No handover required.
                  </p>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-amber-200/90 bg-[#FFFDF7] p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9A6700]">
                        Cash Collected in Hand
                      </span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-[#8A5A00]">
                        {cashClassStudents.length} {cashClassStudents.length === 1 ? 'student' : 'students'}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-2xl font-extrabold text-[#0B3F46]">
                      ₹{cashClassAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {currentRemittance?.status === 'verified'
                        ? `Verified by coordinator (₹${Number(currentRemittance.amount).toLocaleString('en-IN')})`
                        : currentRemittance
                          ? `Sent to coordinator (₹${Number(currentRemittance.amount).toLocaleString('en-IN')})`
                          : 'Hand over cash collected from students to coordinator.'}
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={remitBusy || cashClassAmount <= 0 || currentRemittance?.status === 'verified'}
                      onClick={handleSendToCoordinator}
                      className="w-full rounded-xl bg-[#0B3F46] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0E4D55] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {currentRemittance?.status === 'verified'
                        ? '✓ Cash Verified by Coordinator'
                        : currentRemittance
                          ? `Resend Cash (₹${cashClassAmount.toLocaleString('en-IN')})`
                          : `Send ₹${cashClassAmount.toLocaleString('en-IN')} Cash to Coordinator`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ClassFundTab
            classSection={classSection}
            deptFund={deptFund}
            fundFests={fundFests}
            fundFestId={fundFestId}
            setFundFestId={setFundFestId}
            setFundMessage={setFundMessage}
            fundMessage={fundMessage}
            classStudents={classStudents}
            paidStudents={paidClassStudents}
            paidPaymentOf={paidPaymentOf}
            fundBusy={fundBusy}
            handleMarkCashPaid={handleMarkCashPaid}
            handleUndoCash={handleUndoCash}
          />
        </div>
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
          handleSubmitList={handleSubmitList}
          participants={participants}
          pendingCount={pendingCount}
          handleDeleteParticipant={handleDeleteParticipant}
          PENDING={PENDING}
        />
      )}

      {activeTab === 'committee' && committeeDuties.length > 0 && (
        <CommitteeDutiesTab committeeDuties={committeeDuties} />
      )}

      <SosModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        defaultLocation={classSection ? `${dept} · ${classSection}` : dept}
        onSubmit={async ({ matter, location }) => {
          await triggerSosAlert({
            senderName: teacher?.name || 'Faculty',
            senderRole: isClassTeacher ? `Class Teacher (${classSection})` : 'Teacher',
            department: dept,
            classSection,
            matter,
            location,
          });
          alert('Emergency SOS alert sent to the Volunteer Team!');
        }}
      />

      <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} CampusFest. Faculty Portal.</p>
        <p>Making every campus event memorable.</p>
      </footer>
    </Teacherlayout>
  );
}