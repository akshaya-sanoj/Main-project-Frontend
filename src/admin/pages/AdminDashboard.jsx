import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Trophy, Plus, Users, Calendar, DollarSign, Award, Trash2, ShieldAlert,
  UserCheck, ClipboardList, Send, Pencil,
} from 'lucide-react';
import SubmissionsFestCards from './SubmissionsFestCards';
import AdminLayout from '../../admin/components/Adminlayout';
import Photo from '../../components/Photo';
import { confirmAction } from '../../utils/alert';
import { API_BASE, authHeaders } from '../../services/api';

const LANGUAGES = ['Malayalam', 'English', 'Hindi', 'Arabic', 'Urdu', 'Sanskrit', 'Tamil'];

const PROGRAM_CATEGORIES = [
  { id: 'cultural', label: 'Cultural / Arts' },
  { id: 'literary', label: 'Literary' },
  { id: 'sports', label: 'Sports & Games' },
  { id: 'technical', label: 'Technical' },
];
const SPORT_TYPES = ['Track', 'Field', 'Indoor game', 'Outdoor team game', 'Racket sport', 'Combat sport', 'Other'];
const GENDERS = ['Open', 'Boys', 'Girls', 'Mixed'];
const TECH_TYPES = ['Coding', 'Quiz', 'Hackathon', 'Robotics', 'Paper presentation', 'Project exhibition', 'Design / Web', 'Gaming', 'Other'];
const TECH_MODES = ['Offline', 'Online'];

const RANK_POINTS = { '1st Place': 5, '2nd Place': 3, '3rd Place': 1 };

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
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
      throw new Error('The server has no list for this yet. Check that "fests", "programs", "sections", "deptFunds", "payments" and "registrations" are configured on the backend.');
    }
    throw new Error(res.status === 404 ? 'That item was not found. It may already have been removed.' : 'The server could not save that. Please try again.');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

const fmtDate = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtCurrency = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

const sameId = (a, b) => String(a) === String(b);

const inChunks = async (items, fn, size = 15) => {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
};

