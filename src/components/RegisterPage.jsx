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

    const { name, email, department, sectionId, identifier, role, password } = formData;
    const section = sections.find((s) => String(s.id) === String(sectionId));

    if (!name.trim() || !email.trim() || !identifier.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (isStudentRole && !section) {
      setError('Please choose your class. If none are listed, ask your department coordinator to add it.');
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

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department: isStudentRole ? section.department : department.trim(),
          ...(isStudentRole ? { classSection: section.name } : {}),
          baseType,
          role: dbRole,
          duties,
          ...extraFields,
          approved: false, // every role waits for approval
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
          notice: 'Registration submitted successfully. Please wait for approval before signing in.',
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