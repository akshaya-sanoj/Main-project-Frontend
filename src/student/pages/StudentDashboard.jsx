import React, { useState, useEffect, useCallback } from 'react';
import { normalizeDept } from '../../utils/deptKeys';
import { API_BASE } from '../../services/api';
import Studentlayout from '../components/Studentlayout';
import { getStudentNavItems } from '../components/Studentnav';
import FestFundTab from '../components/FestFundTab';
import DutyNoticeTab from '../components/DutyNoticeTab';
import MyProgramsTab from '../components/MyProgramsTab';
import LiveStatusTab from '../components/LiveStatusTab';

const sameId = (a, b) => String(a) === String(b);

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [myPrograms, setMyPrograms] = useState([]);
  const [activeTab, setActiveTab] = useState('fund');

  const [fundDues, setFundDues] = useState([]);
  const [payBusyId, setPayBusyId] = useState(null);
  const [payMessage, setPayMessage] = useState({ type: '', text: '' });

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

  const startPayment = async (due) => {
    setPayMessage({ type: '', text: '' });

    if (!student?.classSection) {
      setPayMessage({ type: 'error', text: 'Your class is not set on your account. Please ask your department coordinator.' });
      return;
    }

    setPayBusyId(due.fest.id);
    try {
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

  const navItems = getStudentNavItems({
    hasFundDues: fundDues.length > 0,
    hasAssignedDuty: !!student?.assignedDuty,
    hasPrograms: myPrograms.length > 0,
  });

  const badges = {
    fund: fundDues.filter((d) => !d.payment).length,
    programs: myPrograms.length,
  };

  return (
    <Studentlayout
      activeTab={activeTab}
      onSelect={setActiveTab}
      navItems={navItems}
      badges={badges}
      student={student}
      onEmergencyCall={handleEmergencyCall}
    >
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center mb-8">
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
          <DutyNoticeTab assignedDuty={student.assignedDuty} />
        )}

        {activeTab === 'programs' && myPrograms.length > 0 && (
          <MyProgramsTab myPrograms={myPrograms} />
        )}

        {activeTab === 'live' && (
          <LiveStatusTab />
        )}
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CampusFest. Student Portal.
      </footer>
    </Studentlayout>
  );
}