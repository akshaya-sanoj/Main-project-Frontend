import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Users,
  ArrowLeft,
  ArrowUpRight,
  ClipboardList,
  IndianRupee,
  Phone,
  Wallet,
  AlertCircle,
  ShieldAlert,
  BadgeCheck,
  PhoneCall,
} from 'lucide-react';
import { rosterKey, normalizeDept } from '../../utils/deptKeys';
import { API_BASE } from '../../services/api';

const sameId = (a, b) => String(a) === String(b);

// localStorage hook that reloads whenever the key changes.
// Pass key = null until the teacher is known, so data never lands under the wrong key.
function useKeyedStorage(key, initialValue) {
  const [stored, setStored] = useState({ key: null, value: initialValue });

  useEffect(() => {
    if (!key) return;
    let loaded = initialValue;
    try {
      const saved = localStorage.getItem(key);
      if (saved) loaded = JSON.parse(saved);
    } catch (e) {
      console.error('Error loading', key, e);
    }
    setStored({ key, value: loaded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!key || stored.key !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(stored.value));
    } catch (e) {
      console.error('Error saving', key, e);
    }
  }, [stored, key]);

  const value = key && stored.key === key ? stored.value : initialValue;

  const setValue = (next) => {
    setStored((prev) => {
      const current = key && prev.key === key ? prev.value : initialValue;
      return { key, value: typeof next === 'function' ? next(current) : next };
    });
  };

  return [value, setValue];
}

