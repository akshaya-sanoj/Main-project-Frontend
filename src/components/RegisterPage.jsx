import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Building,
  BookOpen,
  Eye,
  EyeOff,
  Award,
  GraduationCap,
} from 'lucide-react';
import { API_BASE } from '../services/api';

const inputStyle =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';

// Compare register numbers while ignoring case, spaces and symbols
const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Dates of birth are never stored as plain text. The class list keeps only this fingerprint
// (a SHA-256 of register number + date). Register.jsx and CoordinatorDashboard.jsx must use the same code.
const hashDob = async (regNo, dobIso) => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('The date of birth check needs a secure page (https or localhost).');
  }
  const data = new TextEncoder().encode(`${String(regNo || '').toLowerCase().replace(/[^a-z0-9]/g, '')}|${dobIso}`);
  const buf = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Names match when every word of the shorter name is in the longer one, ignoring titles:
// "Dr. Reshmi" matches "Reshmi K".
const TITLES = new Set(['dr', 'prof', 'mr', 'mrs', 'ms', 'smt', 'sri', 'shri', 'mx']);
const nameTokens = (v) => String(v || '').toLowerCase().split(/[^a-z]+/).filter((t) => t && !TITLES.has(t));
const namesMatch = (a, b) => {
  const x = nameTokens(a);
  const y = nameTokens(b);
  if (!x.length || !y.length) return false;
  const [small, big] = x.length <= y.length ? [x, y] : [y, x];
  return small.every((t) => big.includes(t));
};

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '', // teachers type this; students get it from the class they pick
    sectionId: '', // students and volunteers pick a class section
    identifier: '', // Staff ID for teachers, Register No for students/volunteers
    role: 'Teacher',
    password: '',
    dob: '', // students: date of birth, checked against the class list
  });

  const [sections, setSections] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Class sections are created by each department coordinator
  useEffect(() => {
    fetch(`${API_BASE}/sections`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isStudentRole = formData.role === 'Student' || formData.role === 'Volunteer';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, department, sectionId, identifier, role, password, dob } = formData;
    const section = sections.find((s) => String(s.id) === String(sectionId));

    if (!name.trim() || !email.trim() || !identifier.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (isStudentRole && !section) {
      setError('Please choose your class. If none are listed, ask your department coordinator to add it.');
      return;
    }
    if (role === 'Student' && !dob) {
      setError('Please enter your date of birth. It is checked against your class list.');
      return;
    }
    if (!isStudentRole && !department.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      let baseType = 'teacher';
      let dbRole = 'teacher';
      let duties = ['teacher'];
      let extraFields = { staffId: identifier.trim() };

      if (role === 'Student') {
        baseType = 'student';
        dbRole = 'student';
        duties = ['student'];
        extraFields = { registerNo: identifier.trim() };
      } else if (role === 'Volunteer') {
        baseType = 'student';
        dbRole = 'volunteer';
        duties = ['volunteer'];
        extraFields = { registerNo: identifier.trim() };
      }
      // Teachers: class teacher, coordinator and program duties are NOT chosen here.
      // The admin appoints coordinators; coordinators assign class and program duties.

      // Check duplicates, and approve automatically when the ID is on an uploaded list:
      // students on the class list (coordinator), teachers on the staff list (admin).
      const getList = (path) => fetch(`${API_BASE}${path}`).then((r) => (r.ok ? r.json() : []));
      const [classLists, staffLists, allUsers] = await Promise.all([
        getList('/classLists'),
        getList('/staffLists'),
        getList('/users'),
      ]);
      const existingUsers = Array.isArray(allUsers) ? allUsers : [];
      const mine = norm(identifier);
      const emailKey = email.trim().toLowerCase();

      if (existingUsers.some((u) => !u.rejected && String(u.email || '').trim().toLowerCase() === emailKey)) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      let autoApproved = false;
      let listCheck = null;
      let staffMatch = null;
      let mergeTarget = null;

      if (isStudentRole) {
        if (existingUsers.some((u) => u.baseType === 'student' && !u.rejected && norm(u.registerNo) === mine)) {
          throw new Error('An account with this register number already exists. Please sign in. If it is not yours, tell your class teacher so the wrong account can be removed.');
        }
        // Compare with the class list: register number, class, and date of birth
        const entry = (Array.isArray(classLists) ? classLists : []).find((c) => norm(c.registerNo) === mine) || null;
        if (!entry) {
          listCheck = 'not_on_list';
        } else if (entry.deptKey !== section.deptKey || entry.classSection !== section.name) {
          listCheck = 'other_class';
        } else if (entry.dobHash) {
          try {
            const h = dob ? await hashDob(identifier, dob) : null;
            listCheck = h && h === entry.dobHash ? 'matched' : 'dob_mismatch';
          } catch (err) {
            listCheck = 'unchecked';
          }
        } else {
          listCheck = 'matched_no_dob'; // the list has no date of birth for this student
        }

        // Only the Student role is auto-approved. Volunteers always wait for their class teacher.
        autoApproved = role === 'Student' && (listCheck === 'matched' || listCheck === 'matched_no_dob');
      } else {
        if (existingUsers.some((u) => u.baseType === 'teacher' && !u.rejected && u.staffId && norm(u.staffId) === mine)) {
          throw new Error('An account with this Staff ID already exists. Please sign in, or contact the admin.');
        }
        // Both the Staff ID and the name must match the staff list
        staffMatch =
          (Array.isArray(staffLists) ? staffLists : []).find(
            (c) => norm(c.staffId) === mine && namesMatch(c.name, name)
          ) || null;
        autoApproved = !!staffMatch;

        // If the admin already named this person as a coordinator, link the new account to that entry
        if (autoApproved) {
          mergeTarget =
            existingUsers.find(
              (u) =>
                ((u.duties || []).includes('dept_coordinator') || u.role === 'dept_coordinator') &&
                (!u.staffId || !u.email) &&
                namesMatch(u.name, name)
            ) || null;
        }
      }

      if (mergeTarget) {
        const mres = await fetch(`${API_BASE}/users/${mergeTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: identifier.trim(),
            email: email.trim(),
            password,
            approved: true,
            approvalMethod: 'staff_list',
            approvedAt: new Date().toISOString(),
          }),
        });
        if (!mres.ok) throw new Error('Failed to register. Please check if the server is running.');
        navigate('/login', {
          state: {
            notice: 'Registration successful. Your Staff ID is on the staff list and you are appointed as coordinator, so you can sign in now.',
          },
        });
        return;
      }

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department: isStudentRole ? section.department : (staffMatch?.department || department.trim()),
          ...(isStudentRole ? { classSection: section.name } : {}),
          baseType,
          role: dbRole,
          duties,
          ...extraFields,
          approved: autoApproved, // teachers wait for the admin; students are approved by the class list or their class teacher
          ...(isStudentRole ? { listCheck } : {}),
          approvalMethod: autoApproved ? (isStudentRole ? 'class_list' : 'staff_list') : 'pending',
          ...(autoApproved ? { approvedAt: new Date().toISOString() } : {}),
          rejected: false,
          password,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to register. Please check if the server is running.');
      }

      navigate('/login', {
        state: {
          notice: autoApproved
            ? isStudentRole
              ? 'Registration successful. Your register number is on your class list, so you can sign in now.'
              : 'Registration successful. Your Staff ID is on the staff list, so you can sign in now.'
            : isStudentRole
              ? 'Registration submitted. Your class teacher will approve it. Please sign in after that.'
              : 'Registration submitted successfully. Please wait for approval before signing in.',
        },
      });
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8F8] p-4 font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-[#0B3F46]">Portal Registration</h2>
          <p className="mt-1 text-xs text-slate-500">
            Sign up as a teacher, student or volunteer. Special duties are assigned after approval.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Role first, since it changes the form */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Role</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <BookOpen className="h-4 w-4" />
              </span>
              <select name="role" value={formData.role} onChange={handleChange} className={`${inputStyle} pl-10`}>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input type="text" name="name" placeholder="Enter full name" value={formData.name} onChange={handleChange} className={`${inputStyle} pl-10`} required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input type="email" name="email" placeholder="user@gmail.com" value={formData.email} onChange={handleChange} className={`${inputStyle} pl-10`} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isStudentRole ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Class / Section</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <select name="sectionId" value={formData.sectionId} onChange={handleChange} className={`${inputStyle} pl-10`}>
                    <option value="">Choose your class</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.department} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                {sections.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    No classes have been created yet. Ask your department coordinator to add them.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Department / Section</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Building className="h-4 w-4" />
                  </span>
                  <input type="text" name="department" placeholder="e.g. Computer Science" value={formData.department} onChange={handleChange} className={`${inputStyle} pl-10`} required />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {isStudentRole ? 'Register Number' : 'Staff ID'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Award className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  name="identifier"
                  placeholder={isStudentRole ? 'e.g. REG202601' : 'e.g. T012'}
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`${inputStyle} pl-10`}
                  required
                />
              </div>
            </div>
          </div>

          {formData.role === 'Student' && (
            <p className="rounded-xl bg-[#E6F1F2] px-4 py-3 text-xs text-[#0B3F46]">
              If your register number and date of birth match your class list, you are approved instantly. Otherwise your class teacher will approve you.
            </p>
          )}
          {formData.role === 'Teacher' && (
            <p className="rounded-xl bg-[#E6F1F2] px-4 py-3 text-xs text-[#0B3F46]">
              If your Staff ID and name are on the staff list, you are approved instantly. Otherwise the admin will approve you.
            </p>
          )}
          {formData.role === 'Volunteer' && (
            <p className="rounded-xl bg-[#E6F1F2] px-4 py-3 text-xs text-[#0B3F46]">
              Volunteer registrations are approved by your class teacher.
            </p>
          )}

          {isStudentRole && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Date of Birth{formData.role === 'Volunteer' ? ' (optional)' : ''}
              </label>
              <input
                type="date"
                name="dob"
                max={new Date().toISOString().slice(0, 10)}
                value={formData.dob}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                className={`${inputStyle} pl-10 pr-10`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#0B3F46] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0E4D55] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#0B3F46] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}