const parseStaffList = (text) => {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { rows: [], duplicates: 0 };

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  let table = lines.map((line) => line.split(delimiter).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim()));

  let sCol = 0;
  let nCol = 1;
  let dCol = 2;
  const head = table[0].map((c) => c.toLowerCase());
  if (head.some((c) => /^(staff|emp|id|name|teacher|faculty|dept|department|s\.?no|sl)/.test(c))) {
    let s = head.findIndex((c) => /(\bid\b|staff.?id|emp|code|number)/.test(c) && !/name/.test(c));
    let n = head.findIndex((c) => /name/.test(c));
    let d = head.findIndex((c) => /(dept|department|section)/.test(c));
    if (s < 0) s = n === 0 ? 1 : 0;
    if (n < 0) n = s === 1 ? 0 : 1;
    if (d < 0) d = [0, 1, 2].find((i) => i !== s && i !== n);
    sCol = s;
    nCol = n;
    dCol = d;
    table = table.slice(1);
  }

  const seen = new Set();
  const rows = [];
  let duplicates = 0;
  table.forEach((cells) => {
    const staffId = (cells[sCol] || '').trim();
    const key = staffId.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key) return;
    if (seen.has(key)) {
      duplicates += 1;
      return;
    }
    seen.add(key);
    rows.push({ staffId, name: (cells[nCol] || '').trim(), department: (cells[dCol] || '').trim() });
  });
  return { rows, duplicates };
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanDeptLabel = (d) => String(d || '').replace(/"/g, '').trim();
const hasAssignments = (p) => Object.values(p.assignments || {}).some((list) => list.length > 0);
const isTeacher = (u) => u.baseType === 'teacher' && u.approved !== false && !u.rejected;
const hasDuty = (u, duty) => (u.duties || []).includes(duty) || u.role === duty;

const categoryOf = (p) => p.category || 'cultural';
const usesStage = (cat) => cat === 'cultural' || cat === 'literary';
const teamWord = (cat) => (cat === 'sports' || cat === 'technical' ? 'Team' : 'Group');
const programDetails = (p) => {
  const cat = categoryOf(p);
  const parts = [];
  if (usesStage(cat)) {
    const langs = Array.isArray(p.language)
      ? p.language
      : (typeof p.language === 'string' && p.language !== 'Not applicable' ? [p.language] : []);
    if (langs.length) parts.push(langs.join(', '));
    if (p.stage) parts.push(p.stage === 'offstage' ? 'Off stage' : 'On stage');
  } else if (cat === 'sports') {
    if (p.sportType) parts.push(p.sportType);
    if (p.gender) parts.push(p.gender);
  } else if (cat === 'technical') {
    if (p.techType) parts.push(p.techType);
    if (p.mode) parts.push(p.mode);
  }
  parts.push(p.kind === 'group' ? `${teamWord(cat)}, up to ${p.maxGroupSize}` : 'Individual');
  return parts;
};

const PENDING_ROLES = [
  { id: 'all', label: 'All' },
  { id: 'student', label: 'Student' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'class_teacher', label: 'Class Teacher' },
  { id: 'program_teacher', label: 'Teacher' },
  { id: 'dept_coordinator', label: 'Department Coordinator' },
];

const roleKeyOf = (u) => {
  if (hasDuty(u, 'dept_coordinator')) return 'dept_coordinator';
  if (hasDuty(u, 'class_teacher')) return 'class_teacher';
  if (hasDuty(u, 'volunteer') || u.baseType === 'volunteer') return 'volunteer';
  if (u.baseType === 'student') return 'student';
  if (u.baseType === 'teacher') return 'program_teacher';
  return u.role || 'other';
};
const roleLabelOf = (u) =>
  PENDING_ROLES.find((r) => r.id === roleKeyOf(u))?.label || u.role || 'Unknown';

const inputStyle =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';
const cardStyle = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const primaryButton =
  'flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30 disabled:cursor-not-allowed disabled:opacity-60';
const ghostButton =
  'flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0B3F46] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#0B3F46]/10 disabled:cursor-not-allowed disabled:opacity-60';

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const EMPTY_FEST = {
  name: '',
  mode: 'College',
  deadline: '',
  festDate: '',
  venue: '',
  volunteerCoord: '',
  foodCoord: '',
  mediaCoord: '',
  judgeCoord: '',
};
const EMPTY_PROGRAM = {
  id: null, name: '', category: 'cultural', stage: 'onstage', language: [],
  sportType: 'Track', gender: 'Open', techType: 'Coding', mode: 'Offline',
  kind: 'individual', maxGroupSize: '',
};
const EMPTY_COORD = { teacherName: '', department: '' };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('admin_tab') || 'fests');

  const [users, setUsers] = useState([]);
  const [fests, setFests] = useState(null);
  const [programs, setPrograms] = useState([]);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [festForm, setFestForm] = useState(EMPTY_FEST);
  const [programFestId, setProgramFestId] = useState('');
  const [programForm, setProgramForm] = useState(null);
  const [coordForm, setCoordForm] = useState(EMPTY_COORD);
  const [headsForm, setHeadsForm] = useState(null);
  const [coordFestId, setCoordFestId] = useState('');
  const [overviewFestId, setOverviewFestId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [deptFunds, setDeptFunds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [fundRemittances, setFundRemittances] = useState([]);
  const [staffLists, setStaffLists] = useState([]);
  const [staffText, setStaffText] = useState('');
  const [results, setResults] = useState([]);

  const loadAll = useCallback(async () => {
    const [u, f, p, regs, df, pay, staff, res, rems] = await Promise.all([
      request('/users'),
      request('/fests'),
      request('/programs'),
      request('/registrations').catch(() => []),
      request('/deptFunds').catch(() => []),
      request('/payments').catch(() => []),
      request('/staffLists').catch(() => []),
      request('/results').catch(() => []),
      request('/fundRemittances').catch(() => []),
    ]);
    setUsers(Array.isArray(u) ? u : []);
    setFests(Array.isArray(f) ? f : []);
    setPrograms(Array.isArray(p) ? p : []);
    setRegistrations(Array.isArray(regs) ? regs : []);
    setDeptFunds(Array.isArray(df) ? df : []);
    setPayments(Array.isArray(pay) ? pay : []);
    setStaffLists(Array.isArray(staff) ? staff : []);
    setResults(Array.isArray(res) ? res : []);
    setFundRemittances(Array.isArray(rems) ? rems : []);
  }, []);

  useEffect(() => {
    loadAll().catch((e) => { setError(e.message); setFests([]); });
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

  useEffect(() => {
    if (fests && fests.length > 0 && !fests.some((f) => sameId(f.id, programFestId))) {
      setProgramFestId(String(fests[fests.length - 1].id));
    }
  }, [fests, programFestId]);

  useEffect(() => {
    if (fests && fests.length > 0 && !fests.some((f) => sameId(f.id, coordFestId))) {
      setCoordFestId(String(fests[fests.length - 1].id));
    }
  }, [fests, coordFestId]);

  useEffect(() => {
    if (fests && fests.length > 0 && !fests.some((f) => sameId(f.id, overviewFestId))) {
      setOverviewFestId(String(fests[fests.length - 1].id));
    }
  }, [fests, overviewFestId]);

  const run = async (fn, successMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await loadAll();
      if (successMessage) setNotice(successMessage);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    sessionStorage.setItem('admin_tab', id);
    setError('');
    setNotice('');
  };

  if (!(sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user'))) return <Navigate to="/login" replace />;

  const coordinatorUsers = users.filter((u) => hasDuty(u, 'dept_coordinator') && u.approved !== false && !u.rejected);
  const pendingUsers = users.filter((u) => u.approved === false && !u.rejected && u.baseType === 'teacher');
  const visiblePending = pendingUsers;
  const programsOf = (festId) => programs.filter((p) => sameId(p.festId, festId));
  const selectedFest = (fests || []).find((f) => sameId(f.id, programFestId)) || null;
  const festPrograms = selectedFest ? programsOf(selectedFest.id) : [];
  const coordFest = (fests || []).find((f) => sameId(f.id, coordFestId)) || null;
  const festCoordinators = coordinatorUsers.filter((u) =>
    coordFest && Array.isArray(u.festIds) && u.festIds.some((id) => sameId(id, coordFest.id))
  );
  const forwardedRegs = registrations.filter((r) => r.status === 'Forwarded to Admin');
  const submissionCount = new Set(forwardedRegs.map((r) => `${r.festId}|${r.deptKey}`)).size;

  // ---------- Overview: Fest, Participation, Funds & Leaderboard from DB ----------
  const overviewFest = (fests || []).find((f) => sameId(f.id, overviewFestId)) || (fests && fests[fests.length - 1]) || null;
  const overviewPrograms = overviewFest ? programsOf(overviewFest.id) : programs;
  const overviewRegs = registrations.filter(
    (r) => r.status !== 'Pending Submission' && (!overviewFest || sameId(r.festId, overviewFest.id))
  );

  const participationSummary = (() => {
    const isSchool = overviewFest?.mode === 'School';
    const minRequired = 3;
    const goingAhead = [];
    const cancelled = [];

    overviewPrograms.forEach((prog) => {
      const progRegs = overviewRegs.filter((r) => sameId(r.programId, prog.id));
      const deptMap = new Map();
      const studentNames = new Set();

      progRegs.forEach((r) => {
        const key = r.deptKey || norm(r.department) || 'unknown';
        const label = cleanDeptLabel(r.department || r.deptKey) || 'Unknown';
        if (!deptMap.has(key)) deptMap.set(key, label);
        const sName = String(r.studentName || r.name || '').trim();
        if (sName) studentNames.add(sName);
      });

      const deptCount = deptMap.size;
      const participantCount = studentNames.size > 0 ? studentNames.size : progRegs.length;
      const metricCount = isSchool ? participantCount : deptCount;
      const deptsList = [...deptMap.values()];
      const namesList = [...studentNames];

      if (metricCount >= minRequired) {
        goingAhead.push({
          id: prog.id,
          name: prog.name,
          deptCount,
          participantCount,
          deptsText: deptsList.join(', ') || '—',
        });
      } else {
        cancelled.push({
          id: prog.id,
          name: prog.name,
          deptCount,
          participantCount,
          isSchool,
          joinedText: namesList.length > 0 ? namesList.join(', ') : deptsList.join(', ') || 'None yet',
        });
      }
    });

    return { isSchool, minRequired, goingAhead, cancelled };
  })();

  const deptFundRows = (() => {
    const byDept = new Map();
    const ensureDept = (key, label) => {
      const k = key || norm(label);
      if (!k) return null;
      if (!byDept.has(k)) {
        byDept.set(k, {
          key: k,
          name: cleanDeptLabel(label) || k,
          target: 0,
          collected: 0,
          paidCount: 0,
          totalStudents: 0,
          remitted: 0,
        });
      }
      const entry = byDept.get(k);
      if (label && (!entry.name || entry.name === k)) entry.name = cleanDeptLabel(label);
      return entry;
    };

    users.forEach((u) => {
      if (u.department) {
        const row = ensureDept(norm(u.department), u.department);
        if (row && u.baseType === 'student' && u.approved !== false && !u.rejected) {
          row.totalStudents += 1;
        }
      }
    });

    deptFunds
      .filter((f) => !overviewFest || sameId(f.festId, overviewFest.id))
      .forEach((f) => {
        const row = ensureDept(f.deptKey || norm(f.department), f.department || f.deptKey);
        if (row) row.target = Number(f.amount) || 0;
      });

    const userById = new Map(users.map((u) => [String(u.id), u]));
    payments
      .filter((p) => p.status === 'paid' && (!overviewFest || sameId(p.festId, overviewFest.id)))
      .forEach((p) => {
        const stu = userById.get(String(p.studentId));
        const deptName = p.department || stu?.department || '';
        const row = ensureDept(p.deptKey || norm(deptName), deptName);
        if (row) {
          row.collected += Number(p.amount) || 0;
          row.paidCount += 1;
        }
      });

    fundRemittances
      .filter((r) => !overviewFest || sameId(r.festId, overviewFest.id))
      .forEach((r) => {
        const row = ensureDept(r.deptKey || norm(r.department), r.department || r.deptKey);
        if (row) row.remitted += Number(r.amount) || 0;
      });

    return [...byDept.values()].sort((a, b) => b.collected - a.collected || b.target - a.target);
  })();

  const totalDeptCollected = deptFundRows.reduce((sum, d) => sum + d.collected, 0);

  const deptTotals = (() => {
    const latest = new Map();
    results
      .filter((x) => x.status === 'submitted' && (!overviewFest || !x.festId || sameId(x.festId, overviewFest.id)))
      .forEach((x) => {
        const old = latest.get(x.registrationId);
        if (!old || String(x.submittedAt) > String(old.submittedAt)) latest.set(x.registrationId, x);
      });
    const totals = new Map();
    latest.forEach((x) => {
      const key = x.deptKey || norm(x.department) || cleanDeptLabel(x.department);
      const t = totals.get(key) || {
        name: cleanDeptLabel(x.department || x.deptKey) || 'Unknown',
        points: 0,
      };
      t.points += RANK_POINTS[x.rank] || 0;
      totals.set(key, t);
    });
    return [...totals.values()].sort((a, b) => b.points - a.points);
  })();

  const unlinkedCoordinators = coordinatorUsers.filter((u) => !Array.isArray(u.festIds) || u.festIds.length === 0);

  // ---------- Fests ----------
  const handleCreateFest = async (e) => {
    e.preventDefault();
    const f = festForm;
    if (!f.name.trim() || !f.deadline || !f.festDate || !f.venue.trim()) {
      setError('Fill in the fest name, due date, fest date and venue.');
      return;
    }
    if (f.deadline > f.festDate) {
      setError('The data-entry due date must be on or before the fest date.');
      return;
    }
    if (fests.some((x) => x.name.trim().toLowerCase() === f.name.trim().toLowerCase())) {
      setError('A fest with this name already exists.');
      return;
    }
    const ok = await run(
      () => request('/fests', send('POST', {
        name: f.name.trim(),
        mode: f.mode,
        deadline: f.deadline,
        festDate: f.festDate,
        venue: f.venue.trim(),
        volunteerCoord: (f.volunteerCoord || '').trim() || 'Unassigned',
        foodCoord: (f.foodCoord || '').trim() || 'Unassigned',
        mediaCoord: (f.mediaCoord || '').trim() || 'Unassigned',
        judgeCoord: (f.judgeCoord || '').trim() || 'Unassigned',
        published: false,
        createdAt: new Date().toISOString(),
      })),
      'Fest created. Open Programs to add its programs, then publish the list.'
    );
    if (ok) setFestForm(EMPTY_FEST);
  };

  const handleDeleteFest = async (fest) => {
    if (programsOf(fest.id).some(hasAssignments)) {
      setError('Teachers are already assigned to programs in this fest, so it cannot be deleted.');
      return;
    }
    if (!await confirmAction(`Delete "${fest.name}" with its programs?`)) return;
    await run(async () => {
      await Promise.all(programsOf(fest.id).map((p) => request(`/programs/${p.id}`, { method: 'DELETE' })));
      await request(`/fests/${fest.id}`, { method: 'DELETE' });
    }, 'Fest deleted.');
  };

  const handleSaveHeads = async (e) => {
    e.preventDefault();
    const h = headsForm;
    const ok = await run(
      () => request(`/fests/${h.id}`, send('PATCH', {
        volunteerCoord: (h.volunteerCoord || '').trim() || 'Unassigned',
        foodCoord: (h.foodCoord || '').trim() || 'Unassigned',
        mediaCoord: (h.mediaCoord || '').trim() || 'Unassigned',
        judgeCoord: (h.judgeCoord || '').trim() || 'Unassigned',
      })),
      `Committee heads updated for ${h.name}.`
    );
    if (ok) setHeadsForm(null);
  };

  const openHeadsEditor = (fest) => {
    setError('');
    setNotice('');
    const val = (v) => (v && v !== 'Unassigned' ? v : '');
    setHeadsForm({
      id: fest.id,
      name: fest.name,
      volunteerCoord: val(fest.volunteerCoord),
      foodCoord: val(fest.foodCoord),
      mediaCoord: val(fest.mediaCoord),
      judgeCoord: val(fest.judgeCoord),
    });
  };

  const headLine = (label, value) => (
    <div>
      <span className="font-semibold text-[#0B3F46]">{label}:</span>{' '}
      {value && value !== 'Unassigned' ? value : <span className="italic text-amber-700">Unassigned</span>}
    </div>
  );

  const openPrograms = (fest) => {
    setProgramFestId(String(fest.id));
    setProgramForm(null);
    switchTab('programs');
  };

  // ---------- Programs ----------
  const handleSaveProgram = async (e) => {
    e.preventDefault();
    const p = programForm;
    const name = p.name.trim();
    if (name.length < 2) { setError('Enter a program name.'); return; }
    if (festPrograms.some((x) => !sameId(x.id, p.id) && x.name.trim().toLowerCase() === name.toLowerCase())) {
      setError('This fest already has a program with that name.');
      return;
    }
    let size = null;
    if (p.kind === 'group') {
      size = Number(p.maxGroupSize);
      if (!Number.isInteger(size) || size < 2 || size > 30) { setError('Group size must be a whole number from 2 to 30.'); return; }
    }
    const cat = p.category || 'cultural';
    const body = {
      name,
      category: cat,
      stage: usesStage(cat) ? p.stage : null,
      language: usesStage(cat) ? p.language : [],
      sportType: cat === 'sports' ? p.sportType : null,
      gender: cat === 'sports' ? p.gender : null,
      techType: cat === 'technical' ? p.techType : null,
      mode: cat === 'technical' ? p.mode : null,
      kind: p.kind,
      maxGroupSize: size,
    };
    const ok = await run(
      () => (p.id
        ? request(`/programs/${p.id}`, send('PATCH', body))
        : request('/programs', send('POST', { ...body, festId: selectedFest.id, assignments: {} }))),
      p.id ? 'Program updated.' : 'Program added.'
    );
    if (ok) setProgramForm(null);
  };

  const handleDeleteProgram = async (p) => {
    if (hasAssignments(p)) {
      setError('Teachers are already assigned to this program. Ask the coordinators to remove them first.');
      return;
    }
    if (!await confirmAction(`Delete "${p.name}"?`)) return;
    await run(() => request(`/programs/${p.id}`, { method: 'DELETE' }), 'Program deleted.');
  };

  const handlePublish = async () => {
    if (!await confirmAction('Publish the program list? Department coordinators will be able to see it and assign teachers. You can still add programs afterwards.')) return;
    await run(
      () => request(`/fests/${selectedFest.id}`, send('PATCH', { published: true, publishedAt: new Date().toISOString() })),
      'Program list published. Department coordinators can now assign teachers.'
    );
  };

  // ---------- Coordinators (appointed per fest) ----------
  const handleAssignCoordinator = async (e) => {
    e.preventDefault();
    const name = coordForm.teacherName.trim();
    const dept = coordForm.department.trim();

    if (!coordFest) {
      setError('Create a fest first, then appoint its coordinators.');
      return;
    }
    if (!name || !dept) {
      setError('Please provide both the teacher name and department.');
      return;
    }

    const existingCoord = users.find(
      (u) => hasDuty(u, 'dept_coordinator') && !u.rejected && norm(u.name) === norm(name) && norm(u.department) === norm(dept)
    );
    if (existingCoord) {
      const current = Array.isArray(existingCoord.festIds) ? existingCoord.festIds : [];
      if (current.some((id) => sameId(id, coordFest.id))) {
        setError(`${existingCoord.name} is already a coordinator for ${coordFest.name}.`);
        return;
      }
      const ok = await run(
        () => request(`/users/${existingCoord.id}`, send('PATCH', {
          role: 'dept_coordinator',
          duties: ['dept_coordinator'],
          festIds: [...current, coordFest.id],
        })),
        `${existingCoord.name} is now also a coordinator for ${coordFest.name}.`
      );
      if (ok) setCoordForm(EMPTY_COORD);
      return;
    }

    const teacher = users.find(
      (u) => isTeacher(u) && norm(u.name) === norm(name) && norm(u.department) === norm(dept)
    );
    if (teacher) {
      const ok = await run(
        () => request(`/users/${teacher.id}`, send('PATCH', {
          role: 'dept_coordinator',
          duties: ['dept_coordinator'],
          festIds: [coordFest.id],
        })),
        `${teacher.name} appointed as coordinator for ${dept} in ${coordFest.name}.`
      );
      if (ok) setCoordForm(EMPTY_COORD);
      return;
    }

    const ok = await run(
      () => request('/users', send('POST', {
        name,
        department: dept,
        baseType: 'teacher',
        role: 'dept_coordinator',
        duties: ['dept_coordinator'],
        festIds: [coordFest.id],
        approved: true,
        staffId: '',
        email: '',
        createdAt: new Date().toISOString(),
      })),
      `${name} added as coordinator for ${dept} in ${coordFest.name}. Staff ID and Gmail will appear after their account is registered and approved.`
    );
    if (ok) setCoordForm(EMPTY_COORD);
  };

  const handleRemoveCoordinator = async (u, scope = 'fest') => {
    const label = scope === 'fest' && coordFest
      ? `Remove ${u.name} as coordinator for ${coordFest.name}?`
      : `Remove ${u.name} as a coordinator?`;
    if (!await confirmAction(label)) return;

    const current = Array.isArray(u.festIds) ? u.festIds : [];
    const remaining = scope === 'fest' && coordFest ? current.filter((id) => !sameId(id, coordFest.id)) : [];

    if (remaining.length > 0) {
      await run(
        () => request(`/users/${u.id}`, send('PATCH', { festIds: remaining })),
        `${u.name} removed from ${coordFest.name}.`
      );
    } else if (!u.staffId && !u.email) {
      await run(() => request(`/users/${u.id}`, { method: 'DELETE' }), `${u.name} is no longer a coordinator.`);
    } else {
      await run(
        () => request(`/users/${u.id}`, send('PATCH', {
          festIds: [],
          duties: ['teacher'],
          role: 'teacher',
        })),
        `${u.name} is no longer a coordinator.`
      );
    }
  };

  const handleLinkCoordinator = async (u) => {
    if (!coordFest) return;
    const current = Array.isArray(u.festIds) ? u.festIds : [];
    await run(
      () => request(`/users/${u.id}`, send('PATCH', {
        role: 'dept_coordinator',
        duties: ['dept_coordinator'],
        festIds: [...current, coordFest.id],
      })),
      `${u.name} added to ${coordFest.name}.`
    );
  };

  // ---------- Approvals ----------
  const handleDecide = async (user, approve) => {
    if (!approve && !await confirmAction(`Reject the request from ${user.name}?`)) return;

    if (approve && (user.baseType === 'teacher' || hasDuty(user, 'dept_coordinator'))) {
      const existingCoord = users.find(
        (u) =>
          !sameId(u.id, user.id) &&
          hasDuty(u, 'dept_coordinator') &&
          (!u.staffId || !u.email) &&
          norm(u.name) === norm(user.name)
      );

      if (existingCoord) {
        await run(async () => {
          await request(`/users/${existingCoord.id}`, send('PATCH', {
            staffId: user.staffId,
            email: user.email,
            role: 'dept_coordinator',
            duties: ['dept_coordinator'],
            approved: true,
          }));
          await request(`/users/${user.id}`, { method: 'DELETE' });
        }, `${user.name} approved. Staff ID and Gmail updated in the coordinator list.`);
        return;
      }
    }

    await run(
      () => request(
        `/users/${user.id}/${approve ? 'approve' : 'reject'}`,
        send('PATCH', approve ? { approvedBy: 'Admin' } : { rejectedBy: 'Admin' })
      ),
      approve ? `${user.name} approved.` : `${user.name} rejected.`
    );
  };

  // ---------- Staff list ----------
  const parsedStaff = parseStaffList(staffText);
  const teacherByStaffId = new Map();
  users
    .filter((u) => u.baseType === 'teacher' && u.staffId && !u.rejected)
    .forEach((u) => teacherByStaffId.set(norm(u.staffId), u));

  const handleStaffFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setStaffText(await file.text());
      setError('');
    } catch {
      setError('Could not read that file. Save it as CSV and try again.');
    }
    e.target.value = '';
  };

  const handleSaveStaff = async (mode) => {
    if (parsedStaff.rows.length === 0) {
      setError('No Staff IDs found. Upload a CSV or paste rows with Staff ID, Name and Department.');
      setNotice('');
      return;
    }
    const have = new Set(staffLists.map((c) => norm(c.staffId)));
    const toAdd = parsedStaff.rows.filter((r) => mode === 'replace' || !have.has(norm(r.staffId)));
    if (mode === 'replace' && !await confirmAction(`Replace the whole staff list with ${toAdd.length} teachers?`)) return;

    const now = new Date().toISOString();
    const ok = await run(async () => {
      if (mode === 'replace') {
        await inChunks(staffLists, (c) => request(`/staffLists/${c.id}`, { method: 'DELETE' }));
      }
      await inChunks(toAdd, (r) =>
        request('/staffLists', send('POST', {
          staffId: r.staffId,
          name: r.name,
          department: r.department,
          uploadedAt: now,
          uploadedBy: 'Admin',
        }))
      );
    }, `${toAdd.length} teachers saved to the staff list.`);
    if (ok) setStaffText('');
  };

  const handleRemoveStaff = async (c) => {
    await run(() => request(`/staffLists/${c.id}`, { method: 'DELETE' }), `${c.staffId} removed from the staff list.`);
  };

  const titles = {
    fests: 'Manage Fests & Committees',
    programs: 'Programs',
    coordinators: 'Manage Coordinators',
    staff: 'Staff List',
    approvals: 'Pending Approvals',
    submissions: 'Submitted Department Lists',
    overview: 'Funds, Participation & Leaderboards',
  };

  const subtitles = {
    fests: 'Set up the fest, its dates and venue, and the committee heads.',
    programs: 'List the programs for each fest, then publish the list so coordinators can assign teachers.',
    coordinators: 'Appoint coordinators for each fest. The same person can coordinate more than one fest.',
    staff: 'Upload the institution\'s staff list so teachers with a matching Staff ID and name are approved automatically.',
    approvals: 'Review teacher registrations. Students are approved by their class list or class teacher.',
    submissions: 'Review participant lists forwarded by department coordinators.',
    overview: 'Live fund collections, program participation, and leaderboard standings from the database.',
  };

  const setF = (key) => (e) => setFestForm((f) => ({ ...f, [key]: e.target.value }));
  const setP = (key) => (e) => setProgramForm((p) => ({ ...p, [key]: e.target.value }));

  const renderProgramGroup = (title, category) => {
    const items = festPrograms.filter((p) => categoryOf(p) === category);
    return (
      <section key={category} className={`${cardStyle} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h3 className="fest-display font-bold text-[#0B3F46]">
            {title} <span className="ml-1 text-sm font-medium text-slate-500">({items.length})</span>
          </h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {items.map((p) => {
            const count = Object.values(p.assignments || {}).reduce((n, list) => n + list.length, 0);
            return (
              <li key={p.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <p className="font-semibold text-[#0B3F46]">{p.name}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {programDetails(p).join(' · ')}
                    {count > 0 && ` · ${count} teacher${count === 1 ? '' : 's'} assigned`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setError('');
                      setProgramForm({
                        ...EMPTY_PROGRAM,
                        ...p,
                        category: categoryOf(p),
                        stage: p.stage || 'onstage',
                        maxGroupSize: p.maxGroupSize || '',
                        language: Array.isArray(p.language)
                          ? p.language
                          : (p.language && p.language !== 'Not applicable' ? [p.language] : []),
                        sportType: p.sportType || 'Track',
                        gender: p.gender || 'Open',
                        techType: p.techType || 'Coding',
                        mode: p.mode || 'Offline',
                      });
                    }}
                    aria-label={`Edit ${p.name}`}
                    className={ghostButton}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDeleteProgram(p)}
                    aria-label={`Delete ${p.name}`}
                    className={ghostButton}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelect={switchTab}
      badges={{ approvals: pendingUsers.length, submissions: submissionCount }}
    >
      <header className="relative mb-8 overflow-hidden rounded-2xl bg-[#0B3F46] text-white shadow-sm">
        <Photo
          src="/banner.png"
          alt=""
          eager
          className="absolute inset-0 h-full w-full"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0B3F46] via-[#0B3F46]/80 to-[#0B3F46]/20" />

        <div className="relative z-10 flex flex-col justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5A623]">
              <span className="h-2 w-2 rounded-full bg-[#F5A623]" />
              CampusFest Administration
            </div>
            <h1 className="fest-display text-2xl font-extrabold tracking-tight sm:text-3xl">{titles[activeTab]}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">{subtitles[activeTab]}</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-[#F5A623]/40"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {notice && (
        <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>
      )}
      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {fests === null && !error && <p className="mb-6 text-sm text-slate-600">Loading...</p>}

      {activeTab === 'fests' && fests && (
        <div className="space-y-8">
          <section className={`${cardStyle} p-6 sm:p-8`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]"><Plus className="h-5 w-5" /></div>
              <div>
                <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Create a New Fest</h2>
                <p className="mt-1 text-xs text-slate-500">You will add its programs on the Programs tab.</p>
              </div>
            </div>

            <form onSubmit={handleCreateFest} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field id="festName" label="Fest name">
                <input id="festName" type="text" placeholder="e.g. Annual Arts Fest 2026" value={festForm.name} onChange={setF('name')} className={inputStyle} />
              </Field>
              <Field id="festMode" label="School or college">
                <select id="festMode" value={festForm.mode} onChange={setF('mode')} className={inputStyle}>
                  <option value="College">College</option>
                  <option value="School">School</option>
                </select>
              </Field>
              <Field id="festDeadline" label="Data entry closes">
                <input id="festDeadline" type="date" value={festForm.deadline} onChange={setF('deadline')} className={inputStyle} />
              </Field>
              <Field id="festDate" label="Fest date">
                <input id="festDate" type="date" value={festForm.festDate} onChange={setF('festDate')} className={inputStyle} />
              </Field>
              <Field id="festVenue" label="Venue">
                <input id="festVenue" type="text" placeholder="e.g. Main Auditorium" value={festForm.venue} onChange={setF('venue')} className={inputStyle} />
              </Field>
              <Field id="volHead" label="Volunteer committee head">
                <input id="volHead" type="text" placeholder="e.g. Dr. Rajesh Kumar" value={festForm.volunteerCoord} onChange={setF('volunteerCoord')} className={inputStyle} />
              </Field>
              <Field id="foodHead" label="Food committee head">
                <input id="foodHead" type="text" placeholder="e.g. Prof. Priya Nair" value={festForm.foodCoord} onChange={setF('foodCoord')} className={inputStyle} />
              </Field>
              <Field id="mediaHead" label="Media and publicity head">
                <input id="mediaHead" type="text" placeholder="e.g. Dr. Arun Das" value={festForm.mediaCoord} onChange={setF('mediaCoord')} className={inputStyle} />
              </Field>
              <Field id="judgeHead" label="Judge committee head">
                <input id="judgeHead" type="text" placeholder="e.g. Dr. Kavitha Menon" value={festForm.judgeCoord} onChange={setF('judgeCoord')} className={inputStyle} />
              </Field>

              <div className="pt-2 sm:col-span-2 xl:col-span-3">
                <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
                  <Plus className="h-4 w-4 text-[#F5A623]" />
                  {busy ? 'Saving...' : 'Create Fest'}
                </button>
              </div>
            </form>
          </section>

          {headsForm && (
            <form onSubmit={handleSaveHeads} noValidate className={`${cardStyle} space-y-4 p-6 sm:p-8`}>
              <div>
                <h3 className="fest-display text-lg font-bold text-[#0B3F46]">Committee heads for {headsForm.name}</h3>
                <p className="mt-1 text-xs text-slate-500">Leave a box empty to keep that committee Unassigned.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field id="editVol" label="Volunteer committee head">
                  <input id="editVol" autoFocus type="text" placeholder="e.g. Dr. Rajesh Kumar" value={headsForm.volunteerCoord} onChange={(e) => setHeadsForm((h) => ({ ...h, volunteerCoord: e.target.value }))} className={inputStyle} />
                </Field>
                <Field id="editFood" label="Food committee head">
                  <input id="editFood" type="text" placeholder="e.g. Prof. Priya Nair" value={headsForm.foodCoord} onChange={(e) => setHeadsForm((h) => ({ ...h, foodCoord: e.target.value }))} className={inputStyle} />
                </Field>
                <Field id="editMedia" label="Media and publicity head">
                  <input id="editMedia" type="text" placeholder="e.g. Dr. Arun Das" value={headsForm.mediaCoord} onChange={(e) => setHeadsForm((h) => ({ ...h, mediaCoord: e.target.value }))} className={inputStyle} />
                </Field>
                <Field id="editJudge" label="Judge committee head">
                  <input id="editJudge" type="text" placeholder="e.g. Dr. Kavitha Menon" value={headsForm.judgeCoord || ''} onChange={(e) => setHeadsForm((h) => ({ ...h, judgeCoord: e.target.value }))} className={inputStyle} />
                </Field>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Saving...' : 'Save heads'}</button>
                <button type="button" disabled={busy} onClick={() => setHeadsForm(null)} className={`${ghostButton} px-5 py-3 text-sm`}>Cancel</button>
              </div>
            </form>
          )}

          <section className={`${cardStyle} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h3 className="fest-display font-bold text-[#0B3F46]">Fests and Committees</h3>
                <p className="mt-1 text-xs text-slate-500">Configured fests and their committee heads.</p>
              </div>
              <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
                {fests.length} {fests.length === 1 ? 'Fest' : 'Fests'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                    <th scope="col" className="p-4">Fest Name</th>
                    <th scope="col" className="p-4">Type</th>
                    <th scope="col" className="p-4">Entry Deadline / Fest Date</th>
                    <th scope="col" className="p-4">Venue</th>
                    <th scope="col" className="p-4">Committee Heads</th>
                    <th scope="col" className="p-4">Programs</th>
                    <th scope="col" className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {fests.map((fest) => (
                    <tr key={fest.id} className="transition hover:bg-[#F5F8F8]">
                      <td className="p-4">
                        <div className="font-semibold text-[#0B3F46]">{fest.name}</div>
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${fest.published ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FDEFD3] text-[#5C3B00]'}`}>
                          {fest.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fest.mode === 'College' ? 'bg-[#E6F1F2] text-[#0B3F46]' : 'bg-[#FCE7EF] text-[#D6336C]'}`}>
                          {fest.mode}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-4 text-xs text-slate-600">
                        <div>Due: <span className="font-medium">{fmtDate(fest.deadline)}</span></div>
                        <div className="text-slate-500">Fest: <span>{fmtDate(fest.festDate)}</span></div>
                      </td>
                      <td className="p-4 text-xs text-slate-600">{fest.venue}</td>
                      <td className="p-4 text-xs text-slate-600">
                        {headLine('Volunteer', fest.volunteerCoord)}
                        {headLine('Food', fest.foodCoord)}
                        {headLine('Media', fest.mediaCoord)}
                        {headLine('Judge', fest.judgeCoord)}
                      </td>
                      <td className="p-4 text-sm font-semibold text-[#0B3F46]">{programsOf(fest.id).length}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openHeadsEditor(fest)}
                            aria-label={`Edit committee heads for ${fest.name}`}
                            className={ghostButton}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Heads
                          </button>
                          <button type="button" onClick={() => openPrograms(fest)} className={ghostButton}>
                            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" /> Programs
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDeleteFest(fest)}
                            aria-label={`Delete ${fest.name}`}
                            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fests.length === 0 && (
                    <tr><td colSpan="7" className="p-10 text-center text-xs text-slate-500">No fests yet. Create the first one above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'programs' && fests && (
        <div className="space-y-6">
          {fests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
              <p className="font-semibold text-slate-900">Create a fest first.</p>
              <p className="mt-1 text-sm text-slate-600">Programs are listed inside a fest.</p>
            </div>
          ) : (
            selectedFest && (
              <>
                <section className={`${cardStyle} p-6`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="w-full max-w-sm">
                      <Field id="programFest" label="Fest">
                        <select
                          id="programFest"
                          value={programFestId}
                          onChange={(e) => { setProgramFestId(e.target.value); setProgramForm(null); setError(''); setNotice(''); }}
                          className={inputStyle}
                        >
                          {fests.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedFest.published ? 'bg-emerald-50 text-emerald-800' : 'bg-[#FDEFD3] text-[#5C3B00]'}`}>
                        {selectedFest.published ? 'Published' : 'Draft'}
                      </span>
                      {!programForm && (
                        <button type="button" disabled={busy} onClick={() => { setError(''); setProgramForm(EMPTY_PROGRAM); }} className={primaryButton}>
                          <Plus className="h-4 w-4 text-[#F5A623]" /> Add program
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    {selectedFest.published ? (
                      <p className="text-sm text-slate-600">
                        The list is published, so coordinators can assign teachers. You can still add programs. A program with teachers assigned cannot be deleted.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">Coordinators cannot see this fest yet. Publish the list when your programs are ready.</p>
                        <button type="button" onClick={handlePublish} disabled={busy || festPrograms.length === 0} className={primaryButton}>
                          <Send className="h-4 w-4 text-[#F5A623]" /> Publish program list
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {programForm && (() => {
                  const cat = programForm.category || 'cultural';
                  return (
                    <form onSubmit={handleSaveProgram} noValidate className={`${cardStyle} space-y-4 p-6`}>
                      <h3 className="fest-display text-lg font-bold text-[#0B3F46]">{programForm.id ? 'Edit program' : 'Add a program'}</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="progName" label="Program name">
                          <input id="progName" autoFocus type="text" placeholder={cat === 'sports' ? 'e.g. 100m Running' : cat === 'technical' ? 'e.g. Code Sprint' : 'e.g. English Recitation'} value={programForm.name} onChange={setP('name')} className={inputStyle} />
                        </Field>

                        <Field id="progCategory" label="Category" hint="The fields below change with the category.">
                          <select id="progCategory" value={cat} onChange={setP('category')} className={inputStyle}>
                            {PROGRAM_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </Field>

                        {usesStage(cat) && (
                          <>
                            <Field id="progLanguage" label="Languages" hint="Select applicable languages (leave unchecked for items like dance or music).">
                              <div className="flex flex-wrap gap-3 pt-2">
                                {LANGUAGES.map((l) => (
                                  <label key={l} className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                      type="checkbox"
                                      value={l}
                                      checked={Array.isArray(programForm.language) && programForm.language.includes(l)}
                                      onChange={(e) => {
                                        const { checked, value } = e.target;
                                        setProgramForm((prev) => ({
                                          ...prev,
                                          language: checked
                                            ? [...(Array.isArray(prev.language) ? prev.language : []), value]
                                            : (Array.isArray(prev.language) ? prev.language : []).filter((item) => item !== value),
                                        }));
                                      }}
                                      className="rounded border-slate-300 text-[#0B3F46] focus:ring-[#0B3F46]"
                                    />
                                    {l}
                                  </label>
                                ))}
                              </div>
                            </Field>
                            <Field id="progStage" label="Where it is held">
                              <select id="progStage" value={programForm.stage} onChange={setP('stage')} className={inputStyle}>
                                <option value="onstage">On stage</option>
                                <option value="offstage">Off stage</option>
                              </select>
                            </Field>
                          </>
                        )}

                        {cat === 'sports' && (
                          <>
                            <Field id="progSport" label="Sport type">
                              <select id="progSport" value={programForm.sportType} onChange={setP('sportType')} className={inputStyle}>
                                {SPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </Field>
                            <Field id="progGender" label="Open to">
                              <select id="progGender" value={programForm.gender} onChange={setP('gender')} className={inputStyle}>
                                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </Field>
                          </>
                        )}

                        {cat === 'technical' && (
                          <>
                            <Field id="progTech" label="Event type">
                              <select id="progTech" value={programForm.techType} onChange={setP('techType')} className={inputStyle}>
                                {TECH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </Field>
                            <Field id="progMode" label="Mode">
                              <select id="progMode" value={programForm.mode} onChange={setP('mode')} className={inputStyle}>
                                {TECH_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </Field>
                          </>
                        )}

                        <Field id="progKind" label="Who takes part">
                          <select id="progKind" value={programForm.kind} onChange={setP('kind')} className={inputStyle}>
                            <option value="individual">Individual</option>
                            <option value="group">{teamWord(cat)}</option>
                          </select>
                        </Field>
                        {programForm.kind === 'group' && (
                          <Field id="progSize" label={`Largest ${teamWord(cat).toLowerCase()} size`} hint="Between 2 and 30 students.">
                            <input id="progSize" type="number" min="2" max="30" value={programForm.maxGroupSize} onChange={setP('maxGroupSize')} className={inputStyle} />
                          </Field>
                        )}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Saving...' : 'Save program'}</button>
                        <button type="button" disabled={busy} onClick={() => setProgramForm(null)} className={`${ghostButton} px-5 py-3 text-sm`}>Cancel</button>
                      </div>
                    </form>
                  );
                })()}

                {festPrograms.length === 0 && !programForm ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
                    <p className="font-semibold text-slate-900">No programs yet.</p>
                    <p className="mt-1 text-sm text-slate-600">Add the first program to build the list.</p>
                  </div>
                ) : (
                  <>
                    {PROGRAM_CATEGORIES.filter((c) => festPrograms.some((p) => categoryOf(p) === c.id)).map((c) =>
                      renderProgramGroup(c.label, c.id)
                    )}
                  </>
                )}
              </>
            )
          )}
        </div>
      )}

      {activeTab === 'coordinators' && fests && (
        <div className="space-y-8">
          {fests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8">
              <p className="font-semibold text-slate-900">Create a fest first.</p>
              <p className="mt-1 text-sm text-slate-600">Coordinators are appointed for a specific fest.</p>
            </div>
          ) : (
            <>
              <section className={`${cardStyle} p-6 sm:p-8`}>
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-[#FCE7EF] p-3 text-[#D6336C]"><Users className="h-5 w-5" /></div>
                  <div>
                    <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Appoint Department Coordinator</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Choose the fest, then type the teacher's name and department. Staff ID and Gmail appear after their account is registered and approved.
                    </p>
                  </div>
                </div>

                <div className="mb-4 max-w-sm">
                  <Field id="coordFest" label="Fest">
                    <select id="coordFest" value={coordFestId} onChange={(e) => { setCoordFestId(e.target.value); setError(''); setNotice(''); }} className={inputStyle}>
                      {fests.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </Field>
                </div>

                <form onSubmit={handleAssignCoordinator} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <Field id="teacherName" label="Teacher Name">
                    <input
                      id="teacherName"
                      type="text"
                      placeholder="e.g. Dr Reshmi"
                      value={coordForm.teacherName}
                      onChange={(e) => setCoordForm((prev) => ({ ...prev, teacherName: e.target.value }))}
                      className={inputStyle}
                    />
                  </Field>
                  <Field id="department" label="Department / Section">
                    <input
                      id="department"
                      type="text"
                      placeholder="e.g. AIML"
                      value={coordForm.department}
                      onChange={(e) => setCoordForm((prev) => ({ ...prev, department: e.target.value }))}
                      className={inputStyle}
                    />
                  </Field>
                  <button type="submit" disabled={busy} className={primaryButton}>
                    <Users className="h-4 w-4 text-[#F5A623]" />
                    {busy ? 'Saving...' : 'Add Coordinator'}
                  </button>
                </form>
              </section>

              <section className={`${cardStyle} overflow-hidden`}>
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <h3 className="fest-display font-bold text-[#0B3F46]">Coordinators of {coordFest ? coordFest.name : 'this fest'}</h3>
                  <p className="mt-1 text-xs text-slate-500">Each coordinator sees and manages only the fests they are appointed to.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                        <th scope="col" className="p-4">Name</th>
                        <th scope="col" className="p-4">Department / Section</th>
                        <th scope="col" className="p-4">Staff ID</th>
                        <th scope="col" className="p-4">Email</th>
                        <th scope="col" className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {festCoordinators.map((u) => (
                        <tr key={u.id} className="transition hover:bg-[#F5F8F8]">
                          <td className="p-4 font-semibold text-[#0B3F46]">{u.name}</td>
                          <td className="p-4 font-medium text-[#0E4D55]">{u.department}</td>
                          <td className="p-4 text-slate-600">{u.staffId || <span className="text-slate-400 italic">Pending registration</span>}</td>
                          <td className="p-4 text-slate-500">{u.email || <span className="text-slate-400 italic">Pending registration</span>}</td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRemoveCoordinator(u, 'fest')}
                              aria-label={`Remove ${u.name} from ${coordFest ? coordFest.name : 'this fest'}`}
                              className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {festCoordinators.length === 0 && (
                        <tr><td colSpan="5" className="p-10 text-center text-xs text-slate-500">No coordinators appointed for this fest yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {unlinkedCoordinators.length > 0 && (
                <section className={`${cardStyle} overflow-hidden`}>
                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <h3 className="fest-display font-bold text-[#0B3F46]">Coordinators not linked to a fest</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      These were appointed before fests were tracked. Until you link them, they can see every fest. Add them to {coordFest ? coordFest.name : 'the selected fest'} or remove them.
                    </p>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {unlinkedCoordinators.map((u) => (
                      <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                          <p className="font-semibold text-[#0B3F46]">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.department}{u.staffId ? ` · ${u.staffId}` : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" disabled={busy || !coordFest} onClick={() => handleLinkCoordinator(u)} className={ghostButton}>
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add to {coordFest ? coordFest.name : 'fest'}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveCoordinator(u, 'all')}
                            aria-label={`Remove ${u.name} as coordinator`}
                            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'staff' && fests && (
        <div className="space-y-8">
          <section className={`${cardStyle} p-6 sm:p-8`}>
            <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Upload the staff list</h2>
            <p className="mt-1 text-xs text-slate-500">
              A teacher whose Staff ID and name both match this list is approved automatically when they register. Anyone else waits for you in Pending Approvals. Duplicate Staff IDs are blocked.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="staffFile" className="mb-1.5 block text-xs font-semibold text-slate-600">
                  CSV file (Staff ID, Name, Department)
                </label>
                <input
                  id="staffFile"
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  onChange={handleStaffFile}
                  className="block w-full max-w-sm text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#E6F1F2] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#0B3F46]"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  From Excel: File, Save As, CSV. Or copy the columns in Excel and paste them below. The department column is optional; when it is given, it is used as the teacher's department.
                </p>
              </div>

              <div>
                <label htmlFor="staffText" className="mb-1.5 block text-xs font-semibold text-slate-600">Or paste the list here</label>
                <textarea
                  id="staffText"
                  rows={6}
                  value={staffText}
                  onChange={(e) => setStaffText(e.target.value)}
                  placeholder={'Staff ID, Name, Department\nT010, Priya Menon, CSE\nT055, Jeeva K, ECE'}
                  className={`${inputStyle} font-mono`}
                />
              </div>

              <p className="text-xs text-slate-600">
                {parsedStaff.rows.length > 0
                  ? `${parsedStaff.rows.length} teachers found${parsedStaff.duplicates > 0 ? `, ${parsedStaff.duplicates} repeated Staff IDs ignored` : ''}.`
                  : 'Nothing to save yet.'}
              </p>

              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={busy || parsedStaff.rows.length === 0} onClick={() => handleSaveStaff('add')} className={primaryButton}>
                  <Plus className="h-4 w-4 text-[#F5A623]" /> Add to list
                </button>
                <button
                  type="button"
                  disabled={busy || parsedStaff.rows.length === 0}
                  onClick={() => handleSaveStaff('replace')}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0B3F46] hover:bg-slate-50 disabled:opacity-50"
                >
                  Replace whole list
                </button>
              </div>
            </div>
          </section>

          <section className={`${cardStyle} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h3 className="fest-display font-bold text-[#0B3F46]">Staff on the list</h3>
                <p className="mt-1 text-xs text-slate-500">Teachers on this list are approved automatically when they register.</p>
              </div>
              <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">{staffLists.length} teachers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                    <th scope="col" className="p-4">Staff ID</th>
                    <th scope="col" className="p-4">Name</th>
                    <th scope="col" className="p-4">Department</th>
                    <th scope="col" className="p-4">Account</th>
                    <th scope="col" className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffLists.map((c) => {
                    const acct = teacherByStaffId.get(norm(c.staffId));
                    return (
                      <tr key={c.id} className="hover:bg-[#F5F8F8]">
                        <td className="p-4 font-mono text-xs text-[#0B3F46]">{c.staffId}</td>
                        <td className="p-4 text-slate-700">{c.name || '—'}</td>
                        <td className="p-4 text-slate-600">{c.department || '—'}</td>
                        <td className="p-4">
                          {!acct ? (
                            <span className="text-xs italic text-slate-400">Not registered yet</span>
                          ) : acct.approved === false ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Waiting for approval</span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Registered</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveStaff(c)}
                            aria-label={`Remove ${c.staffId} from the staff list`}
                            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {staffLists.length === 0 && (
                    <tr><td colSpan="5" className="p-10 text-center text-xs text-slate-500">No staff list uploaded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'approvals' && fests && (
        <section className={`${cardStyle} p-6 sm:p-8`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]"><UserCheck className="h-5 w-5" /></div>
            <div>
              <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Pending Teacher Registrations</h2>
              <p className="mt-1 text-xs text-slate-500">Approve or reject teachers before they can sign in. Students are handled by class lists and class teachers.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                  <th scope="col" className="p-3">Name & Email</th>
                  <th scope="col" className="p-3">ID</th>
                  <th scope="col" className="p-3">Department / Class</th>
                  <th scope="col" className="p-3">Requested Role</th>
                  <th scope="col" className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePending.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-semibold text-[#0B3F46]">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-3 text-xs">
                      <div>{user.staffId || user.registerNo || user.studentId || user.admissionNo || '—'}</div>
                      {(() => {
                        const onList = staffLists.find((c) => norm(c.staffId) === norm(user.staffId));
                        return onList ? (
                          <div className="mt-0.5 text-[11px] text-amber-700">List has this ID as “{onList.name || 'no name'}”</div>
                        ) : (
                          <div className="mt-0.5 text-[11px] italic text-slate-400">Not on the staff list</div>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-xs font-medium text-[#0E4D55]">
                      {user.department || '—'}{user.className ? ` · ${user.className}` : ''}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{roleLabelOf(user)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDecide(user, true)}
                          className="rounded-xl bg-[#0B3F46] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0E4D55] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button type="button" disabled={busy} onClick={() => handleDecide(user, false)} className={ghostButton}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visiblePending.length === 0 && (
                  <tr><td colSpan="5" className="p-10 text-center text-xs text-slate-500">No pending teacher registrations. All clear!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'submissions' && fests && (
        <SubmissionsFestCards
          registrations={forwardedRegs}
          onRefresh={() => loadAll().catch((e) => setError(e.message))}
        />
      )}

      {activeTab === 'overview' && fests && (
        <div className="space-y-8">
          {fests.length > 0 && (
            <section className={`${cardStyle} flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:px-6`}>
              <div className="w-full max-w-sm">
                <Field id="overviewFest" label="Fest">
                  <select
                    id="overviewFest"
                    value={overviewFest ? overviewFest.id : ''}
                    onChange={(e) => setOverviewFestId(e.target.value)}
                    className={inputStyle}
                  >
                    {fests.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </Field>
              </div>
              {overviewFest && (
                <p className="text-xs text-slate-500">
                  Mode: <span className="font-semibold text-[#0B3F46]">{overviewFest.mode}</span> · Total collected: <span className="font-semibold text-[#0B3F46]">{fmtCurrency(totalDeptCollected)}</span>
                </p>
              )}
            </section>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className={`${cardStyle} p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]"><Calendar className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-slate-500">Fests</span>
              </div>
              <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">{fests.length}</p>
              <p className="mt-1 text-sm text-slate-500">{programs.length} programs listed in total</p>
            </div>

            <div className={`${cardStyle} p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]"><Users className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-slate-500">Coordinators</span>
              </div>
              <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">{coordinatorUsers.length}</p>
              <p className="mt-1 text-sm text-slate-500">Department and section coordinators</p>
            </div>

            <div className={`${cardStyle} p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-[#FCE7EF] p-3 text-[#D6336C]"><Award className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-slate-500">Minimum rule</span>
              </div>
              <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">{participationSummary.minRequired}</p>
              <p className="mt-1 text-sm text-slate-500">
                {participationSummary.isSchool ? 'Participants (school)' : 'Departments (college)'}
              </p>
            </div>
          </div>

          <section className={`${cardStyle} p-6 sm:p-8`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]"><ShieldAlert className="h-5 w-5" /></div>
              <div>
                <h2 className="fest-display text-lg font-bold text-[#0B3F46]">Program Participation and Cancellation Monitor</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Live participation from registrations. A school program needs at least {participationSummary.minRequired} participants; a college program needs at least {participationSummary.minRequired} departments.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0B3F46]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Going ahead ({participationSummary.goingAhead.length})
                </h4>
                {participationSummary.goingAhead.length === 0 ? (
                  <p className="text-xs text-slate-500">No programs have reached the minimum threshold yet.</p>
                ) : (
                  <ul className="space-y-3 text-xs text-slate-600">
                    {participationSummary.goingAhead.map((item) => (
                      <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-1 flex justify-between font-semibold text-[#0B3F46]">
                          <span>{item.name}</span>
                          <span className="text-emerald-700">
                            {item.deptCount} {item.deptCount === 1 ? 'dept' : 'depts'} / {item.participantCount} {item.participantCount === 1 ? 'student' : 'students'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{item.deptsText}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-700">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Below minimum ({participationSummary.cancelled.length})
                </h4>
                {participationSummary.cancelled.length === 0 ? (
                  <p className="text-xs text-slate-500">All programs meet the minimum requirement.</p>
                ) : (
                  <ul className="space-y-2 text-xs text-slate-600">
                    {participationSummary.cancelled.map((item) => (
                      <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-slate-800">{item.name}</span>
                          <span className="font-semibold text-rose-700">
                            {item.isSchool
                              ? `${item.participantCount} ${item.participantCount === 1 ? 'participant' : 'participants'}`
                              : `${item.deptCount} ${item.deptCount === 1 ? 'department' : 'departments'}`}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Entries: {item.joinedText}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className={`${cardStyle} p-6`}>
              <h3 className="fest-display mb-1 flex items-center gap-2 font-bold text-[#0B3F46]">
                <DollarSign className="h-5 w-5 text-[#B87908]" /> Department-wise Fund Collection
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Fee status, student payment counts, and remitted amounts per department.
              </p>
              <div className="space-y-3 text-xs">
                {deptFundRows.length === 0 ? (
                  <p className="text-slate-500">No department fund or payment records yet.</p>
                ) : (
                  deptFundRows.map((d) => {
                    const isCleared = d.totalStudents > 0 && d.paidCount >= d.totalStudents;
                    const statusLabel = isCleared ? 'All Paid' : d.paidCount > 0 ? 'In Progress' : 'Pending';
                    const statusClass = isCleared
                      ? 'bg-emerald-50 text-emerald-700'
                      : d.paidCount > 0
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-600';

                    return (
                      <div key={d.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{d.name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {d.paidCount} / {d.totalStudents} students paid · Remitted: {fmtCurrency(d.remitted)}
                            {d.target > 0 ? ` · Fund/Student: ${fmtCurrency(d.target)}` : ''}
                          </p>
                        </div>
                        <span className="font-bold text-[#0B3F46]">{fmtCurrency(d.collected)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className={`${cardStyle} p-6`}>
              <h3 className="fest-display mb-1 flex items-center gap-2 font-bold text-[#0B3F46]">
                <Trophy className="h-5 w-5 text-[#F5A623]" /> Leaderboard and Results
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                From the marks judges have submitted. 1st = {RANK_POINTS['1st Place']}, 2nd = {RANK_POINTS['2nd Place']}, 3rd = {RANK_POINTS['3rd Place']} points.
              </p>
              <div className="space-y-3 text-xs">
                {deptTotals.length === 0 ? (
                  <p className="text-slate-500">No judge results yet. They appear here when a judge submits a program.</p>
                ) : (
                  deptTotals.map((d, i) => (
                    <div
                      key={d.name}
                      className={`flex items-center justify-between rounded-xl border p-3 ${i === 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}
                    >
                      <span className={`font-semibold ${i === 0 ? 'text-amber-900' : 'text-slate-700'}`}>{i + 1}. {d.name}</span>
                      <span className="font-bold text-[#0B3F46]">{d.points} points</span>
                    </div>
                  ))
                )}
              </div>
              <Link to="/admin/results" className="mt-4 inline-block text-xs font-bold text-[#0B3F46] hover:underline">
                See every mark
              </Link>
            </section>
          </div>
        </div>
      )}

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CampusFest. Fest management for schools and colleges.
      </footer>
    </AdminLayout>
  );
}