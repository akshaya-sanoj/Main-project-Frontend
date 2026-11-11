import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  DollarSign,
  Trash2,
  CheckCircle2,
  Shield,
  Trophy,
  Send,
  Users,
  X,
} from 'lucide-react';
import {
  rosterKey,
  adminSubmittedKey,
  adminSubmissionsKey,
  normalizeDept,
} from '../../utils/deptKeys';
import { API_BASE } from '../../services/api';

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');

.fest-display {
  font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
}

.fest-body {
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
}
`;


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
      throw new Error('The server has no list for this yet. Add "sections", "deptFunds" and "payments" to db.json and restart it.');
    }
    throw new Error(
      res.status === 404
        ? 'That item was not found. It may have been removed.'
        : 'The server could not save that. Please try again.'
    );
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });
const sameId = (a, b) => String(a) === String(b);

const DUTY_LABELS = {
  dept_coordinator: 'Coordinator',
  class_teacher: 'Class teacher',
  program_teacher: 'Program teacher',
  volunteer: 'Volunteer',
};

// Department-specific localStorage hook
function useDepartmentStorage(key, initialValue, validate = () => true) {
  const [storedData, setStoredData] = useState({
    key: null,
    value: initialValue,
  });

  useEffect(() => {
    let loadedData = initialValue;

    try {
      const saved = localStorage.getItem(key);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (validate(parsed)) {
          loadedData = parsed;
        }
      }
    } catch (error) {
      console.error('Error loading department data:', error);
    }

    setStoredData({
      key,
      value: loadedData,
    });
  }, [key]);

  useEffect(() => {
    if (storedData.key !== key) return;

    try {
      localStorage.setItem(key, JSON.stringify(storedData.value));
    } catch (error) {
      console.error('Error saving department data:', error);
    }
  }, [storedData, key]);

  const value = storedData.key === key ? storedData.value : initialValue;

  const setValue = (newValue) => {
    setStoredData((prev) => {
      const currentValue = prev.key === key ? prev.value : initialValue;

      return {
        key,
        value:
          typeof newValue === 'function'
            ? newValue(currentValue)
            : newValue,
      };
    });
  };

  return [value, setValue];
}

export default function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState('teachers');
  const [coordinator, setCoordinator] = useState(null);

  // Load logged-in coordinator
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

  // Normalize department for independent storage keys
  const deptKey = normalizeDept(dept);

  // ==========================================
  // DATA SENT BY TEACHERS (rosters + fund remittances)
  // ==========================================

  const [teacherSubmissions, setTeacherSubmissions] = useState([]);
  const [submittedToAdmin, setSubmittedToAdmin] = useState(false);

  useEffect(() => {
    if (!coordinator) return;

    const loadTeacherData = () => {
      // Participant rosters submitted by teachers
      try {
        const saved = localStorage.getItem(rosterKey(dept));
        setTeacherSubmissions(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error('Failed to parse teacher submissions:', e);
        setTeacherSubmissions([]);
      }

      setSubmittedToAdmin(
        localStorage.getItem(adminSubmittedKey(dept)) === 'true'
      );
    };

    loadTeacherData();
    window.addEventListener('storage', loadTeacherData);
    window.addEventListener('focus', loadTeacherData);

    return () => {
      window.removeEventListener('storage', loadTeacherData);
      window.removeEventListener('focus', loadTeacherData);
    };
  }, [coordinator, dept]);

  const handleForwardToAdmin = () => {
    if (teacherSubmissions.length === 0) {
      alert('No teacher rosters available to forward to Admin.');
      return;
    }

    localStorage.setItem(
      adminSubmissionsKey(dept),
      JSON.stringify({
        department: dept,
        coordinatorName: coordinator?.name || 'Coordinator',
        submissions: teacherSubmissions,
        forwardedAt: new Date().toISOString(),
      })
    );

    localStorage.setItem(adminSubmittedKey(dept), 'true');
    setSubmittedToAdmin(true);
    alert(
      `Successfully submitted all department participant lists from ${dept} to the Super Admin!`
    );
  };

  // ==========================================
  // SERVER DATA: users, fests, programs
  // ==========================================

  const [users, setUsers] = useState([]);
  const [fests, setFests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedFestId, setSelectedFestId] = useState('');
  const [deptFunds, setDeptFunds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [teacherNotice, setTeacherNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Per-teacher form inputs
  const [classInputs, setClassInputs] = useState({}); // teacherId -> class section text
  const [programPick, setProgramPick] = useState({}); // teacherId -> program id

  const loadAll = useCallback(async () => {
    // The three fund lists are optional so the page still opens if they are not in db.json yet
    const optional = (path) => request(path).catch(() => []);
    const [u, f, p, sec, df, pay] = await Promise.all([
      request('/users'),
      request('/fests'),
      request('/programs'),
      optional('/sections'),
      optional('/deptFunds'),
      optional('/payments'),
    ]);
    setUsers(Array.isArray(u) ? u : []);
    setFests(Array.isArray(f) ? f : []);
    setPrograms(Array.isArray(p) ? p : []);
    setSections(Array.isArray(sec) ? sec : []);
    setDeptFunds(Array.isArray(df) ? df : []);
    setPayments(Array.isArray(pay) ? pay : []);
  }, []);

  useEffect(() => {
    loadAll()
      .then(() => setLoadError(''))
      .catch((e) => setLoadError(e.message));
  }, [loadAll]);

  // Runs a save, reloads, and reports the result
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

  // Approved, registered teachers of THIS department only
  const deptTeachers = users.filter(
    (u) =>
      u.baseType === 'teacher' &&
      u.approved !== false &&
      !u.rejected &&
      (u.staffId || u.email) &&
      normalizeDept(u.department || '') === deptKey
  );

  // The fests this coordinator was appointed to by the admin.
  // Older coordinators without a festIds list still see every fest until the admin links them.
  const myFestIds = Array.isArray(coordinator?.festIds) && coordinator.festIds.length > 0
    ? coordinator.festIds
    : null;
  const myFests = fests.filter((f) => !myFestIds || myFestIds.some((id) => sameId(id, f.id)));
  const myFestKey = myFests.map((f) => f.id).join(',');

  useEffect(() => {
    if (myFests.length > 0 && !myFests.some((f) => sameId(f.id, selectedFestId))) {
      setSelectedFestId(String(myFests[myFests.length - 1].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myFestKey, selectedFestId]);

  const selectedFest = myFests.find((f) => sameId(f.id, selectedFestId)) || null;

  // Only programs of the selected fest, and only once the admin has published them
  const publishedPrograms =
    selectedFest && selectedFest.published
      ? programs.filter((p) => sameId(p.festId, selectedFest.id))
      : [];

  const programsOfTeacher = (teacherId) =>
    publishedPrograms.filter((p) =>
      ((p.assignments || {})[deptKey] || []).some((id) => sameId(id, teacherId))
    );

  const isClassTeacher = (u) =>
    (u.duties || []).includes('class_teacher') && !!u.classSection;

  // ---------- Class teacher duty ----------
  const handleSetClassTeacher = async (teacher) => {
    const section = (classInputs[teacher.id] || '').trim();
    if (section.length < 2) {
      setTeacherError('Choose a class first. Add classes on the Classes & Fund tab.');
      setTeacherNotice('');
      return;
    }

    const clash = deptTeachers.find(
      (t) =>
        !sameId(t.id, teacher.id) &&
        isClassTeacher(t) &&
        t.classSection.trim().toLowerCase() === section.toLowerCase()
    );
    if (clash) {
      setTeacherError(`${clash.name} is already the class teacher of ${section}.`);
      setTeacherNotice('');
      return;
    }

    const duties = Array.from(
      new Set([...(teacher.duties || ['teacher']), 'class_teacher'])
    );

    const ok = await run(
      () =>
        request(
          `/users/${teacher.id}`,
          send('PATCH', { duties, classSection: section })
        ),
      `${teacher.name} is now the class teacher of ${section}.`
    );
    if (ok) setClassInputs((prev) => ({ ...prev, [teacher.id]: '' }));
  };

  const handleRemoveClassTeacher = async (teacher) => {
    if (
      !window.confirm(
        `Remove ${teacher.name} as class teacher of ${teacher.classSection}?`
      )
    )
      return;

    const duties = (teacher.duties || []).filter((d) => d !== 'class_teacher');
    await run(
      () =>
        request(
          `/users/${teacher.id}`,
          send('PATCH', {
            duties,
            classSection: null,
            role: teacher.role === 'class_teacher' ? 'teacher' : teacher.role,
          })
        ),
      `${teacher.name} is no longer a class teacher.`
    );
  };

  // ---------- Program (data entry) duty ----------
  const handleAssignProgram = async (teacher) => {
    const programId = programPick[teacher.id];
    if (!programId) {
      setTeacherError('Choose a program first.');
      setTeacherNotice('');
      return;
    }

    const prog = programs.find((p) => sameId(p.id, programId));
    if (!prog) return;

    const list = (prog.assignments || {})[deptKey] || [];
    if (list.some((id) => sameId(id, teacher.id))) {
      setTeacherError(`${teacher.name} is already assigned to ${prog.name}.`);
      setTeacherNotice('');
      return;
    }

    const ok = await run(
      () =>
        request(
          `/programs/${prog.id}`,
          send('PATCH', {
            assignments: {
              ...(prog.assignments || {}),
              [deptKey]: [...list, teacher.id],
            },
          })
        ),
      `${teacher.name} assigned to ${prog.name}.`
    );
    if (ok) setProgramPick((prev) => ({ ...prev, [teacher.id]: '' }));
  };

  const handleUnassignProgram = async (teacher, prog) => {
    const list = ((prog.assignments || {})[deptKey] || []).filter(
      (id) => !sameId(id, teacher.id)
    );
    await run(
      () =>
        request(
          `/programs/${prog.id}`,
          send('PATCH', {
            assignments: { ...(prog.assignments || {}), [deptKey]: list },
          })
        ),
      `${teacher.name} removed from ${prog.name}.`
    );
  };

  // ==========================================
  // CLASSES AND FEST FUND (saved on the server)
  // ==========================================

  const [fundInput, setFundInput] = useState('');
  const [sectionInput, setSectionInput] = useState('');

  const deptFund = deptFunds.find((f) => f.deptKey === deptKey) || null;
  const deptSections = sections.filter((s) => s.deptKey === deptKey);

  // Students of this department (approved ones count towards totals)
  const allDeptStudents = users.filter(
    (u) => u.baseType === 'student' && !u.rejected && normalizeDept(u.department || '') === deptKey
  );
  const deptStudents = allDeptStudents.filter((u) => u.approved !== false);

  const paidPaymentOf = (studentId) =>
    payments.find((p) => sameId(p.studentId, studentId) && p.status === 'paid');

  const classTeacherOfSection = (name) =>
    deptTeachers.find((t) => isClassTeacher(t) && t.classSection === name);

  const sectionStats = (sec) => {
    const students = deptStudents.filter((u) => u.classSection === sec.name);
    const paidList = students.filter((u) => paidPaymentOf(u.id));
    const collected = paidList.reduce(
      (sum, u) => sum + (Number(paidPaymentOf(u.id).amount) || 0),
      0
    );
    return { total: students.length, paid: paidList.length, collected };
  };

  const totalCollected = deptSections.reduce((sum, sec) => sum + sectionStats(sec).collected, 0);

  // Sections that do not have a class teacher yet (used by the My Teachers tab)
  const takenSections = deptTeachers.filter(isClassTeacher).map((t) => t.classSection);
  const freeSections = deptSections.filter((sec) => !takenSections.includes(sec.name));

  const handleSaveFund = async (e) => {
    e.preventDefault();
    const amount = Number(fundInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTeacherError('Enter a fund amount greater than 0.');
      setTeacherNotice('');
      return;
    }
    const body = { deptKey, department: dept, amount, updatedAt: new Date().toISOString() };
    const ok = await run(
      () =>
        deptFund
          ? request(`/deptFunds/${deptFund.id}`, send('PATCH', body))
          : request('/deptFunds', send('POST', body)),
      `Fest fund for ${dept} set to ₹${amount}.`
    );
    if (ok) setFundInput('');
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    const name = sectionInput.trim();
    if (name.length < 2) {
      setTeacherError('Enter a class name, for example "S6 CSE - A".');
      setTeacherNotice('');
      return;
    }
    if (deptSections.some((sec) => sec.name.toLowerCase() === name.toLowerCase())) {
      setTeacherError('This class already exists.');
      setTeacherNotice('');
      return;
    }
    const ok = await run(
      () => request('/sections', send('POST', { deptKey, department: dept, name })),
      `Class "${name}" added. Students can now choose it when they register.`
    );
    if (ok) setSectionInput('');
  };

  const handleDeleteSection = async (sec) => {
    if (
      allDeptStudents.some((u) => u.classSection === sec.name) ||
      classTeacherOfSection(sec.name)
    ) {
      setTeacherError('This class has students or a class teacher, so it cannot be deleted.');
      setTeacherNotice('');
      return;
    }
    if (!window.confirm(`Delete class "${sec.name}"?`)) return;
    await run(() => request(`/sections/${sec.id}`, { method: 'DELETE' }), 'Class deleted.');
  };

  // ==========================================
  // DEPARTMENT-WISE VOLUNTEERS
  // ==========================================

  const volunteersKey = `coord_volunteers_${deptKey}`;

  const defaultVolunteers = [
    {
      id: 201,
      name: 'Ananya S.',
      role: 'Stage Assistance',
      classSection: `3rd Year ${dept}`,
    },
  ];

  const [volunteers, setVolunteers] = useDepartmentStorage(
    volunteersKey,
    defaultVolunteers
  );

  const [volName, setVolName] = useState('');
  const [volRole, setVolRole] = useState('');
  const [volClass, setVolClass] = useState('');

  // ==========================================
  // ADD DEPARTMENT VOLUNTEER
  // ==========================================

  const handleAddVolunteer = (e) => {
    e.preventDefault();

    if (!volName.trim() || !volRole.trim() || !volClass.trim()) {
      return;
    }

    const newVolunteer = {
      id: Date.now(),
      name: volName.trim(),
      role: volRole.trim(),
      classSection: volClass.trim(),
    };

    setVolunteers((prev) => [...prev, newVolunteer]);

    setVolName('');
    setVolRole('');
    setVolClass('');
  };

  const handleDeleteVolunteer = (id) => {
    setVolunteers((prev) => prev.filter((vol) => vol.id !== id));
  };

  // ==========================================
  // SIDEBAR NAVIGATION
  // ==========================================

  const navItems = [
    { id: 'teachers', label: 'My Teachers', icon: Users },
    { id: 'funds', label: 'Classes & Fund', icon: DollarSign },
    { id: 'volunteers', label: 'Department Volunteers', icon: Shield },
    { id: 'submissions', label: 'Submissions to Admin', icon: Send },
  ];

  // ==========================================
  // STYLING
  // ==========================================

  const cardStyle = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

  const inputStyle =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';

  const primaryButton =
    'flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] disabled:cursor-not-allowed disabled:opacity-50';

  const smallButton =
    'flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B3F46] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0E4D55] disabled:cursor-not-allowed disabled:opacity-50';

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="fest-body flex min-h-screen bg-[#F5F8F8] text-slate-800">
      <style>{FONT_CSS}</style>

      {/* SIDEBAR */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#072C31] p-6 text-white md:flex">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-5 w-5" />
            </div>

            <div>
              <h2 className="fest-display text-lg font-extrabold">
                CampusFest
              </h2>

              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F5A623]">
                Coordinator Portal
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">
              {coordinator?.name || 'Department Coordinator'}
            </p>

            <p className="mt-1 text-[10px] text-[#F5A623]">Dept: {dept}</p>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setTeacherError('');
                  setTeacherNotice('');
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeTab === id
                    ? 'bg-[#F5A623] font-bold text-[#2A1A00] shadow-lg'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-5">
          <Link
            to="/login"
            onClick={() => localStorage.removeItem('fest_user')}
            className="text-sm font-semibold text-[#F5A623] hover:text-white"
          >
            ← Sign Out
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        {/* HEADER */}
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="fest-display text-2xl font-extrabold text-[#0B3F46] sm:text-3xl">
              {activeTab === 'teachers' && `My Teachers (${dept})`}

              {activeTab === 'funds' && `Classes & Fest Fund (${dept})`}

              {activeTab === 'volunteers' &&
                `Department Volunteers (${dept})`}

              {activeTab === 'submissions' &&
                `Submissions to Admin (${dept})`}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {activeTab === 'teachers'
                ? 'Give your teachers their duties: class teacher of a section, and program data entry.'
                : 'Manage department-specific activities, funds, and program assignments.'}
            </p>
          </div>

          <Link
            to="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B3F46] hover:bg-[#FFF8E9]"
          >
            ← Back to Home
          </Link>
        </header>

        {/* ================================== */}
        {/* MY TEACHERS TAB */}
        {/* ================================== */}

        {activeTab === 'teachers' && (
          <div className="space-y-6">
            {teacherNotice && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              >
                {teacherNotice}
              </p>
            )}
            {(teacherError || loadError) && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {teacherError || loadError}
              </p>
            )}

            {myFests.length === 0 && !loadError ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                You have not been appointed as coordinator for any fest yet. Ask the Fest
                Committee Admin to add you. You can still set class teachers.
              </p>
            ) : (
              <section className={`${cardStyle} p-5`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full max-w-sm">
                    <label htmlFor="coordFest" className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Fest
                    </label>
                    <select
                      id="coordFest"
                      value={selectedFestId}
                      onChange={(e) => {
                        setSelectedFestId(e.target.value);
                        setProgramPick({});
                        setTeacherError('');
                        setTeacherNotice('');
                      }}
                      className={inputStyle}
                    >
                      {myFests.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedFest && (
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedFest.published ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FDEFD3] text-[#5C3B00]'
                      }`}
                    >
                      {selectedFest.published ? 'Programs published' : 'Programs not published yet'}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Program duties below are for the selected fest only. Class teachers stay the same across fests.
                </p>
                {selectedFest && publishedPrograms.length === 0 && !loadError && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    {selectedFest.published
                      ? 'This fest has no programs yet.'
                      : 'The admin has not published this fest\'s program list yet, so program duties cannot be assigned.'}
                  </p>
                )}
              </section>
            )}

            <section className={`${cardStyle} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="fest-display font-bold text-[#0B3F46]">
                    Approved Teachers ({dept})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Only teachers of your department who the admin has approved
                    appear here.
                  </p>
                </div>
                <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
                  {deptTeachers.length}{' '}
                  {deptTeachers.length === 1 ? 'Teacher' : 'Teachers'}
                </span>
              </div>

              {deptTeachers.length === 0 ? (
                <p className="p-10 text-center text-xs text-slate-500">
                  No approved teachers in {dept} yet. Teachers appear here after
                  they register and the admin approves them.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {deptTeachers.map((t) => {
                    const myPrograms = programsOfTeacher(t.id);
                    const classTeacher = isClassTeacher(t);
                    const duties = Array.from(
                      new Set([
                        ...(t.duties || []).filter((d) => d !== 'teacher'),
                        ...(myPrograms.length > 0 ? ['program_teacher'] : []),
                      ])
                    );

                    return (
                      <li key={t.id} className="space-y-4 p-5 sm:p-6">
                        {/* Teacher summary */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-[#0B3F46]">
                              {t.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {t.staffId ? `ID ${t.staffId}` : 'ID pending'}
                              {t.email ? ` · ${t.email}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {duties.length === 0 ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                No duties yet
                              </span>
                            ) : (
                              duties.map((d) => (
                                <span
                                  key={d}
                                  className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
                                >
                                  {DUTY_LABELS[d] || d}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          {/* Class teacher duty */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                              Class teacher duty
                            </h3>

                            {classTeacher ? (
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-[#0B3F46]">
                                  Class teacher of {t.classSection}
                                </p>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleRemoveClassTeacher(t)}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <select
                                  aria-label={`Class for ${t.name}`}
                                  value={classInputs[t.id] || ''}
                                  onChange={(e) =>
                                    setClassInputs((prev) => ({
                                      ...prev,
                                      [t.id]: e.target.value,
                                    }))
                                  }
                                  className={inputStyle}
                                  disabled={freeSections.length === 0}
                                >
                                  <option value="">
                                    {freeSections.length === 0 ? 'No free classes' : 'Choose a class'}
                                  </option>
                                  {freeSections.map((sec) => (
                                    <option key={sec.id} value={sec.name}>
                                      {sec.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleSetClassTeacher(t)}
                                  className={smallButton}
                                >
                                  Set
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Program duty */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                              Program data entry
                            </h3>

                            {myPrograms.length > 0 && (
                              <ul className="mb-3 flex flex-wrap gap-2">
                                {myPrograms.map((p) => (
                                  <li
                                    key={p.id}
                                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-xs font-semibold text-[#0B3F46]"
                                  >
                                    {p.name}
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleUnassignProgram(t, p)}
                                      aria-label={`Remove ${t.name} from ${p.name}`}
                                      className="rounded-full p-1 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="flex gap-2">
                              <select
                                aria-label={`Program for ${t.name}`}
                                value={programPick[t.id] || ''}
                                onChange={(e) =>
                                  setProgramPick((prev) => ({
                                    ...prev,
                                    [t.id]: e.target.value,
                                  }))
                                }
                                className={inputStyle}
                                disabled={publishedPrograms.length === 0}
                              >
                                <option value="">Choose a program</option>
                                {publishedPrograms.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={busy || publishedPrograms.length === 0}
                                onClick={() => handleAssignProgram(t)}
                                className={smallButton}
                              >
                                <Plus className="h-3.5 w-3.5 text-[#F5A623]" />
                                Assign
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* ================================== */}
        {/* CLASSES & FUND TAB */}
        {/* ================================== */}

        {activeTab === 'funds' && (
          <div className="space-y-6">
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

            {/* Fund amount + total */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section className={`${cardStyle} p-6`}>
                <h2 className="fest-display font-bold text-[#0B3F46]">Fest fund per student ({dept})</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Every student of {dept} pays this amount from their own dashboard. Each department sets its own.
                </p>
                <p className="mt-4 font-mono text-3xl font-bold text-[#0E4D55]">
                  {deptFund ? `₹${deptFund.amount}` : 'Not set'}
                </p>
                <form onSubmit={handleSaveFund} className="mt-4 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder={deptFund ? 'New amount (₹)' : 'Amount (₹)'}
                    value={fundInput}
                    onChange={(e) => setFundInput(e.target.value)}
                    className={inputStyle}
                  />
                  <button type="submit" disabled={busy} className={smallButton}>
                    {deptFund ? 'Update' : 'Set'}
                  </button>
                </form>
                {deptFund && (
                  <p className="mt-2 text-xs text-slate-500">
                    Changing the amount does not affect students who have already paid.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h2 className="fest-display font-bold text-[#0B3F46]">Collected so far</h2>
                <p className="mt-1 text-xs text-slate-500">Calculated from student payments. Nothing to send or forward.</p>
                <p className="mt-4 font-mono text-3xl font-bold text-[#0E4D55]">₹{totalCollected}</p>
              </section>
            </div>

            {/* Classes */}
            <section className={`${cardStyle} overflow-hidden`}>
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="fest-display font-bold text-[#0B3F46]">Classes of {dept}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create each class here first. Students choose from this list when they register, and you assign a class teacher to it on the My Teachers tab.
                </p>
                <form onSubmit={handleAddSection} className="mt-4 flex max-w-md gap-2">
                  <input
                    type="text"
                    placeholder="e.g. S6 CSE - A"
                    value={sectionInput}
                    onChange={(e) => setSectionInput(e.target.value)}
                    className={inputStyle}
                  />
                  <button type="submit" disabled={busy} className={smallButton}>
                    <Plus className="h-3.5 w-3.5 text-[#F5A623]" /> Add
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="p-4">Class</th>
                      <th className="p-4">Class teacher</th>
                      <th className="p-4">Students</th>
                      <th className="p-4">Paid</th>
                      <th className="p-4">Collected</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deptSections.map((sec) => {
                      const st = sectionStats(sec);
                      const ct = classTeacherOfSection(sec.name);
                      return (
                        <tr key={sec.id} className="hover:bg-[#F5F8F8]">
                          <td className="p-4 font-semibold text-[#0B3F46]">{sec.name}</td>
                          <td className="p-4 text-slate-600">
                            {ct ? ct.name : <span className="italic text-slate-400">Not assigned</span>}
                          </td>
                          <td className="p-4 text-slate-600">{st.total}</td>
                          <td className="p-4 text-slate-600">{st.paid}/{st.total}</td>
                          <td className="p-4 font-mono font-bold text-[#0E4D55]">₹{st.collected}</td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDeleteSection(sec)}
                              aria-label={`Delete ${sec.name}`}
                              className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {deptSections.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-10 text-center text-xs text-slate-500">
                          No classes yet. Add the first one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ================================== */}
        {/* VOLUNTEERS TAB */}
        {/* ================================== */}

        {activeTab === 'volunteers' && (
          <div className="space-y-6">
            <section className={`${cardStyle} p-6`}>
              <h2 className="fest-display mb-4 font-bold text-[#0B3F46]">
                Register Department Volunteers ({dept})
              </h2>

              <form
                onSubmit={handleAddVolunteer}
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                <input
                  type="text"
                  placeholder="Volunteer Name"
                  value={volName}
                  onChange={(e) => setVolName(e.target.value)}
                  className={inputStyle}
                  required
                />

                <input
                  type="text"
                  placeholder="Assigned Role"
                  value={volRole}
                  onChange={(e) => setVolRole(e.target.value)}
                  className={inputStyle}
                  required
                />

                <input
                  type="text"
                  placeholder={`Class (e.g. 3rd Year ${dept})`}
                  value={volClass}
                  onChange={(e) => setVolClass(e.target.value)}
                  className={inputStyle}
                  required
                />

                <div className="sm:col-span-3">
                  <button type="submit" className={primaryButton}>
                    <Plus className="h-4 w-4" />
                    Add Volunteer
                  </button>
                </div>
              </form>
            </section>

            <div className={`${cardStyle} p-6`}>
              <h3 className="fest-display mb-4 font-bold text-[#0B3F46]">
                Volunteer Roster ({dept})
              </h3>

              <div className="space-y-2">
                {volunteers.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:flex-row sm:items-center"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">
                        {v.name}
                      </span>

                      {' — '}

                      <span className="text-[#0B3F46]">{v.role}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-500">
                        {v.classSection}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteVolunteer(v.id)}
                        className="text-rose-500 hover:text-rose-700"
                        aria-label="Delete volunteer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {volunteers.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No volunteers registered for {dept} yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================== */}
        {/* SUBMISSIONS TO ADMIN TAB */}
        {/* ================================== */}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className={`${cardStyle} p-6 sm:p-8`}>
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">
                    Submitted Teacher Rosters ({dept})
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Review student participant lists sent by your teachers
                    before submitting to Admin.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleForwardToAdmin}
                  disabled={submittedToAdmin || teacherSubmissions.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] disabled:opacity-50"
                >
                  <Send className="h-4 w-4 text-[#F5A623]" />
                  {submittedToAdmin
                    ? 'Submitted to Admin ✓'
                    : 'Submit Department Rosters to Admin'}
                </button>
              </div>

              {submittedToAdmin && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  All department rosters have been successfully submitted to
                  the Super Admin panel!
                </div>
              )}

              {teacherSubmissions.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No teacher rosters have been submitted to your department yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {teacherSubmissions.map((sub, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-sm font-bold text-[#0B3F46]">
                          Faculty: {sub.teacherName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {sub.participants.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-800">
                                {p.studentName}
                              </span>{' '}
                              ({p.studentId}) —{' '}
                              <span className="font-semibold text-[#0E4D55]">
                                {p.eventName}
                              </span>
                            </div>

                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}