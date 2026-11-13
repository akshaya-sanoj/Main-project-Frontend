import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Calendar, ShieldAlert, LogOut, CheckCircle2,
  IndianRupee, PhoneCall, Radio, Clock
} from 'lucide-react';
import { normalizeDept } from '../../utils/deptKeys';
import { API_BASE } from '../../services/api';

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
.fest-display { font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif; }
.fest-body { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
`;

const sameId = (a, b) => String(a) === String(b);

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [myPrograms, setMyPrograms] = useState([]);

  // Fest fund: one due per fest that has a fund set for this student's department
  const [fundDues, setFundDues] = useState([]);
  const [payBusyId, setPayBusyId] = useState(null);
  const [payMessage, setPayMessage] = useState({ type: '', text: '' });

  // Load the logged-in student, then refresh the profile from the server
  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('fest_user') || 'null');
    } catch (e) {
      console.error('Failed to parse user session', e);
    }
    if (!saved) return;
    setStudent(saved);

    if (saved.id) {
      fetch(`${API_BASE}/users/${saved.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((fresh) => fresh && setStudent(fresh))
        .catch(() => {});
    }
  }, []);

  const deptKey = normalizeDept(student?.department || '');

  // Load the fund amount and payment status of every fest that has a fund for this department
  const loadFund = useCallback(async () => {
    if (!student?.id) return;
    const get = (path) => fetch(`${API_BASE}${path}`).then((r) => (r.ok ? r.json() : []));
    try {
      const [funds, pays, fests] = await Promise.all([get('/deptFunds'), get('/payments'), get('/fests')]);
      const dues = (Array.isArray(fests) ? fests : [])
        .map((fest) => {
          const fund = (Array.isArray(funds) ? funds : []).find(
            (f) => f.deptKey === deptKey && sameId(f.festId, fest.id)
          );
          if (!fund) return null;
          const payment = (Array.isArray(pays) ? pays : []).find(
            (p) => sameId(p.studentId, student.id) && sameId(p.festId, fest.id) && p.status === 'paid'
          );
          return { fest, fund, payment: payment || null };
        })
        .filter(Boolean)
        .sort((a, b) => String(a.fest.festDate || '').localeCompare(String(b.fest.festDate || '')));
      setFundDues(dues);
    } catch (e) {
      console.error('Failed to load fund data', e);
    }
  }, [student?.id, deptKey]);

  useEffect(() => {
    loadFund();
  }, [loadFund]);

  // Load programs this student was entered for by incharge teachers (saved on the server)
  useEffect(() => {
    if (!student) return;

    const norm = (v) => String(v || '').trim().toLowerCase();
    const myId = norm(student.registerNo || student.id);

    if (!myId) {
      setMyPrograms([]);
      return;
    }

    const loadPrograms = async () => {
      try {
        const res = await fetch(`${API_BASE}/registrations`);
        if (!res.ok) throw new Error('Registrations list is missing');
        const list = await res.json();
        const found = [];

        (Array.isArray(list) ? list : []).forEach((p) => {
          const isLeader = norm(p.studentId) === myId;
          const isMember =
            Array.isArray(p.members) &&
            p.members.some((m) => norm(m).split(/[^a-z0-9_-]+/).includes(myId));

          if (isLeader || isMember) {
            found.push({
              id: p.id,
              eventName: p.eventName,
              festName: p.festName || '',
              eventType: p.eventType,
              role: isLeader
                ? (p.eventType === 'Group' ? 'Team Leader' : 'Participant')
                : 'Team Member',
              status: p.status,
            });
          }
        });

        setMyPrograms(found);
      } catch (e) {
        console.error('Failed to read registrations', e);
      }
    };

    loadPrograms();
    window.addEventListener('focus', loadPrograms);
    const timer = setInterval(loadPrograms, 20000);

    return () => {
      window.removeEventListener('focus', loadPrograms);
      clearInterval(timer);
    };
  }, [student]);

  /*
   * startPayment: the ONLY function that has to change when Stripe is added.
   *
   * TEST MODE (now): saves a "paid" record straight away. Nothing real is charged.
   *
   * STRIPE (later, once the backend exists):
   *   1. POST to your backend, e.g. /api/payments/checkout, with only the student's id and the fest's id.
   *      The backend looks up the department's fund amount for that fest itself; never send the amount from here.
   *   2. The backend creates a Stripe Checkout Session using the secret key and returns its url.
   *   3. window.location.href = session.url  (the student pays on Stripe's page)
   *   4. Stripe calls your backend webhook. ONLY the webhook saves the payment as "paid"
   *      (provider: 'stripe', providerRef: the Stripe payment id, festId: the fest paid for).
   *   5. On return to this page, loadFund() runs and shows Paid.
   * The rest of this page, the class teacher's list and the coordinator totals stay unchanged.
   */
  const startPayment = async (due) => {
    setPayMessage({ type: '', text: '' });

    if (!student?.classSection) {
      setPayMessage({ type: 'error', text: 'Your class is not set on your account. Please ask your department coordinator.' });
      return;
    }

    setPayBusyId(due.fest.id);
    try {
      // Check again so a double click can never create two payments for the same fest
      const existing = await fetch(`${API_BASE}/payments?studentId=${student.id}`).then((r) => (r.ok ? r.json() : []));
      if (
        Array.isArray(existing) &&
        existing.some((p) => p.status === 'paid' && sameId(p.festId, due.fest.id))
      ) {
        await loadFund();
        return;
      }

      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festId: due.fest.id,
          festName: due.fest.name,
          studentId: student.id,
          studentName: student.name,
          registerNo: student.registerNo || '',
          department: student.department,
          deptKey,
          classSection: student.classSection,
          amount: Number(due.fund.amount),
          currency: 'INR',
          status: 'paid',
          provider: 'test',
          providerRef: null,
          paidAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Could not save your payment. Please try again.');

      await loadFund();
      setPayMessage({ type: 'ok', text: `Payment recorded for ${due.fest.name}. Thank you!` });
    } catch (err) {
      setPayMessage({ type: 'error', text: err.message || 'Payment failed. Please try again.' });
    } finally {
      setPayBusyId(null);
    }
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
            {student?.classSection && (
              <p className="text-[10px] text-white/60">Class: {student.classSection}</p>
            )}
          </div>

          {/* Emergency Support */}
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
              Manage your fest fund payment, view program schedules, duties, and live stage results.
            </p>
          </div>
        </header>

        <div className="space-y-6">

          {/* SECTION 1: Fest fund payments (one card per fest) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <IndianRupee size={24} />
              </div>
              <div>
                <h3 className="fest-display text-base font-bold text-[#0B3F46]">Fest Fund</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {student?.department
                    ? `Set by the ${student.department} department for each fest. Pay once per fest.`
                    : 'Set by your department for each fest. Pay once per fest.'}
                </p>
              </div>
            </div>

            {fundDues.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                Your department coordinator has not set a fest fund amount yet. It will appear here once it is set.
              </p>
            ) : (
              <div className="space-y-3">
                {fundDues.map((due) => (
                  <div
                    key={due.fest.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#0B3F46]">{due.fest.name}</p>
                      <p className="text-xs text-slate-500">
                        Fest fund due: <span className="font-mono font-bold text-[#0E4D55]">₹{due.fund.amount}</span>
                        {due.fest.festDate ? ` · Fest on ${new Date(due.fest.festDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                      </p>
                    </div>

                    {due.payment ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 size={16} /> Paid ₹{due.payment.amount}
                        {due.payment.paidAt ? ` · ${new Date(due.payment.paidAt).toLocaleDateString('en-IN')}` : ''}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startPayment(due)}
                        disabled={payBusyId !== null}
                        className="bg-[#0B3F46] hover:bg-[#0E4D55] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {payBusyId !== null && sameId(payBusyId, due.fest.id) ? 'Processing...' : `Pay ₹${due.fund.amount}`}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!student?.classSection && student && fundDues.some((d) => !d.payment) && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                Your class is not set on your account, so your class teacher cannot see your payment. Please ask your department coordinator.
              </p>
            )}

            {payMessage.text && (
              <p
                role={payMessage.type === 'error' ? 'alert' : 'status'}
                className={`rounded-xl border p-3 text-xs font-semibold ${
                  payMessage.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                {payMessage.text}
              </p>
            )}
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
                        {prog.eventType} Event · {prog.role}{prog.festName ? ` · ${prog.festName}` : ''}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 font-semibold flex items-center gap-1 border ${
                        prog.status !== 'Pending Submission'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {prog.status !== 'Pending Submission' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {prog.status !== 'Pending Submission' ? 'Registered' : 'Pending Submission'}
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