export default function TeacherDashboard() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [profileError, setProfileError] = useState('');

  // Always load the latest profile from the server, so duties given by the
  // coordinator show up without needing a new login.
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
  const teacherName = teacher?.name || '';

  // ---- Duties come from saved data, not from the login role ----
  const classSection = teacher?.classSection || '';
  const isClassTeacher =
    Array.isArray(teacher?.duties) &&
    teacher.duties.includes('class_teacher') &&
    !!classSection;

  // Programs assigned to this teacher by the department coordinator (saved on the server)
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

  // State keys for strict data isolation (null until the teacher is loaded)
  const participantsKey = teacherKey ? `teacher_participants_${teacherKey}` : null;
  const committeeDutiesKey = teacherKey ? `teacher_committee_duties_${teacherKey}` : null;

  const [participants, setParticipants] = useKeyedStorage(participantsKey, []);

  // Committee duties assigned by the fest committee (read only)
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

  const [selectedEventId, setSelectedEventId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState(dept);
  const [semester, setSemester] = useState('');
  const [phone, setPhone] = useState('');
  const [groupMembers, setGroupMembers] = useState('');

  // Keep the department field in step with the teacher's department once it loads
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

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !chosenEvent) return;

    let memberList = [];
    if (isGroupEvent && groupMembers.trim()) {
      memberList = groupMembers.split(',').map((m) => m.trim()).filter(Boolean);
    }

    const newParticipant = {
      id: Date.now(),
      eventName: chosenEvent.eventName,
      eventType: chosenEvent.eventType,
      studentName: isGroupEvent ? `${studentName.trim()} (Team Leader)` : studentName.trim(),
      studentId: studentId.trim(),
      department: department.trim() || dept,
      semester: semester.trim(),
      phone: phone.trim(),
      members: memberList,
      status: 'Pending Submission',
    };

    setParticipants((prev) => [...prev, newParticipant]);
    setStudentName('');
    setStudentId('');
    setSemester('');
    setPhone('');
    setGroupMembers('');
  };

  const handleDeleteParticipant = (participantId) => {
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  const submittedCount = participants.filter((p) => p.status === 'Submitted to Coordinator').length;
  const pendingCount = participants.length - submittedCount;

  // Push this teacher's participant roster to the department coordinator portal
  const handleSubmitRoster = () => {
    if (participants.length === 0) {
      alert('No participant records available to submit.');
      return;
    }

    const now = new Date().toISOString();
    const teacherDisplayName = teacher?.name || 'Faculty';

    const updatedParticipants = participants.map((p) => ({
      ...p,
      status: 'Submitted to Coordinator',
      submittedBy: teacherDisplayName,
      submittedAt: now,
    }));

    setParticipants(updatedParticipants);

    const key = rosterKey(dept);
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      existing = [];
    }

    const others = existing.filter((r) => r.teacherName !== teacherDisplayName);
    others.push({
      teacherName: teacherDisplayName,
      teacherEmail: teacher?.email || '',
      department: dept,
      participants: updatedParticipants,
      submittedAt: now,
    });

    localStorage.setItem(key, JSON.stringify(others));

    alert(`Successfully submitted ${participants.length} participant records to the Department Coordinator for ${dept}!`);
  };

  // ---- Class fund: her students pay from their own dashboards; she only sees the result ----
  const [classStudents, setClassStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deptFund, setDeptFund] = useState(null);
  const [fundMessage, setFundMessage] = useState({ type: '', text: '' });
  const [fundBusy, setFundBusy] = useState(false);

  const loadFundData = useCallback(async () => {
    if (!teacher?.id || !isClassTeacher) return;
    const get = (path) => fetch(`${API_BASE}${path}`).then((r) => (r.ok ? r.json() : []));
    try {
      const [users, pays, funds] = await Promise.all([get('/users'), get('/payments'), get('/deptFunds')]);
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
      setPayments(Array.isArray(pays) ? pays : []);
      setDeptFund((Array.isArray(funds) ? funds : []).find((f) => f.deptKey === deptKey) || null);
    } catch (err) {
      console.error('Failed to load class fund data', err);
    }
  }, [teacher?.id, isClassTeacher, classSection, deptKey]);

  useEffect(() => {
    loadFundData();
    window.addEventListener('focus', loadFundData);
    return () => window.removeEventListener('focus', loadFundData);
  }, [loadFundData]);

  const paidPaymentOf = (studentId) =>
    payments.find((p) => sameId(p.studentId, studentId) && p.status === 'paid');

  const paidStudents = classStudents.filter((u) => paidPaymentOf(u.id));
  const totalClassCollection = paidStudents.reduce(
    (sum, u) => sum + (Number(paidPaymentOf(u.id).amount) || 0),
    0
  );

  // Cash handed to the class teacher can be recorded by her
  const handleMarkCashPaid = async (student) => {
    if (!deptFund?.amount) {
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
      setFundMessage({ type: 'ok', text: `${student.name} marked as paid in cash.` });
    } catch (err) {
      setFundMessage({ type: 'error', text: err.message });
    } finally {
      setFundBusy(false);
    }
  };

  // Only cash entries can be undone here. Online payments are never edited by the teacher.
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

  const teacherInitials = teacher?.name
    ? teacher.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'TR';

  const hasAnyDuty = isClassTeacher || hasProgramDuty || committeeDuties.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F8F8] text-[#173B40] flex flex-col md:flex-row font-['DM_Sans',sans-serif]">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0B3F46] text-white md:min-h-screen md:sticky md:top-0 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#0B3F46]">
                <GraduationCap size={23} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Campus<span className="text-[#F5A623]">Fest</span>
                </h2>
                <p className="text-[10px] text-white/60 uppercase tracking-[2px]">
                  Faculty Portal
                </p>
              </div>
            </Link>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3">
              <div className="w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center text-[#0B3F46] font-bold">
                {teacherInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {teacher?.name || 'Loading Teacher...'}
                </p>
                <p className="text-[10px] text-[#F5A623]">
                  {dept}
                </p>
                {isClassTeacher && (
                  <p className="text-[10px] text-white/70 mt-0.5">Class teacher: {classSection}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Support */}
          <div className="p-4 mx-4 mb-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl">
            <p className="text-xs font-bold text-rose-200 mb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} /> Emergency Support
            </p>
            <button
              onClick={handleEmergencyCall}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs transition shadow-sm"
            >
              <PhoneCall size={14} /> Call Volunteer Team
            </button>
          </div>

          <nav className="px-4 space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-[2px] font-bold px-3 mb-3">
              Faculty Actions
            </p>

            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-[#F5A623] text-[#0B3F46] shadow-lg">
              <Users size={18} />
              <span>My Duties</span>
              <ArrowUpRight size={15} className="ml-auto" />
            </div>
          </nav>
        </div>

        <div className="p-5 border-t border-white/10">
          <Link
            to="/login"
            onClick={() => localStorage.removeItem('fest_user')}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-[#F5A623] transition"
          >
            <ArrowLeft size={16} />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-9 space-y-8">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E7]">
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
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {profileError}
          </p>
        )}

        {/* No duties yet */}
        {teacher && !hasAnyDuty && (
          <section className="bg-white border border-[#E4ECEC] rounded-3xl p-8 text-center shadow-sm">
            <BadgeCheck size={34} className="mx-auto text-[#A8B8BA] mb-3" />
            <h2 className="text-lg font-extrabold text-[#0B3F46]">No duties assigned yet</h2>
            <p className="text-sm text-[#718589] mt-2 max-w-md mx-auto">
              Your account is approved. Your department coordinator will assign you as a class teacher
              and/or give you programs for data entry. Refresh this page after they do.
            </p>
          </section>
        )}

        {/* Overview Cards */}
        {(isClassTeacher || hasProgramDuty) && (
          <div className={`grid grid-cols-1 gap-4 ${isClassTeacher ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className="bg-white border border-[#E4ECEC] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#E6F1F2] text-[#0B3F46] flex items-center justify-center">
                  <Users size={21} />
                </div>
                <span className="text-xs font-semibold text-[#718589]">Participants</span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#0B3F46] mt-4">{participants.length}</h3>
              <p className="text-xs text-[#718589] mt-1">Total registered students</p>
            </div>

            {isClassTeacher && (
              <div className="bg-white border border-[#E4ECEC] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF3D6] text-[#C47A08] flex items-center justify-center">
                    <Wallet size={21} />
                  </div>
                  <span className="text-xs font-semibold text-[#718589]">Class Fund</span>
                </div>
                <h3 className="text-3xl font-extrabold text-[#0B3F46] mt-4">₹{totalClassCollection}</h3>
                <p className="text-xs text-[#718589] mt-1">Fund collected for {classSection}</p>
              </div>
            )}

            <div className="bg-white border border-[#E4ECEC] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#FCE7EF] text-[#D6336C] flex items-center justify-center">
                  <AlertCircle size={21} />
                </div>
                <span className="text-xs font-semibold text-[#718589]">Pending</span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#0B3F46] mt-4">{pendingCount}</h3>
              <p className="text-xs text-[#718589] mt-1">Entries awaiting submission</p>
            </div>
          </div>
        )}

        {/* SECTION 1: Fest Committee Duties (only if assigned) */}
        {committeeDuties.length > 0 && (
          <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-[#FFF3D6] text-[#C47A08] rounded-xl flex items-center justify-center">
                <BadgeCheck size={21} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0B3F46]">Fest Committee Assigned Duties</h2>
                <p className="text-xs text-[#718589] mt-1">Official responsibilities allocated to you by the fest committee.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {committeeDuties.map((duty) => (
                <div key={duty.id} className="bg-[#F8FAFA] border border-[#DCE7E7] rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#E6F1F2] text-[#0B6870]">
                        {duty.committee}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {duty.status}
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-[#0B3F46] mt-1">{duty.role}</p>
                  </div>
                  <p className="text-xs text-[#718589] mt-4 pt-3 border-t border-[#EDF1F1] flex items-center gap-1.5">
                    🕒 Timing: <span className="font-bold text-[#173B40]">{duty.timing}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: Class fund status (only for class teachers) */}
        {isClassTeacher && (
          <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#E6F5EC] text-[#218653] rounded-xl flex items-center justify-center">
                  <IndianRupee size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#0B3F46]">Fest Fund Status · {classSection}</h2>
                  <p className="text-xs text-[#718589] mt-1">
                    Students pay from their own dashboards. This list updates by itself.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-[#718589]">Fund per student</p>
                <p className="font-mono text-lg font-bold text-[#0B3F46]">
                  {deptFund ? `₹${deptFund.amount}` : 'Not set'}
                </p>
              </div>
            </div>

            {!deptFund && (
              <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                Your department coordinator has not set the fest fund amount yet. Students cannot pay until it is set.
              </p>
            )}

            {fundMessage.text && (
              <p
                role={fundMessage.type === 'error' ? 'alert' : 'status'}
                className={`mb-5 rounded-xl border px-4 py-3 text-xs font-bold ${
                  fundMessage.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                {fundMessage.text}
              </p>
            )}

            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-[#F8FAFA] border border-[#DCE7E7] p-3">
                <p className="text-xl font-extrabold text-[#0B3F46]">{classStudents.length}</p>
                <p className="text-[11px] text-[#718589]">Students</p>
              </div>
              <div className="rounded-2xl bg-[#E6F5EC] border border-emerald-200 p-3">
                <p className="text-xl font-extrabold text-[#218653]">{paidStudents.length}</p>
                <p className="text-[11px] text-[#718589]">Paid</p>
              </div>
              <div className="rounded-2xl bg-[#FCE7EF] border border-rose-200 p-3">
                <p className="text-xl font-extrabold text-[#D6336C]">{classStudents.length - paidStudents.length}</p>
                <p className="text-[11px] text-[#718589]">Unpaid</p>
              </div>
            </div>

            {classStudents.length === 0 ? (
              <p className="p-8 text-center text-xs text-[#91A1A3]">
                No approved students in {classSection} yet. Students appear here after they register with this class and are approved.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[560px]">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[#718589] text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-3 font-bold">Student</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF1F1]">
                    {classStudents.map((stu) => {
                      const pay = paidPaymentOf(stu.id);
                      return (
                        <tr key={stu.id} className="hover:bg-[#F8FAFA] transition">
                          <td className="px-4 py-3">
                            <p className="font-bold text-sm text-[#173B40]">{stu.name}</p>
                            <p className="text-xs text-[#718589] font-mono">Reg: {stu.registerNo || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            {pay ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E6F5EC] text-[#218653]">
                                <CheckCircle2 size={12} />
                                Paid ₹{pay.amount} · {pay.provider === 'cash' ? 'cash' : 'online'}
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FCE7EF] text-[#D6336C]">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!pay && (
                              <button
                                type="button"
                                disabled={fundBusy || !deptFund}
                                onClick={() => handleMarkCashPaid(stu)}
                                className="rounded-lg border border-[#DCE7E7] bg-white px-3 py-1.5 text-xs font-bold text-[#0B3F46] hover:bg-[#F5F8F8] disabled:opacity-50"
                              >
                                Mark paid (cash)
                              </button>
                            )}
                            {pay && pay.provider === 'cash' && (
                              <button
                                type="button"
                                disabled={fundBusy}
                                onClick={() => handleUndoCash(stu)}
                                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#D6336C] hover:bg-[#FCE7EF] disabled:opacity-50"
                              >
                                Undo
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: Program data entry (only for teachers assigned to programs) */}
        {hasProgramDuty && (
          <>
            <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-[#E6F1F2] text-[#0B3F46] rounded-xl flex items-center justify-center">
                  <ClipboardList size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#0B3F46]">Enter Student Details for Assigned Programs</h2>
                  <p className="text-xs text-[#718589] mt-1">Register students for programs assigned to you by your dept coordinator.</p>
                </div>
              </div>

              <form onSubmit={handleAddParticipant} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 xl:col-span-1">
                    <label className="block text-xs font-bold text-[#456166] mb-2">Select Assigned Event</label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                    >
                      {assignedEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.eventName}{ev.festName ? ` · ${ev.festName}` : ''} [{ev.eventType}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#456166] mb-2">Student Full Name</label>
                    <input
                      type="text"
                      placeholder={isGroupEvent ? 'Team Leader Name' : 'Enter student name'}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#456166] mb-2">Student ID / Roll Number</label>
                    <input
                      type="text"
                      placeholder="Enter student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#456166] mb-2">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#456166] mb-2">Semester / Year</label>
                    <input
                      type="text"
                      placeholder="e.g. S6"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#456166] mb-2">Contact Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                    />
                  </div>
                </div>

                {isGroupEvent && (
                  <div>
                    <label className="block text-xs font-bold text-[#456166] mb-2">
                      Group Members (Comma-separated names & IDs)
                      {chosenEvent?.maxGroupSize ? ` · up to ${chosenEvent.maxGroupSize}` : ''}
                    </label>
                    <input
                      type="text"
                      placeholder="Ananya S. (ID-02), Rahul V. (ID-03)"
                      value={groupMembers}
                      onChange={(e) => setGroupMembers(e.target.value)}
                      className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#EDF1F1]">
                  <p className="text-xs text-[#718589]">
                    Note: Department fest funds are collected separately. Register event participants below.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#FFB83D] text-[#0B3F46] font-extrabold py-3 px-6 rounded-xl transition shadow-sm"
                  >
                    <Plus size={18} />
                    Save Student Entry
                  </button>
                </div>
              </form>
            </section>

            {/* Participants Roster */}
            <section className="bg-white border border-[#E4ECEC] rounded-3xl shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-[#E4ECEC] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#0B3F46]">Registered Participants Roster</h2>
                  <p className="text-xs text-[#718589] mt-1">Review participant information and submission status.</p>
                </div>

                <button
                  onClick={handleSubmitRoster}
                  disabled={participants.length === 0 || pendingCount === 0}
                  className="inline-flex items-center justify-center gap-2 bg-[#0B3F46] hover:bg-[#0B6870] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Send size={16} />
                  Submit Rosters to Coordinator
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[#718589] text-[11px] uppercase tracking-wider">
                      <th className="px-5 py-4 font-bold">Student Details</th>
                      <th className="px-5 py-4 font-bold">Academic Info</th>
                      <th className="px-5 py-4 font-bold">Assigned Event</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                      <th className="px-5 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF1F1]">
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-5 py-12 text-center">
                          <Users size={32} className="mx-auto text-[#A8B8BA] mb-3" />
                          <p className="text-sm font-bold text-[#456166]">No participants registered yet</p>
                          <p className="text-xs text-[#91A1A3] mt-1">Use the form above to add student details.</p>
                        </td>
                      </tr>
                    ) : (
                      participants.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8FAFA] transition align-top">
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#E6F1F2] text-[#0B3F46] flex items-center justify-center font-bold text-xs shrink-0">
                                {item.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#173B40]">{item.studentName}</p>
                                <p className="text-xs text-[#0B6870] font-mono mt-1">ID: {item.studentId}</p>
                                {item.phone && (
                                  <p className="text-xs text-[#718589] mt-1 flex items-center gap-1">
                                    <Phone size={11} /> {item.phone}
                                  </p>
                                )}
                                {item.members?.length > 0 && (
                                  <p className="text-xs text-[#718589] mt-2 max-w-[220px]">
                                    <span className="font-bold text-[#456166]">Team:</span> {item.members.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#173B40]">{item.department}</p>
                            <p className="text-xs text-[#718589] mt-1">{item.semester || 'Semester not provided'}</p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-[#173B40]">{item.eventName}</p>
                            <span className={`inline-flex mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              item.eventType === 'Single' ? 'bg-[#E6F1F2] text-[#0B6870]' : 'bg-[#FCE7EF] text-[#D6336C]'
                            }`}>
                              {item.eventType} Event
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                              item.status === 'Submitted to Coordinator' ? 'bg-[#E6F5EC] text-[#218653]' : 'bg-[#FFF3D6] text-[#B7791F]'
                            }`}>
                              {item.status === 'Submitted to Coordinator' && <CheckCircle2 size={13} />}
                              {item.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteParticipant(item.id)}
                              title="Delete participant"
                              className="p-2 rounded-lg text-[#D6336C] hover:bg-[#FCE7EF] transition"
                            >
                              <Trash2 size={17} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="mt-10 pt-5 border-t border-[#DCE7E7] flex flex-col sm:flex-row justify-between gap-2 text-xs text-[#91A1A3]">
          <p>© 2026 CampusFest. Faculty Portal.</p>
          <p>Making every campus event memorable.</p>
        </footer>

      </main>
    </div>
  );
}