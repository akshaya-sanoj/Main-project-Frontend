import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee,
  Calendar,
  Radio,
  ShieldAlert,
  PhoneCall,
  ArrowUpRight,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { normalizeDept } from '../../utils/deptKeys';
import { API_BASE, authHeaders } from '../../services/api';
import Studentlayout from '../components/Studentlayout';
import { getStudentNavItems } from '../components/Studentnav';
import FestFundTab from '../components/FestFundTab';
import DutyNoticeTab from '../components/DutyNoticeTab';
import MyProgramsTab from '../components/MyProgramsTab';
import LiveStatusTab from '../components/LiveStatusTab';
import Photo from '../../components/Photo';
import { triggerSosAlert } from '../../utils/sosAlerts';
import SosModal from '../../components/SosModal';

const sameId = (a, b) => String(a) === String(b);

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [myPrograms, setMyPrograms] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sosOpen, setSosOpen] = useState(false);

  const [fundDues, setFundDues] = useState([]);
  const [payBusyId, setPayBusyId] = useState(null);
  const [payMessage, setPayMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse((sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user')) || 'null');
    } catch (e) {
      console.error('Failed to parse user session', e);
    }
    if (!saved) return;
    setStudent(saved);

    const syncProfile = () => {
      if (!saved?.id) return;
      fetch(`${API_BASE}/users/${saved.id}`, { headers: authHeaders() })
        .then((res) => (res.ok ? res.json() : null))
        .then((fresh) => {
          if (fresh) {
            setStudent((prev) => ({
              ...prev,
              ...fresh,
              token: fresh.token || saved.token || prev?.token,
            }));
          }
        })
        .catch(() => {});
    };

    syncProfile();
    window.addEventListener('focus', syncProfile);
    const timer = setInterval(syncProfile, 15000);
    return () => {
      window.removeEventListener('focus', syncProfile);
      clearInterval(timer);
    };
  }, []);

  const deptKey = normalizeDept(student?.department || '');

  const loadFund = useCallback(async () => {
    if (!student?.id) return;
    const headers = authHeaders();
    const get = (path) => fetch(`${API_BASE}${path}`, { headers }).then((r) => (r.ok ? r.json() : []));
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

  // Verify Stripe payment after redirect back from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('stripe_session_id');
    const canceled = params.get('stripe_canceled');

    if (canceled) {
      setPayMessage({ type: 'error', text: 'Stripe payment was canceled.' });
      setActiveTab('fund');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (!sessionId || !student?.id) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/payments/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not verify payment.');

        await loadFund();
        setActiveTab('fund');
        setPayMessage({
          type: 'ok',
          text: `Payment recorded via Stripe for ${data.payment?.festName || 'Fest Fund'}. Thank you!`,
        });
      } catch (err) {
        setActiveTab('fund');
        setPayMessage({ type: 'error', text: err.message || 'Payment verification failed.' });
      } finally {
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
  }, [student?.id, loadFund]);

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
        const res = await fetch(`${API_BASE}/registrations`, { headers: authHeaders() });
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

  const startPayment = async (due) => {
    setPayMessage({ type: '', text: '' });

    if (!student?.classSection) {
      setPayMessage({
        type: 'error',
        text: 'Your class is not set on your account. Please ask your department coordinator.',
      });
      return;
    }

    setPayBusyId(due.fest.id);
    try {
      const res = await fetch(`${API_BASE}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
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
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || 'Could not start Stripe checkout.');
      }

      window.location.href = data.url;
    } catch (err) {
      setPayMessage({ type: 'error', text: err.message || 'Payment failed. Please try again.' });
      setPayBusyId(null);
    }
  };

  const unpaidCount = fundDues.filter((d) => !d.payment).length;
  const totalDueAmount = fundDues
    .filter((d) => !d.payment)
    .reduce((sum, d) => sum + (Number(d.fund?.amount) || 0), 0);

  const navItems = getStudentNavItems({
    hasFundDues: fundDues.length > 0,
    hasAssignedDuty: !!student?.assignedDuty,
    hasPrograms: myPrograms.length > 0,
  });

  const badges = {
    fund: unpaidCount,
    programs: myPrograms.length,
  };

  return (
    <Studentlayout
      activeTab={activeTab}
      onSelect={setActiveTab}
      navItems={navItems}
      badges={badges}
      student={student}
      onEmergencyCall={() => setSosOpen(true)}
    >
      {/* Compact Header for Inner Tabs */}
      {activeTab !== 'overview' && (
        <header
          style={{ backgroundColor: '#072C31' }}
          className="relative mb-8 overflow-hidden rounded-2xl bg-[#072C31] text-white shadow-sm"
        >
          <Photo src="/banner.png" alt="" eager className="absolute inset-0 h-full w-full" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#072C31] via-[#072C31]/80 to-[#072C31]/10"
          />
          <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
              <span className="h-2 w-2 rounded-full bg-[#F5A623]" />
              Student Dashboard
            </div>
            <h1 className="fest-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back, {student?.name || 'Participant'}!
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/75">
              Manage your fest fund payment, view program schedules, duties, and live stage results.
            </p>
          </div>
        </header>
      )}

      {/* LANDING VIEW (01 Overview) */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Hero Showcase Banner */}
          <section
            style={{ backgroundColor: '#072C31' }}
            className="animate-fest-up relative overflow-hidden rounded-3xl bg-[#072C31] text-white shadow-lg"
          >
            <Photo
              src="/banner.png"
              alt=""
              eager
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-700 hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#072C31] via-[#072C31]/85 to-[#072C31]/20"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#F5A623]/20 blur-3xl"
            />

            <div className="relative z-10 grid items-center gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F5A623]">
                  <Sparkles size={13} />
                  {student?.department || 'Campus'} {student?.classSection ? `· ${student.classSection}` : ''} · Student Pass
                </div>

                <h1 className="fest-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[40px]">
                  Welcome back, {student?.name || 'Participant'}!
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
                  Your all-in-one festival command center. Complete your fest fund payment, check your event entries and volunteer shifts, and follow live stage results.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('fund')}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#F5A623] px-5 py-3 text-sm font-extrabold text-[#2A1A00] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFB83D]"
                  >
                    <IndianRupee size={16} />
                    {unpaidCount > 0 ? `Pay Fest Fund (₹${totalDueAmount})` : 'View Fest Fund Receipt'}
                    <ArrowUpRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('live')}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    <Radio size={16} />
                    Live Stage Status
                  </button>
                </div>
              </div>

              {/* Floating Digital Pass Card */}
              <div className="hidden lg:col-span-4 lg:flex lg:justify-end">
                <div className="animate-fest-float w-full max-w-[270px] rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/15 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#F5A623]">
                      Digital Fest ID
                    </span>
                    <Award size={18} className="text-[#F5A623]" />
                  </div>
                  <p className="fest-display mt-3 truncate text-lg font-extrabold text-white">
                    {student?.name || 'Student'}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-white/75">
                    {student?.registerNo || student?.email || '—'}
                  </p>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#072C31]/70 px-3 py-2 text-xs">
                    <span className="text-white/70">Fund Status</span>
                    <span className={`font-bold ${unpaidCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {unpaidCount > 0 ? `${unpaidCount} Pending` : '✓ Cleared'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Status Alerts */}
          {student?.volunteerCommittee && !student?.assignedDuty && (
            <div className="animate-fest-up animate-fest-delay-1 rounded-2xl border border-[#072C31]/15 bg-[#E6F1F2] px-6 py-4 text-[#072C31] shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#072C31]/70">
                Volunteer Committee Member
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                You have been nominated to the Volunteer Committee{student.volunteerDept ? ` (${student.volunteerDept})` : ''}. Your specific duty will appear here once assigned by the Volunteer Head.
              </p>
            </div>
          )}

          {student?.assignedDuty && (
            <div className="animate-fest-up animate-fest-delay-1 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-950 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Volunteer Duty Assigned</p>
                <p className="mt-0.5 text-base font-extrabold text-[#072C31]">
                  Your duty: {student.assignedDuty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('duty')}
                className="self-start rounded-xl bg-[#072C31] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0D3D44] sm:self-auto"
              >
                View Duty Details
              </button>
            </div>
          )}

          {/* Staggered KPI Cards */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="animate-fest-up animate-fest-delay-1 group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F5A623]/60 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Fest Fund Status
                  </p>
                  <p className={`fest-display mt-2 text-2xl font-extrabold sm:text-3xl ${unpaidCount > 0 ? 'text-[#D6336C]' : 'text-emerald-600'}`}>
                    {fundDues.length === 0 ? 'No Dues' : unpaidCount > 0 ? `₹${totalDueAmount} Due` : 'All Paid'}
                  </p>
                </div>
                <div className={`rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${unpaidCount > 0 ? 'bg-[#FCE7EF] text-[#D6336C]' : 'bg-emerald-50 text-emerald-600'}`}>
                  {unpaidCount > 0 ? <IndianRupee size={21} /> : <CheckCircle2 size={21} />}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {unpaidCount > 0
                  ? `${unpaidCount} ${unpaidCount === 1 ? 'fest requires' : 'fests require'} contribution`
                  : 'All department fest contributions settled'}
              </p>
            </div>

            <div className="animate-fest-up animate-fest-delay-2 group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F5A623]/60 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Registered Programs
                  </p>
                  <p className="fest-display mt-2 text-2xl font-extrabold text-[#072C31] sm:text-3xl">
                    {myPrograms.length}
                  </p>
                </div>
                <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#072C31] transition-transform duration-300 group-hover:scale-110">
                  <Calendar size={21} />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {myPrograms.length > 0
                  ? 'Events entered by your department faculty'
                  : 'No program entries recorded yet'}
              </p>
            </div>

            <div className="animate-fest-up animate-fest-delay-3 group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F5A623]/60 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Volunteer Status
                  </p>
                  <p className={`fest-display mt-2 text-2xl font-extrabold sm:text-3xl ${student?.assignedDuty ? 'text-amber-600' : 'text-[#072C31]'}`}>
                    {student?.assignedDuty ? 'On Duty' : student?.volunteerCommittee ? 'Committee' : 'Participant'}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700 transition-transform duration-300 group-hover:scale-110">
                  <ShieldAlert size={21} />
                </div>
              </div>
              <p className="mt-3 truncate text-xs text-slate-500">
                {student?.assignedDuty || 'Standard student access'}
              </p>
            </div>
          </section>

          {/* Quick-Jump Feature Cards */}
          <section className="animate-fest-up animate-fest-delay-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="fest-display text-lg font-extrabold text-[#072C31]">
                Explore Your Portal
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                Quick navigation
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveTab('fund')}
                className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#072C31] hover:shadow-md"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#072C31] text-[#F5A623] transition-transform duration-300 group-hover:scale-110">
                      <IndianRupee size={20} />
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F8F8] text-[#072C31] transition-colors group-hover:bg-[#F5A623] group-hover:text-[#2A1A00]">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <h3 className="fest-display text-base font-extrabold text-[#072C31]">
                    Fest Fund & Receipts
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    Pay your department fest contribution online via Stripe or view your verified cash payment status.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold text-[#072C31]">
                    {unpaidCount > 0 ? 'Complete payment →' : 'View payment history →'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#072C31] hover:shadow-md"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#072C31] text-[#F5A623] transition-transform duration-300 group-hover:scale-110">
                      <Radio size={20} />
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F8F8] text-[#072C31] transition-colors group-hover:bg-[#F5A623] group-hover:text-[#2A1A00]">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <h3 className="fest-display text-base font-extrabold text-[#072C31]">
                    Live Stage & Results
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    Follow live stage announcements, ongoing competitions, and published winners across all venues.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold text-[#072C31]">
                    Check live stage →
                  </span>
                </div>
              </button>

              {myPrograms.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('programs')}
                  className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#072C31] hover:shadow-md"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#072C31] text-[#F5A623] transition-transform duration-300 group-hover:scale-110">
                        <Calendar size={20} />
                      </div>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F8F8] text-[#072C31] transition-colors group-hover:bg-[#F5A623] group-hover:text-[#2A1A00]">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                    <h3 className="fest-display text-base font-extrabold text-[#072C31]">
                      My Registered Programs
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      View the {myPrograms.length} {myPrograms.length === 1 ? 'event' : 'events'} you are registered in along with your team role.
                    </p>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold text-[#072C31]">
                      View my events →
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSosOpen(true)}
                  className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-400 hover:shadow-md"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600 text-white transition-transform duration-300 group-hover:scale-110">
                        <PhoneCall size={20} />
                      </div>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                    <h3 className="fest-display text-base font-extrabold text-[#072C31]">
                      Emergency SOS Support
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      Need urgent medical, safety, or venue help? Send an instant SOS alert to the Volunteer Team.
                    </p>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold text-rose-600">
                      Alert volunteer team →
                    </span>
                  </div>
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* INNER TABS */}
      {activeTab !== 'overview' && (
        <>
          {student?.volunteerCommittee && !student?.assignedDuty && (
            <div className="mb-6 rounded-2xl border border-[#072C31]/15 bg-[#E6F1F2] px-6 py-4 text-[#072C31] shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#072C31]/70">
                Volunteer Committee Member
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                You have been nominated to the Volunteer Committee{student.volunteerDept ? ` (${student.volunteerDept})` : ''}. Your specific duty will appear here once assigned by the Volunteer Head.
              </p>
            </div>
          )}

          {student?.assignedDuty && activeTab !== 'duty' && (
            <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-950 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Volunteer Duty Assigned</p>
                <p className="mt-0.5 text-base font-extrabold text-[#072C31]">
                  Your duty: {student.assignedDuty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('duty')}
                className="self-start rounded-xl bg-[#072C31] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0D3D44] sm:self-auto"
              >
                View Duty Details
              </button>
            </div>
          )}

          <div className="space-y-6">
            {activeTab === 'fund' && (
              <FestFundTab
                student={student}
                fundDues={fundDues}
                startPayment={startPayment}
                payBusyId={payBusyId}
                payMessage={payMessage}
              />
            )}

            {activeTab === 'duty' && student?.assignedDuty && (
              <DutyNoticeTab assignedDuty={student.assignedDuty} student={student} />
            )}

            {activeTab === 'programs' && myPrograms.length > 0 && (
              <MyProgramsTab myPrograms={myPrograms} />
            )}

            {activeTab === 'live' && (
              <LiveStatusTab />
            )}
          </div>
        </>
      )}

      <SosModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        defaultLocation={
          student?.classSection
            ? `${student?.department || ''} · ${student.classSection}`.trim()
            : student?.department || ''
        }
        onSubmit={async ({ matter, location }) => {
          await triggerSosAlert({
            senderName: student?.name || 'Student',
            senderRole: 'Student',
            department: student?.department || '',
            classSection: student?.classSection || '',
            matter,
            location,
          });
          alert('Emergency SOS alert sent to the Volunteer Team!');
        }}
      />

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CampusFest. Student Portal.
      </footer>
    </Studentlayout>
  );
}