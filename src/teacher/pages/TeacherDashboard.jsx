import React, { useState, useEffect } from 'react';
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
  PhoneCall
} from 'lucide-react';
import { rosterKey,fundSubmissionsKey } from '../../utils/deptKeys';

const API_BASE = 'http://localhost:3000';

export default function TeacherDashboard() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);

  // Fetch or load teacher profile from URL ID or localStorage
  useEffect(() => {
    if (id) {
      fetch(`${API_BASE}/users/${id}`)
        .then(res => res.json())
        .then(data => setTeacher(data))
        .catch(err => console.error('Failed to fetch teacher profile', err));
    } else {
      const saved = localStorage.getItem('fest_user');
      if (saved) {
        try {
          setTeacher(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [id]);

  const teacherKey = teacher?.id || teacher?.email || 'default_teacher';
  const dept = teacher?.department || 'Computer Science (CSE)';
  const teacherName = teacher?.name || '';
  const isClassTeacher =
  teacher?.role === 'class_teacher' ||
  (Array.isArray(teacher?.duties) && teacher.duties.includes('class_teacher'));

  // State keys for strict data isolation
  const participantsKey = `teacher_participants_${teacherKey}`;
  const classFundsKey = `teacher_class_funds_${teacherKey}`;
  const committeeDutiesKey = `teacher_committee_duties_${teacherKey}`;

  // Dynamically load programs assigned to this specific teacher across all department coordinators in localStorage
  const [assignedEvents, setAssignedEvents] = useState([]);

  useEffect(() => {
    if (!teacherName) return;

    try {
      const teacherNameNormalized = teacherName.trim().toLowerCase().replace(/\s+/g, ' ');
      let allAssignments = [];

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('coord_assignments_') || key === 'coord_assignments') {
          try {
            const saved = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(saved)) {
              allAssignments = [
                ...allAssignments,
                ...saved.map(item => ({
                  ...item,
                  sourceDepartment: key.replace('coord_assignments_', '')
                }))
              ];
            }
          } catch (error) {
            console.error('Invalid assignment data format:', error);
          }
        }
      });

      const teacherProgs = allAssignments.filter(item => {
        const assignedTeacher = (item.teacher || '').trim().toLowerCase().replace(/\s+/g, ' ');
        return assignedTeacher === teacherNameNormalized;
      });

      const formattedEvents = teacherProgs.map((item, index) => ({
        id: item.id || index + 1,
        eventName: item.program,
        eventType: /group|team/i.test(item.category || '') ? 'Group' : 'Single'
      }));

      setAssignedEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading teacher assignments:', error);
      setAssignedEvents([]);
    }
  }, [teacherName]);

  // Registered participants (isolated per teacher)
  const [participants, setParticipants] = useState(() => {
    const saved = localStorage.getItem(participantsKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    if (teacherKey) {
      localStorage.setItem(participantsKey, JSON.stringify(participants));
    }
  }, [participants, participantsKey, teacherKey]);

  // Committee duties assigned by the fest committee (isolated per teacher)
  const [committeeDuties] = useState(() => {
    const saved = localStorage.getItem(committeeDutiesKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // Class teacher fund details initialized as an empty array
  const [classFunds, setClassFunds] = useState(() => {
    const saved = localStorage.getItem(classFundsKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    if (teacherKey) {
      localStorage.setItem(classFundsKey, JSON.stringify(classFunds));
    }
  }, [classFunds, classFundsKey, teacherKey]);

  const [fundRemittedToCoordinator, setFundRemittedToCoordinator] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState(dept);
  const [semester, setSemester] = useState('');
  const [phone, setPhone] = useState('');
  const [groupMembers, setGroupMembers] = useState('');

  useEffect(() => {
    if (assignedEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(String(assignedEvents[0].id));
    }
  }, [assignedEvents, selectedEventId]);

  const [newStudentName, setNewStudentName] = useState('');
  const [newRollNo, setNewRollNo] = useState('');
  const [newFestFeeDue, setNewFestFeeDue] = useState('300');

  const chosenEvent =
    assignedEvents.find(ev => ev.id === Number(selectedEventId)) ||
    assignedEvents[0];

  const isGroupEvent = chosenEvent?.eventType === 'Group';

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !chosenEvent) return;

    let memberList = [];
    if (isGroupEvent && groupMembers.trim()) {
      memberList = groupMembers.split(',').map(m => m.trim()).filter(Boolean);
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
      status: 'Pending Submission'
    };

    setParticipants(prev => [...prev, newParticipant]);
    setStudentName('');
    setStudentId('');
    setSemester('');
    setPhone('');
    setGroupMembers('');
  };

  const handleDeleteParticipant = (participantId) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const submittedCount = participants.filter(p => p.status === 'Submitted to Coordinator').length;
  const pendingCount = participants.length - submittedCount;

  // Fully integrated workflow handler to push teacher participant rosters to the department coordinator portal
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
  console.log('Roster saved to key:', key);

  alert(`Successfully submitted ${participants.length} participant records to the Department Coordinator for ${dept}!`);
};

  const handleAddClassStudent = (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newRollNo.trim() || !newFestFeeDue) return;

    const fee = Number(newFestFeeDue);
    const entry = {
      id: Date.now(),
      studentName: newStudentName.trim(),
      rollNo: newRollNo.trim(),
      festFeeDue: fee,
      amountPaid: fee,
      status: 'Paid'
    };

    setClassFunds(prev => [...prev, entry]);
    setNewStudentName('');
    setNewRollNo('');
    setNewFestFeeDue('300');
  };

  const handleUpdateStudentPayment = (id, paidAmount) => {
    const updated = classFunds.map(item => {
      if (item.id === id) {
        const paid = Number(paidAmount);
        let status = 'Pending';
        if (paid >= item.festFeeDue) status = 'Paid';
        else if (paid > 0) status = 'Partial';
        return { ...item, amountPaid: paid, status };
      }
      return item;
    });
    setClassFunds(updated);
  };

  const totalClassCollection = classFunds.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0);

 const handleSendFullAmountToCoordinator = () => {
  if (classFunds.length === 0) {
    alert('No class fund records available to send.');
    return;
  }

  const key = fundSubmissionsKey(dept);
  let existing = [];
  try {
    existing = JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    existing = [];
  }

  // replace this teacher's earlier submission so resending never double-counts
  const others = existing.filter((r) => r.teacherKey !== teacherKey);
  others.push({
    teacherKey,
    teacherName: teacher?.name || 'Faculty',
    teacherEmail: teacher?.email || '',
    department: dept,
    totalAmount: totalClassCollection,
    paidCount: classFunds.filter((s) => Number(s.amountPaid) > 0).length,
    totalStudents: classFunds.length,
    students: classFunds,
    sentAt: new Date().toISOString(),
  });

  localStorage.setItem(key, JSON.stringify(others));
  setFundRemittedToCoordinator(true);
  alert(`Successfully transferred the full class fund collection of ₹${totalClassCollection} to the Department Coordinator!`);
};

  const handleEmergencyCall = () => {
    alert('Connecting to Fest Emergency Volunteer Response Team (Hotline: +91 98765 43210)...');
  };

  const teacherInitials = teacher?.name
    ? teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'TR';

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
              </div>
            </div>
          </div>

          {/* Emergency Support button placed at the top */}
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
              <span>Assigned Event Entries</span>
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
              Faculty Workspace & Isolated Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3F46]">
              Teacher Dashboard ({teacher?.name || 'Faculty'})
            </h1>
            <p className="text-sm text-[#718589] mt-2">
              Manage assigned program participants, committee duties, and student fest funds for {dept}.
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

        {/* Overview Cards */}
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
            <p className="text-xs text-[#718589] mt-1">Total class fest fund collected</p>
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

        {/* SECTION 1: Fest Committee Duties Assigned (Rendered ONLY if explicitly assigned) */}
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
              {committeeDuties.map(duty => (
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

        {/* SECTION 2: Class Teacher Fund Collection & Transfer to Coordinator */}
        {isClassTeacher && (

        <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#E6F5EC] text-[#218653] rounded-xl flex items-center justify-center">
                <IndianRupee size={21} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0B3F46]">Class Teacher Department Fest Fund Collection</h2>
                <p className="text-xs text-[#718589] mt-1">Update student fest fund contributions and send the full collection amount to the Dept Coordinator.</p>
              </div>
            </div>

            <button
              onClick={handleSendFullAmountToCoordinator}
              className="inline-flex items-center justify-center gap-2 bg-[#218653] hover:bg-[#196941] text-white font-extrabold py-3 px-5 rounded-xl text-xs transition shadow-sm"
            >
              <Send size={15} />
              Send Full Class Fund (₹{totalClassCollection}) to Dept Coordinator
            </button>
          </div>

          {fundRemittedToCoordinator && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700" />
              Full class fund collection amount of ₹{totalClassCollection} has been successfully sent to the Department Coordinator!
            </div>
          )}

          {/* Quick Add Student */}
          <form onSubmit={handleAddClassStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 bg-[#F8FAFA] rounded-2xl border border-[#DCE7E7]">
            <input
              type="text"
              placeholder="Student Name"
              value={newStudentName}
              onChange={e => setNewStudentName(e.target.value)}
              className="bg-white border border-[#DCE7E7] rounded-xl px-4 py-2.5 text-xs text-[#173B40] outline-none focus:border-[#F5A623]"
              required
            />
            <input
              type="text"
              placeholder="Roll No / ID"
              value={newRollNo}
              onChange={e => setNewRollNo(e.target.value)}
              className="bg-white border border-[#DCE7E7] rounded-xl px-4 py-2.5 text-xs text-[#173B40] outline-none focus:border-[#F5A623]"
              required
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Fest Fee (₹)"
                value={newFestFeeDue}
                onChange={e => setNewFestFeeDue(e.target.value)}
                className="w-full bg-white border border-[#DCE7E7] rounded-xl px-4 py-2.5 text-xs text-[#173B40] outline-none focus:border-[#F5A623]"
                required
              />
              <button type="submit" className="bg-[#0B3F46] hover:bg-[#0B6870] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shrink-0">
                Add
              </button>
            </div>
          </form>

          {/* Class Fund Table (Fest Fee Due column completely removed) */}
          {classFunds.length > 0 && (
  <div className="overflow-x-auto">
    <table className="w-full text-left min-w-[550px]">
      <thead>
        <tr className="bg-[#F5F8F8] text-[#718589] text-[11px] uppercase tracking-wider">
          <th className="px-4 py-3 font-bold">Student Name & Roll</th>
          <th className="px-4 py-3 font-bold">Amount Paid (₹)</th>
          <th className="px-4 py-3 font-bold">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#EDF1F1]">
        {classFunds.map(item => (
          <tr key={item.id} className="hover:bg-[#F8FAFA] transition">
            <td className="px-4 py-3">
              <p className="font-bold text-sm text-[#173B40]">{item.studentName}</p>
              <p className="text-xs text-[#718589] font-mono">Roll: {item.rollNo}</p>
            </td>
            <td className="px-4 py-3">
              <input
                type="number"
                value={item.amountPaid}
                onChange={e => handleUpdateStudentPayment(item.id, e.target.value)}
                className="w-28 bg-[#F5F8F8] border border-[#DCE7E7] rounded-lg px-3 py-1.5 text-xs font-bold text-[#173B40] outline-none focus:border-[#F5A623]"
              />
            </td>
            <td className="px-4 py-3">
              <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                item.status === 'Paid' ? 'bg-[#E6F5EC] text-[#218653]' :
                item.status === 'Partial' ? 'bg-[#FFF3D6] text-[#B7791F]' : 'bg-[#FCE7EF] text-[#D6336C]'
              }`}>
                {item.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

        </section>
 )}
        

        {/* SECTION 3: Student Participant Registration for Assigned Programs */}
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

          {assignedEvents.length === 0 ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold">
              ⚠️ No programs have been assigned to you by your Department Coordinator yet.
            </div>
          ) : (
            <form onSubmit={handleAddParticipant} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="sm:col-span-2 xl:col-span-1">
                  <label className="block text-xs font-bold text-[#456166] mb-2">Select Assigned Event</label>
                  <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                  >
                    {assignedEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.eventName} [{ev.eventType}]
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
                    onChange={e => setStudentName(e.target.value)}
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
                    onChange={e => setStudentId(e.target.value)}
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
                    onChange={e => setDepartment(e.target.value)}
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
                    onChange={e => setSemester(e.target.value)}
                    className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#456166] mb-2">Contact Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
                  />
                </div>
              </div>

              {isGroupEvent && (
                <div>
                  <label className="block text-xs font-bold text-[#456166] mb-2">Group Members (Comma-separated names & IDs)</label>
                  <input
                    type="text"
                    placeholder="Ananya S. (ID-02), Rahul V. (ID-03)"
                    value={groupMembers}
                    onChange={e => setGroupMembers(e.target.value)}
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
          )}
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
                  participants.map(item => (
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

        <footer className="mt-10 pt-5 border-t border-[#DCE7E7] flex flex-col sm:flex-row justify-between gap-2 text-xs text-[#91A1A3]">
          <p>© 2026 CampusFest. Faculty Portal.</p>
          <p>Making every campus event memorable.</p>
        </footer>

      </main>
    </div>
  );
}