import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Calendar, ShieldAlert, LogOut, CheckCircle2,
  IndianRupee, PhoneCall, Radio, Clock
} from 'lucide-react';

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
.fest-display { font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif; }
.fest-body { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
`;

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [fundPaid, setFundPaid] = useState(false);
  const [myPrograms, setMyPrograms] = useState([]);

  // Load logged-in student
  useEffect(() => {
    const savedUser = localStorage.getItem('fest_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setStudent(parsed);
        const paidStatus = localStorage.getItem(`student_fund_paid_${parsed.id || parsed.email}`);
        if (paidStatus === 'true') setFundPaid(true);
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
  }, []);

  // Load programs this student was registered for by incharge teachers
  useEffect(() => {
    if (!student) return;

    const norm = (v) => String(v || '').trim().toLowerCase();
    const myId = norm(student.registerNo || student.id);

    if (!myId) {
      setMyPrograms([]);
      return;
    }

    const loadPrograms = () => {
      const found = [];

      Object.keys(localStorage).forEach((key) => {
        if (!key.startsWith('teacher_participants_')) return;

        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (!Array.isArray(list)) return;

          list.forEach((p) => {
            const isLeader = norm(p.studentId) === myId;
            const isMember =
              Array.isArray(p.members) &&
              p.members.some((m) =>
                norm(m).split(/[^a-z0-9_-]+/).includes(myId)
              );

            if (isLeader || isMember) {
              found.push({
                id: `${key}_${p.id}`,
                eventName: p.eventName,
                eventType: p.eventType,
                role: isLeader
                  ? (p.eventType === 'Group' ? 'Team Leader' : 'Participant')
                  : 'Team Member',
                status: p.status,
              });
            }
          });
        } catch (e) {
          console.error('Failed to read registrations', e);
        }
      });

      setMyPrograms(found);
    };

    loadPrograms();
    window.addEventListener('storage', loadPrograms);
    window.addEventListener('focus', loadPrograms);

    return () => {
      window.removeEventListener('storage', loadPrograms);
      window.removeEventListener('focus', loadPrograms);
    };
  }, [student]);

  const handlePayFund = () => {
    setFundPaid(true);
    if (student) {
      localStorage.setItem(`student_fund_paid_${student.id || student.email}`, 'true');
    }
    alert('Successfully paid the fest fund to your class teacher! Receipt recorded.');
  };

  const handleEmergencyCall = () => {
    alert('Connecting to Fest Emergency Volunteer Response Team (Hotline: +91 98765 43210)...');
  };

  const stagePrograms = [
    { id: 1, name: 'Classical Dance (Solo)', stage: 'Stage 1 - Main Auditorium', status: 'Running Now', currentParticipant: 'Ananya S. (ECE)' },
    { id: 2, name: 'English Recitation', stage: 'Stage 2 - Seminar Hall', status: 'Up Next', currentParticipant: 'Rahul V. (CSE)' },
    { id: 3, name: 'Light Music (Solo)', stage: 'Stage 1 - Main Auditorium', status: 'Completed', result: '1st: Diya M. (EEE) · 2nd: Karthik R. (ME)' },
  ];

  const cardStyle = 'rounded-2xl border border-slate-200 bg-white shadow-sm p-6';

  return (
    <div className="fest-body flex min-h-screen bg-[#F5F8F8] text-slate-800">
      <style>{FONT_CSS}</style>

      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#072C31] p-6 text-white md:flex">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="fest-display text-lg font-extrabold">CampusFest</h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F5A623]">
                Student Portal
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">{student?.name || 'Student'}</p>
            <p className="mt-1 text-[10px] text-[#F5A623]">Reg No: {student?.registerNo || student?.email}</p>
            <p className="text-[10px] text-white/60">Dept: {student?.department || 'N/A'}</p>
          </div>

          {/* Emergency Support button placed at the top of sidebar */}
          <div className="p-4 mx-4 mb-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl">
            <p className="text-xs font-bold text-rose-200 mb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} /> Emergency Support
            </p>
            <button
              onClick={handleEmergencyCall}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              <PhoneCall size={14} /> Call Volunteer Team
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5">
          <Link
            to="/login"
            onClick={() => localStorage.removeItem('fest_user')}
            className="flex items-center gap-2 text-sm font-semibold text-[#F5A623] transition hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10 space-y-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D6336C]">
              <span className="h-2 w-2 rounded-full bg-[#D6336C]" />
              Student Dashboard
            </div>
            <h1 className="fest-display text-2xl font-extrabold tracking-tight text-[#0B3F46] sm:text-3xl">
              Welcome back, {student?.name || 'Participant'}!
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your fest fund payments, view program schedules, duties, and live stage results.
            </p>
          </div>
        </header>

        <div className="space-y-6">

          {/* SECTION 1: Class Teacher Fund Payment Gateway */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <IndianRupee size={24} />
              </div>
              <div>
                <h3 className="fest-display text-base font-bold text-[#0B3F46]">Department Fest Fund Contribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pay your mandatory fest fee securely to your class teacher.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-base text-[#0E4D55]">₹300</span>
              {fundPaid ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 size={16} /> Paid to Class Teacher
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handlePayFund}
                  className="bg-[#0B3F46] hover:bg-[#0E4D55] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Pay Fund Now
                </button>
              )}
            </div>
          </div>

          {/* SECTION 2: Conditional Duty Assignment Notice */}
          {student?.assignedDuty ? (
            <div className="rounded-2xl border-2 border-[#F5A623] bg-[#FFF8E9] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-xl bg-[#F5A623] p-2.5 text-[#2A1A00]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="fest-display font-bold text-[#0B3F46] text-base">
                    Committee Duty Assignment Notice
                  </h3>
                  <p className="text-xs text-slate-600">
                    Assigned by committee management for your department event.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 border border-amber-200/60 text-sm space-y-1">
                <p className="font-semibold text-slate-800">Task: {student.assignedDuty.task}</p>
                <p className="text-xs text-slate-500">Scheduled Time: <span className="font-medium text-[#0B3F46]">{student.assignedDuty.time}</span></p>
                <p className="text-xs text-slate-500">Committee: <span className="font-semibold text-[#D6336C]">{student.assignedDuty.committee}</span></p>
              </div>
            </div>
          ) : null}

          {/* SECTION 3: Registered Programs (only if registered by incharge teacher) */}
          {myPrograms.length > 0 && (
            <section className={cardStyle}>
              <h3 className="fest-display font-bold text-[#0B3F46] mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0B3F46]" /> My Registered Programs
              </h3>

              <div className="space-y-3 text-xs">
                {myPrograms.map((prog) => (
                  <div
                    key={prog.id}
                    className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block text-sm">{prog.eventName}</span>
                      <span className="text-[11px] text-slate-500">
                        {prog.eventType} Event · {prog.role}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 font-semibold flex items-center gap-1 border ${
                        prog.status === 'Submitted to Coordinator'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {prog.status === 'Submitted to Coordinator' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {prog.status === 'Submitted to Coordinator' ? 'Registered' : 'Pending Submission'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 4: Live Status Board & Results */}
          <section className={cardStyle}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="fest-display font-bold text-[#0B3F46] flex items-center gap-2">
                <Radio className="h-5 w-5 text-[#D6336C] animate-pulse" /> Live Stage Status & Results Board
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-200">
                🔴 Live Feed
              </span>
            </div>

            <div className="space-y-3">
              {stagePrograms.map((prog) => (
                <div key={prog.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{prog.name}</span>
                    <span className="text-slate-500 font-medium">{prog.stage}</span>
                    {prog.currentParticipant && (
                      <p className="text-xs text-[#0B3F46] mt-1 font-semibold">On Stage Now: {prog.currentParticipant}</p>
                    )}
                    {prog.result && (
                      <p className="text-xs text-emerald-800 mt-1 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                        🏆 Results: {prog.result}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                      prog.status === 'Running Now' ? 'bg-red-50 text-red-700 border border-red-200' :
                      prog.status === 'Up Next' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {prog.status === 'Running Now' && <Clock size={12} className="animate-spin" />}
                      {prog.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} CampusFest. Student Portal.
        </footer>
      </main>
    </div>
  );
}