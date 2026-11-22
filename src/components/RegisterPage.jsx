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
  Trophy,
} from 'lucide-react';
import { API_BASE, registerUser } from '../services/api';
import Photo from '../components/Photo';

const inputStyle =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';

const REGISTER_PHOTO = { src: '/loginn.png', alt: '' };

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    sectionId: '',
    identifier: '',
    role: 'Teacher',
    password: '',
    dob: '',
  });

  const [sections, setSections] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  const isStudent = formData.role === 'Student';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, department, sectionId, identifier, role, password, dob } = formData;
    const section = sections.find((s) => String(s.id) === String(sectionId));

    if (!name.trim() || !email.trim() || !identifier.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (isStudent && !section) {
      setError('Please choose your class. If none are listed, ask your department coordinator to add it.');
      return;
    }
    if (isStudent && !dob) {
      setError('Please enter your date of birth. It is checked against your class list.');
      return;
    }
    if (!isStudent && !department.trim()) {
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
      const baseType = isStudent ? 'student' : 'teacher';
      const dbRole =
        role === 'Student' ? 'student' : role === 'Volunteer' ? 'volunteer' : 'teacher';
      const duties = [dbRole];

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department: isStudent ? section.department : department.trim(),
        ...(isStudent ? { classSection: section.name } : {}),
        ...(isStudent
          ? { registerNo: identifier.trim(), dob }
          : { staffId: identifier.trim() }),
        role: dbRole,
        baseType,
        duties,
        password,
      };

      const data = await registerUser(payload);

      navigate('/login', {
        state: {
          notice:
            data.message ||
            (data.approved
              ? 'Registration successful. You can sign in now.'
              : 'Registration submitted. Please wait for approval before signing in.'),
        },
      });
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F8] font-['DM_Sans',sans-serif] lg:grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative h-48 overflow-hidden bg-[#0B3F46] text-white lg:sticky lg:top-0 lg:h-screen">
        <Photo
          src={REGISTER_PHOTO.src}
          alt={REGISTER_PHOTO.alt}
          eager
          className="absolute inset-0 h-full w-full"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0B3F46] via-[#0B3F46]/60 to-[#0B3F46]/20"
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-6 lg:p-12">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-6 w-6" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">CampusFest</span>
          </div>
          <p className="hidden text-4xl font-extrabold leading-[1.05] lg:block">
            Join your fest team.
          </p>
        </div>
      </aside>

      <div className="flex items-center justify-center p-4 lg:p-10">
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
                <input type="text" name="name" autoComplete="name" placeholder="Enter full name" value={formData.name} onChange={handleChange} className={`${inputStyle} pl-10`} required />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input type="email" name="email" autoComplete="email" placeholder="user@gmail.com" value={formData.email} onChange={handleChange} className={`${inputStyle} pl-10`} required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isStudent ? (
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
                  {isStudent ? 'Register Number' : 'Staff ID'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Award className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="identifier"
                    autoComplete="off"
                    placeholder={isStudent ? 'e.g. REG202601' : 'e.g. T012'}
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
                Volunteer registrations are approved by the admin (or automatically if your Staff ID is on the staff list).
              </p>
            )}

            {isStudent && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Date of Birth
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
                  autoComplete="new-password"
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
    </div>
  );
}