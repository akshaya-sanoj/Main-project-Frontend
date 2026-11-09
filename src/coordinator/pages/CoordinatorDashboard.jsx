import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  DollarSign,
  Trash2,
  CheckCircle2,
  Shield,
  Trophy,
  Send
} from 'lucide-react';
import {
  rosterKey,
  adminSubmittedKey,
  adminSubmissionsKey,
  normalizeDept,
  fundSubmissionsKey
} from '../../utils/deptKeys';

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');

.fest-display {
  font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
}

.fest-body {
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
}
`;

const API_BASE = 'http://localhost:3000';

// Generate default fund records for each department
const getDefaultFunds = (dept) => [
  {
    id: 101,
    year: '1st Year',
    classSection: `1st Year ${dept}`,
    classTeacher: 'Faculty Incharge',
    totalStudents: 60,
    paidCount: 58,
    amountCollected: '₹14,500',
  },
  {
    id: 102,
    year: '2nd Year',
    classSection: `2nd Year ${dept}`,
    classTeacher: 'Faculty Incharge',
    totalStudents: 55,
    paidCount: 50,
    amountCollected: '₹12,500',
  },
  {
    id: 103,
    year: '3rd Year',
    classSection: `3rd Year ${dept}`,
    classTeacher: 'Faculty Incharge',
    totalStudents: 62,
    paidCount: 45,
    amountCollected: '₹9,000',
  },
  {
    id: 104,
    year: '4th Year',
    classSection: `4th Year ${dept}`,
    classTeacher: 'Faculty Incharge',
    totalStudents: 50,
    paidCount: 50,
    amountCollected: '₹12,500',
  },
];

// Check whether saved fund records follow the four-year structure
const isValidYearFunds = (data) => {
  const requiredYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  return (
    Array.isArray(data) &&
    data.length === 4 &&
    requiredYears.every((year) => data.some((item) => item.year === year))
  );
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
  const [activeTab, setActiveTab] = useState('assignments');
  const [coordinator, setCoordinator] = useState(null);

  // Load logged-in coordinator
  useEffect(() => {
    const savedUser = localStorage.getItem('fest_user');

    if (savedUser) {
      try {
        setCoordinator(JSON.parse(savedUser));
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
  const [fundSubmissions, setFundSubmissions] = useState([]);
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

      // Class fund collections sent by class teachers
      try {
        const savedFunds = localStorage.getItem(fundSubmissionsKey(dept));
        setFundSubmissions(savedFunds ? JSON.parse(savedFunds) : []);
      } catch (e) {
        console.error('Failed to parse fund submissions:', e);
        setFundSubmissions([]);
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

  const totalFundReceived = fundSubmissions.reduce(
    (sum, r) => sum + (Number(r.totalAmount) || 0),
    0
  );

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

  // Fetch official programs created by Admin
  const [officialPrograms, setOfficialPrograms] = useState([]);
  const [programError, setProgramError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchPrograms() {
      try {
        const res = await fetch(`${API_BASE}/programs`);

        if (!res.ok) {
          throw new Error('Unable to fetch official programs.');
        }

        const data = await res.json();

        if (isMounted) {
          setOfficialPrograms(Array.isArray(data) ? data : []);
          setProgramError('');
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);

        if (isMounted) {
          setProgramError(error.message);
        }
      }
    }

    fetchPrograms();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // DEPARTMENT-WISE TEACHER ASSIGNMENTS
  // ==========================================

  const assignmentsKey = `coord_assignments_${deptKey}`;

  const defaultAssignments = [
    {
      id: 1,
      teacher: 'Prof. Ramesh Kumar',
      program: 'Classical Dance (Solo)',
      category: 'On stage · Individual',
      status: 'Assigned',
    },
  ];

  const [assignments, setAssignments] = useDepartmentStorage(
    assignmentsKey,
    defaultAssignments
  );

  const [teacherName, setTeacherName] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');

  // ==========================================
  // DEPARTMENT-WISE CLASS FUNDS
  // ==========================================

  const fundsKey = `coord_funds_${deptKey}`;

  const defaultFunds = getDefaultFunds(dept);

  const [funds, setFunds] = useDepartmentStorage(
    fundsKey,
    defaultFunds,
    isValidYearFunds
  );

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
  // ASSIGN TEACHER TO PROGRAM
  // ==========================================

  const handleAssignTeacher = (e) => {
    e.preventDefault();

    if (!teacherName.trim() || !selectedProgramId) return;

    const matchedProg = officialPrograms.find(
      (p) => String(p.id) === String(selectedProgramId)
    );

    if (!matchedProg) return;

    const categoryText = `${matchedProg.stage || 'General'} ${
      matchedProg.kind ? '· ' + matchedProg.kind : ''
    }`;

    const newAssignment = {
      id: Date.now(),
      teacher: teacherName.trim(),
      program: matchedProg.name,
      category: categoryText.trim(),
      status: 'Assigned',
    };

    setAssignments((prev) => [...prev, newAssignment]);

    setTeacherName('');
    setSelectedProgramId('');
  };

  const handleDeleteAssignment = (id) => {
    setAssignments((prev) => prev.filter((item) => item.id !== id));
  };

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
    {
      id: 'assignments',
      label: 'Assign Teachers to Programs',
      icon: UserCheck,
    },
    {
      id: 'funds',
      label: 'Class Fund Status',
      icon: DollarSign,
    },
    {
      id: 'volunteers',
      label: 'Department Volunteers',
      icon: Shield,
    },
    {
      id: 'submissions',
      label: 'Submissions to Admin',
      icon: Send,
    },
  ];

  // ==========================================
  // STYLING
  // ==========================================

  const cardStyle = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

  const inputStyle =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';

  const primaryButton =
    'flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] disabled:cursor-not-allowed disabled:opacity-50';

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
                onClick={() => setActiveTab(id)}
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
              {activeTab === 'assignments' && `Assign Teachers (${dept})`}

              {activeTab === 'funds' && `Class Fund Management (${dept})`}

              {activeTab === 'volunteers' &&
                `Department Volunteers (${dept})`}

              {activeTab === 'submissions' &&
                `Submissions to Admin (${dept})`}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage department-specific activities, funds, and program
              assignments.
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
        {/* TEACHER ASSIGNMENTS TAB */}
        {/* ================================== */}

        {activeTab === 'assignments' && (
          <div className="space-y-8">
            {/* ASSIGN TEACHER FORM */}
            <section className={`${cardStyle} p-6 sm:p-8`}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]">
                  <UserCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">
                    Assign Teacher to Official Fest Program
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Select from the official program catalog created by the
                    admin.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleAssignTeacher}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                <input
                  type="text"
                  placeholder="Teacher Full Name"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className={inputStyle}
                  required
                />

                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Select Official Fest Program</option>

                  {officialPrograms.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name} ({prog.stage || 'General'}
                      {prog.kind ? ` · ${prog.kind}` : ''})
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className={primaryButton}
                  disabled={officialPrograms.length === 0}
                >
                  <Plus className="h-4 w-4 text-[#F5A623]" />
                  Assign Teacher
                </button>
              </form>

              {programError && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {programError}
                </p>
              )}

              {officialPrograms.length === 0 && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  ⚠️ No official programs have been published by the admin yet.
                  Please ask the Fest Committee Admin to add programs under the
                  active fest.
                </p>
              )}
            </section>

            {/* ASSIGNED TEACHERS TABLE */}
            <section className={`${cardStyle} overflow-hidden`}>
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h3 className="fest-display font-bold text-[#0B3F46]">
                  Assigned Teachers Roster ({dept})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="p-4">Teacher Name</th>
                      <th className="p-4">Program</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F5F8F8]">
                        <td className="p-4 font-semibold text-[#0B3F46]">
                          {item.teacher}
                        </td>

                        <td className="p-4 font-medium text-[#0E4D55]">
                          {item.program}
                        </td>

                        <td className="p-4 text-slate-600">{item.category}</td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {item.status}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(item.id)}
                            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                            aria-label="Delete assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {assignments.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-8 text-center text-xs text-slate-400"
                        >
                          No teachers assigned for {dept} yet.
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
        {/* CLASS FUNDS TAB */}
        {/* ================================== */}

        {activeTab === 'funds' && (
          <div className="space-y-6">
            {/* FUNDS RECEIVED FROM CLASS TEACHERS */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="fest-display font-bold text-[#0B3F46]">
                    Received from Class Teachers ({dept})
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Fund collections sent by class teachers to the department
                    coordinator.
                  </p>
                </div>

                <span className="font-mono text-xl font-bold text-[#0E4D55]">
                  ₹{totalFundReceived}
                </span>
              </div>

              {fundSubmissions.length === 0 ? (
                <p className="rounded-xl bg-white p-4 text-center text-xs text-slate-500">
                  No fund remittances received yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {fundSubmissions.map((r, idx) => (
                    <div
                      key={r.teacherKey || idx}
                      className="flex flex-col justify-between gap-2 rounded-xl bg-white p-4 text-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <span className="block font-bold text-[#0B3F46]">
                          {r.teacherName}
                        </span>

                        <span className="text-xs text-slate-500">
                          Students Paid: {r.paidCount}/{r.totalStudents}
                          {' · '}
                          Sent {new Date(r.sentAt).toLocaleString()}
                        </span>
                      </div>

                      <span className="font-mono text-base font-bold text-[#0E4D55]">
                        ₹{r.totalAmount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* YEAR-WISE OVERVIEW */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="fest-display font-bold text-[#0B3F46]">
                  Class Fund Overview ({dept})
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Viewing collection summaries across academic years for your
                  department.
                </p>
              </div>

              <div className="space-y-3">
                {funds
                  .slice()
                  .sort((a, b) => {
                    const order = [
                      '1st Year',
                      '2nd Year',
                      '3rd Year',
                      '4th Year',
                    ];

                    return order.indexOf(a.year) - order.indexOf(b.year);
                  })
                  .map((f) => (
                    <div
                      key={f.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <span className="block font-bold text-[#0B3F46]">
                          {f.classSection}
                        </span>

                        <span className="text-xs text-slate-500">
                          Teacher Incharge: {f.classTeacher}
                          {' · '}
                          Students Paid: {f.paidCount}/{f.totalStudents}
                        </span>
                      </div>

                      <div>
                        <span className="font-mono text-base font-bold text-[#0E4D55]">
                          {f.amountCollected}
                        </span>
                      </div>
                    </div>
                  ))}

                {funds.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No fund records found for {dept}.
                  </p>
                )}
              </div>
            </div>
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