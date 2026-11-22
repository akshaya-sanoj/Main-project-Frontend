import React, { useState, useEffect, useCallback } from 'react';
import { normalizeDept } from '../../utils/deptKeys';
import { API_BASE, authHeaders } from '../../services/api';
import { Link } from 'react-router-dom';
import Coordinatorlayout from '../components/Coordinatorlayout';
import TeachersTab from '../components/TeachersTab';
import FundsTab from '../components/FundsTab';
import ClassListsTab from '../components/ClassListsTab';
import VolunteersTab from '../components/VolunteersTab';
import SubmissionsTab from '../components/SubmissionsTab';
import Photo from '../../components/Photo';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(`Cannot reach the server at ${API_BASE}. Is it running?`);
  }
  if (!res.ok) {
    const isList = path.split('/').filter(Boolean).length === 1;
    if (res.status === 404 && isList) {
      throw new Error('The server has no list for this yet. Check that db.json has "fests", "programs", "sections", "deptFunds", "payments", "registrations", "classLists" and "staffLists", then restart it.');
    }
    throw new Error(res.status === 404 ? 'That item was not found. It may already have been removed.' : 'The server could not save that. Please try again.');
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
    const savedUser = (sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user'));
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCoordinator(parsed);
        if (parsed.id) {
          fetch(`${API_BASE}/users/${parsed.id}`, { headers: authHeaders() })
            .then((res) => (res.ok ? res.json() : null))
            .then((fresh) => {
              if (fresh) {
                setCoordinator((prev) => ({
                  ...prev,
                  ...fresh,
                  token: fresh.token || parsed.token || prev?.token,
                }));
              }
            })
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
  const [fundRemittances, setFundRemittances] = useState([]);
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
  const [classLists, setClassLists] = useState([]);

  const [selectedVolStudentId, setSelectedVolStudentId] = useState('');
  const [volRole, setVolRole] = useState('');

  const loadAll = useCallback(async () => {
    const optional = (path) => request(path).catch(() => []);
    const [u, f, p, sec, df, pay, regs, staff, lists, rems] = await Promise.all([
      request('/users'),
      request('/fests'),
      request('/programs'),
      optional('/sections'),
      optional('/deptFunds'),
      optional('/payments'),
      optional('/registrations'),
      optional('/staffLists'),
      optional('/classLists'),
      optional('/fundRemittances'),
    ]);
    setUsers(Array.isArray(u) ? u : []);
    setFests(Array.isArray(f) ? f : []);
    setPrograms(Array.isArray(p) ? p : []);
    setSections(Array.isArray(sec) ? sec : []);
    setDeptFunds(Array.isArray(df) ? df : []);
    setPayments(Array.isArray(pay) ? pay : []);
    setRegistrations(Array.isArray(regs) ? regs : []);
    setStaffLists(Array.isArray(staff) ? staff : []);
    setClassLists(Array.isArray(lists) ? lists : []);
    setFundRemittances(Array.isArray(rems) ? rems : []);
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

  const fail = (message) => {
    setTeacherError(message);
    setTeacherNotice('');
  };

  const deptTeachers = users.filter(
    (u) =>
      u.baseType === 'teacher' &&
      u.approved !== false &&
      !u.rejected &&
      (u.staffId || u.email) &&
      u.role !== 'dept_coordinator' &&
      !(u.duties || []).includes('dept_coordinator') &&
      normalizeDept(u.department || '') === deptKey
  );

  const myFestIds = Array.isArray(coordinator?.festIds) && coordinator.festIds.length > 0 ? coordinator.festIds : null;
  const myFests = fests.filter((f) => !myFestIds || myFestIds.some((id) => sameId(id, f.id)));
  const myFestKey = myFests.map((f) => f.id).join(',');

  useEffect(() => {
    if (myFests.length > 0 && !myFests.some((f) => sameId(f.id, selectedFestId))) {
      setSelectedFestId(String(myFests[myFests.length - 1].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myFestKey, selectedFestId]);

  const selectedFest = myFests.find((f) => sameId(f.id, selectedFestId)) || null;
  const publishedPrograms = selectedFest && selectedFest.published ? programs.filter((p) => sameId(p.festId, selectedFest.id)) : [];
  const programsOfTeacher = (teacherId) => publishedPrograms.filter((p) => ((p.assignments || {})[deptKey] || []).some((id) => sameId(id, teacherId)));
  const isClassTeacher = (u) => (u.duties || []).includes('class_teacher') && !!u.classSection;

  const deptSections = sections.filter((s) => s.deptKey === deptKey);
  const allDeptStudents = users.filter((u) => u.baseType === 'student' && !u.rejected && normalizeDept(u.department || '') === deptKey);
  const deptStudents = allDeptStudents.filter((u) => u.approved !== false);
  const classTeacherOfSection = (name) => deptTeachers.find((t) => isClassTeacher(t) && t.classSection === name);
  const takenSections = deptTeachers.filter(isClassTeacher).map((t) => t.classSection);
  const freeSections = deptSections.filter((sec) => !takenSections.includes(sec.name));

  const handleSetClassTeacher = async (teacher) => {
    const section = (classInputs[teacher.id] || '').trim();
    if (section.length < 2) {
      fail('Choose a class first. Add classes on the Classes & Fund tab.');
      return;
    }
    const clash = deptTeachers.find(
      (t) => !sameId(t.id, teacher.id) && isClassTeacher(t) && t.classSection.trim().toLowerCase() === section.toLowerCase()
    );
    if (clash) {
      fail(`${clash.name} is already the class teacher of ${section}.`);
      return;
    }
    const duties = Array.from(new Set([...(teacher.duties || ['teacher']), 'class_teacher']));
    const ok = await run(
      () => request(`/users/${teacher.id}`, send('PATCH', { duties, classSection: section })),
      `${teacher.name} is now the class teacher of ${section}.`
    );
    if (ok) setClassInputs((prev) => ({ ...prev, [teacher.id]: '' }));
  };

  const handleRemoveClassTeacher = async (teacher) => {
    if (!window.confirm(`Remove ${teacher.name} as class teacher of ${teacher.classSection}?`)) return;
    const duties = (teacher.duties || []).filter((d) => d !== 'class_teacher');
    await run(
      () => request(`/users/${teacher.id}`, send('PATCH', {
        duties,
        classSection: null,
        role: teacher.role === 'class_teacher' ? 'teacher' : teacher.role,
      })),
      `${teacher.name} is no longer a class teacher.`
    );
  };

  const handleAssignProgram = async (teacher) => {
    const programId = programPick[teacher.id];
    if (!programId) {
      fail('Choose a program first.');
      return;
    }
    const prog = programs.find((p) => sameId(p.id, programId));
    if (!prog) return;
    const list = (prog.assignments || {})[deptKey] || [];
    if (list.some((id) => sameId(id, teacher.id))) {
      fail(`${teacher.name} is already assigned to ${prog.name}.`);
      return;
    }
    const ok = await run(
      () => request(`/programs/${prog.id}`, send('PATCH', { assignments: { ...(prog.assignments || {}), [deptKey]: [...list, teacher.id] } })),
      `${teacher.name} assigned to ${prog.name}.`
    );
    if (ok) setProgramPick((prev) => ({ ...prev, [teacher.id]: '' }));
  };

  const handleUnassignProgram = async (teacher, prog) => {
    const list = ((prog.assignments || {})[deptKey] || []).filter((id) => !sameId(id, teacher.id));
    await run(
      () => request(`/programs/${prog.id}`, send('PATCH', { assignments: { ...(prog.assignments || {}), [deptKey]: list } })),
      `${teacher.name} removed from ${prog.name}.`
    );
  };

  const deptRegistrations = registrations.filter(
    (r) => r.deptKey === deptKey && selectedFest && sameId(r.festId, selectedFest.id) && r.status !== 'Pending Submission'
  );
  const teacherSubmissions = Object.values(
    deptRegistrations.reduce((acc, r) => {
      const key = String(r.teacherId);
      if (!acc[key]) acc[key] = { teacherName: r.teacherName, submittedAt: r.submittedAt, participants: [] };
      acc[key].participants.push(r);
      if (String(r.submittedAt || '') > String(acc[key].submittedAt || '')) acc[key].submittedAt = r.submittedAt;
      return acc;
    }, {})
  );

  const toForward = deptRegistrations.filter((r) => r.status === 'Submitted to Coordinator');
  const forwardedCount = deptRegistrations.length - toForward.length;

  const handleForwardToAdmin = async () => {
    if (toForward.length === 0) {
      fail('There are no new entries to forward.');
      return;
    }
    const now = new Date().toISOString();
    await run(
      () => Promise.all(toForward.map((r) => request(`/registrations/${r.id}`, send('PATCH', {
        status: 'Forwarded to Admin',
        forwardedAt: now,
        forwardedBy: coordinator?.name || 'Coordinator',
        forwardedById: coordinator?.id ?? null,
      })))),
      `Forwarded ${toForward.length} ${toForward.length === 1 ? 'entry' : 'entries'} from ${dept} to the Super Admin.`
    );
  };

  const deptFund = (selectedFest && deptFunds.find((f) => f.deptKey === deptKey && sameId(f.festId, selectedFest.id))) || null;

  const paidPaymentOf = (studentId) =>
    payments.find((p) => sameId(p.studentId, studentId) && p.status === 'paid' && selectedFest && sameId(p.festId, selectedFest.id));

  const sectionStats = (sec) => {
    const students = deptStudents.filter((u) => u.classSection === sec.name);
    const paidList = students.filter((u) => paidPaymentOf(u.id));
    const collected = paidList.reduce((sum, u) => sum + (Number(paidPaymentOf(u.id).amount) || 0), 0);
    const remittance =
      selectedFest &&
      fundRemittances.find(
        (r) => sameId(r.festId, selectedFest.id) && r.deptKey === deptKey && r.classSection === sec.name
      );
    return { total: students.length, paid: paidList.length, collected, remittance: remittance || null };
  };

  const totalCollected = deptSections.reduce((sum, sec) => sum + sectionStats(sec).collected, 0);

  const handleVerifyRemittance = async (rem) => {
    if (!rem?.id) return;
    await run(
      () =>
        request(
          `/fundRemittances/${rem.id}`,
          send('PATCH', { status: 'verified', verifiedAt: new Date().toISOString() })
        ),
      `Verified ₹${Number(rem.amount).toLocaleString('en-IN')} received from ${rem.classSection}.`
    );
  };

  const handleSaveFund = async (e) => {
    e.preventDefault();
    if (!selectedFest) {
      fail('Choose a fest first.');
      return;
    }
    const amount = Number(fundInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      fail('Enter a fund amount greater than 0.');
      return;
    }
    const body = { festId: selectedFest.id, deptKey, department: dept, amount, updatedAt: new Date().toISOString() };
    const ok = await run(
      () => (deptFund ? request(`/deptFunds/${deptFund.id}`, send('PATCH', body)) : request('/deptFunds', send('POST', body))),
      `Fest fund for ${dept} in ${selectedFest.name} set to ₹${amount}.`
    );
    if (ok) setFundInput('');
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    const name = sectionInput.trim();
    if (name.length < 2) {
      fail('Enter a class name, for example "S6 CSE - A".');
      return;
    }
    if (deptSections.some((sec) => sec.name.toLowerCase() === name.toLowerCase())) {
      fail('This class already exists.');
      return;
    }
    const ok = await run(
      () => request('/sections', send('POST', { deptKey, department: dept, name })),
      `Class "${name}" added. Students can now choose it when they register.`
    );
    if (ok) setSectionInput('');
  };

  const handleDeleteSection = async (sec) => {
    if (allDeptStudents.some((u) => u.classSection === sec.name) || classTeacherOfSection(sec.name)) {
      fail('This class has students or a class teacher, so it cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete class "${sec.name}"?`)) return;
    await run(() => request(`/sections/${sec.id}`, { method: 'DELETE' }), 'Class deleted.');
  };

  // ---------- Contribute Students to Volunteer Committee ----------
  const deptCommitteeStudents = deptStudents.filter((u) => Boolean(u.volunteerCommittee));

  const handleContributeVolunteer = async (e) => {
    e.preventDefault();
    if (!selectedVolStudentId) {
      fail('Choose a student from your department first.');
      return;
    }
    const stu = deptStudents.find((s) => sameId(s.id, selectedVolStudentId));
    if (!stu) return;

    const prevFests = Array.isArray(stu.volunteerFestIds) ? stu.volunteerFestIds : [];
    const nextFests =
      selectedFest && !prevFests.some((id) => sameId(id, selectedFest.id))
        ? [...prevFests, selectedFest.id]
        : prevFests;
    const nextDuties = Array.from(new Set([...(stu.duties || []), 'volunteer_committee']));

    const ok = await run(
      () =>
        request(
          `/users/${stu.id}`,
          send('PATCH', {
            volunteerCommittee: true,
            volunteerFestIds: nextFests,
            volunteerDept: dept,
            volunteerNote: volRole.trim(),
            volunteerContributedBy: coordinator?.name || 'Department Coordinator',
            duties: nextDuties,
          })
        ),
      `${stu.name} added to the Volunteer Committee for ${dept}.`
    );
    if (ok) {
      setSelectedVolStudentId('');
      setVolRole('');
    }
  };

  const handleRemoveVolunteer = async (stu) => {
    const prevFests = Array.isArray(stu.volunteerFestIds) ? stu.volunteerFestIds : [];
    const remainingFests = selectedFest
      ? prevFests.filter((id) => !sameId(id, selectedFest.id))
      : [];
    const stillActive = remainingFests.length > 0;
    const nextDuties = stillActive
      ? stu.duties || []
      : (stu.duties || []).filter((d) => d !== 'volunteer_committee');

    await run(
      () =>
        request(
          `/users/${stu.id}`,
          send('PATCH', {
            volunteerCommittee: stillActive,
            volunteerFestIds: remainingFests,
            ...(!stillActive ? { volunteerDept: '', volunteerNote: '', volunteerContributedBy: '' } : {}),
            duties: nextDuties,
          })
        ),
      `${stu.name} removed from the Volunteer Committee.`
    );
  };

  const pendingApprovalsCount = allDeptStudents.filter((u) => u.approved === false).length;

  const badges = {
    approvals: pendingApprovalsCount,
  };

  const cardStyle = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
  const inputStyle = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';
  const primaryButton = 'flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] disabled:cursor-not-allowed disabled:opacity-50';
  const smallButton = 'flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B3F46] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0E4D55] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <Coordinatorlayout
      activeTab={activeTab}
      onSelect={(id) => {
        setActiveTab(id);
        setTeacherError('');
        setTeacherNotice('');
      }}
      badges={badges}
      coordinator={coordinator}
      dept={dept}
    >
      <header className="relative mb-8 overflow-hidden rounded-2xl bg-[#0B3F46] text-white shadow-sm">
        <Photo src="/banner.png" alt="" eager className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0B3F46] via-[#0B3F46]/80 to-[#0B3F46]/20" />
        <div className="relative z-10 flex flex-col justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10">
          <h1 className="fest-display text-2xl font-extrabold sm:text-3xl">
            {activeTab === 'teachers' && `My Teachers (${dept})`}
            {activeTab === 'funds' && `Classes & Fund (${dept})`}
            {activeTab === 'classLists' && `Class Lists (${dept})`}
            {activeTab === 'approvals' && `Student Approvals (${dept})`}
            {activeTab === 'volunteers' && `Department Volunteers (${dept})`}
            {activeTab === 'submissions' && `Submissions to Admin (${dept})`}
          </h1>
          <Link to="/" className="self-start rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:self-auto">
            ← Back to Home
          </Link>
        </div>
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
        <div className="space-y-6">
          {selectedFest && (
            <section className={`${cardStyle} overflow-hidden`}>
              <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h2 className="fest-display text-base font-bold text-[#0B3F46]">
                    Class-wise Fee Paid & Remittances · {selectedFest.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Number of students paid from each class and amounts sent by class teachers.
                  </p>
                </div>
                <span className="self-start rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46] sm:self-auto">
                  Total Collected: ₹{totalCollected.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">Students Paid</th>
                      <th className="p-3.5">Collected</th>
                      <th className="p-3.5">Class Teacher Remittance</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {deptSections.map((sec) => {
                      const st = sectionStats(sec);
                      return (
                        <tr key={sec.id} className="hover:bg-[#F5F8F8]">
                          <td className="p-3.5 font-semibold text-[#0B3F46]">{sec.name}</td>
                          <td className="p-3.5 font-semibold text-slate-800">
                            {st.paid} / {st.total} paid
                          </td>
                          <td className="p-3.5 font-bold text-[#0B3F46]">
                            ₹{st.collected.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5">
                            {!st.remittance ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500">
                                Not sent yet
                              </span>
                            ) : st.remittance.status === 'verified' ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                                Verified · ₹{Number(st.remittance.amount).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">
                                Sent by {st.remittance.teacherName || 'Teacher'} · ₹{Number(st.remittance.amount).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {st.remittance && st.remittance.status !== 'verified' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleVerifyRemittance(st.remittance)}
                                className="rounded-lg bg-[#0B3F46] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0E4D55] disabled:opacity-50"
                              >
                                Verify Received
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {deptSections.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-500">
                          No classes added for {dept} yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

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
        </div>
      )}

      {activeTab === 'classLists' && (
        <ClassListsTab
          teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError}
          deptSections={deptSections} classLists={classLists} users={users}
          run={run} request={request} busy={busy} dept={dept}
          coordinatorName={coordinator?.name || 'Coordinator'}
          cardStyle={cardStyle} inputStyle={inputStyle} primaryButton={primaryButton}
        />
      )}

      {activeTab === 'approvals' && (
        <StudentApprovalsTab
          teacherNotice={teacherNotice} teacherError={teacherError} loadError={loadError}
          users={users} run={run} request={request} busy={busy} dept={dept}
          coordinatorName={coordinator?.name || 'Coordinator'} cardStyle={cardStyle}
        />
      )}

      {activeTab === 'volunteers' && (
        <VolunteersTab
          teacherNotice={teacherNotice}
          teacherError={teacherError}
          loadError={loadError}
          deptStudents={deptStudents}
          committeeStudents={deptCommitteeStudents}
          selectedStudentId={selectedVolStudentId}
          setSelectedStudentId={setSelectedVolStudentId}
          volRole={volRole}
          setVolRole={setVolRole}
          handleContributeVolunteer={handleContributeVolunteer}
          handleRemoveVolunteer={handleRemoveVolunteer}
          busy={busy}
          dept={dept}
          cardStyle={cardStyle}
          inputStyle={inputStyle}
          primaryButton={primaryButton}
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