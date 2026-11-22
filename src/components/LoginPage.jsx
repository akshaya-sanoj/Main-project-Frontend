import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Trophy, AlertCircle } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser, API_BASE, authHeaders } from '../services/api';
import Photo from '../components/Photo';

const ROLE_ROUTES = {
  committee: '/admin',
  dept_coordinator: '/coordinator',
  teacher: '/teacher',
  student: '/student',
  volunteer: '/volunteer-dashboard',
  judge: '/judge',
};

const LOGIN_PHOTO = { src: '/loginn.png', alt: '' };
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function LoginPage() {
  const [query, setQuery] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const user = await loginUser({ query: query.trim(), password });

      if (user.rejected) {
        throw new Error('Your registration was rejected. Please contact the fest committee.');
      }
      if (user.approved === false) {
        throw new Error('Your registration is still waiting for approval. Please try again later.');
      }

      let role = user.role || user.baseType;

      if (user.duties?.includes('dept_coordinator') || role === 'dept_coordinator') {
        role = 'dept_coordinator';
      } else if (user.baseType === 'teacher' || role === 'teacher' || role === 'class_teacher') {
        role = 'teacher';
      } else if (user.baseType === 'student' || role === 'student' || role === 'volunteer') {
        role = user.duties?.includes('volunteer') || user.role === 'volunteer' ? 'volunteer' : 'student';
      }

      sessionStorage.setItem('fest_user', JSON.stringify({ ...user, role }));
      sessionStorage.setItem('fest_just_logged_in', '1');

      // Check if this teacher was appointed as Volunteer Committee Head or Judge Committee Head on any fest
      if (role === 'teacher') {
        try {
          const fRes = await fetch(`${API_BASE}/fests`, { headers: authHeaders() });
          if (fRes.ok) {
            const fests = await fRes.json();
            const festList = Array.isArray(fests) ? fests : [];
            const isVolHead = festList.some(
              (f) => f.volunteerCoord && f.volunteerCoord !== 'Unassigned' && normName(f.volunteerCoord) === normName(user.name)
            );
            if (isVolHead) {
              navigate(`/volunteer-dashboard/${user.id}`, { replace: true });
              return;
            }
            const isJudgeHead = festList.some(
              (f) => f.judgeCoord && f.judgeCoord !== 'Unassigned' && normName(f.judgeCoord) === normName(user.name)
            );
            if (isJudgeHead) {
              navigate(`/judge/${user.id}`, { replace: true });
              return;
            }
          }
        } catch {
          // Fall back to regular teacher route if fests check fails
        }
      }

      const destination = role === 'committee'
        ? '/admin'
        : `${ROLE_ROUTES[role] || '/student'}/${user.id}`;

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#0E4D55] focus:outline-none focus:ring-4 focus:ring-[#0E4D55]/15';

  return (
    <div className="min-h-screen bg-white text-slate-900 lg:grid lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex min-h-[18rem] flex-col justify-between gap-10 overflow-hidden bg-[#072C31] px-6 py-8 text-white lg:min-h-screen lg:px-14 lg:py-12">
        <Photo
          src={LOGIN_PHOTO.src}
          alt={LOGIN_PHOTO.alt}
          eager
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#072C31] via-[#072C31]/70 to-[#072C31]/30"
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
            <Trophy className="h-6 w-6" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">CampusFest</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-6xl">
            Every program, venue and result in one place.
          </h1>
        </div>
      </section>

      <main className="flex items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-600">Teachers use Email/Staff ID. Students use Register No &amp; DOB.</p>
          </div>

          {notice && !error && (
            <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {notice}
            </div>
          )}

          {error && (
            <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email / Staff ID / Register No</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} className={inputClass} required />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Password / DOB</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-11`} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#072C31] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0D3D44] disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
            New teacher, student or volunteer? <Link to="/register" className="font-semibold text-[#072C31] hover:underline">Register here</Link>
          </div>
        </div>
      </main>
    </div>
  );
}