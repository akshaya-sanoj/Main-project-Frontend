import { useState } from 'react';
import { Eye, EyeOff, Lock, User, Trophy, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';

const ROLE_ROUTES = {
  committee: '/admin',
  dept_coordinator: '/coordinator',
  class_teacher: '/teacher',
  program_teacher: '/teacher',
  student: '/student',
  volunteer: '/volunteer-dashboard' // Added route mapping for volunteers
};

export default function LoginPage() {
  const [query, setQuery] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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
      let role = user.role || user.baseType;

      if (role === 'teacher') {
        if (user.duties?.includes('dept_coordinator')) {
          role = 'dept_coordinator';
        } else if (user.duties?.includes('class_teacher')) {
          role = 'class_teacher';
        } else {
          role = 'class_teacher'; // Default teacher mapping
        }
      } else if (role === 'student') {
        // Check if the user has a volunteer duty or role
        if (user.duties?.includes('volunteer') || user.role === 'volunteer') {
          role = 'volunteer';
        } else {
          role = 'student';
        }
      }

      // Admin goes straight to /admin; others append their unique ID
      const destination = role === 'committee'
        ? '/admin'
        : `${ROLE_ROUTES[role] || '/student'}/${user.id}`;

      localStorage.setItem('fest_user', JSON.stringify({ ...user, role }));
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
      <section className="relative flex flex-col justify-between gap-10 bg-[#0B3F46] px-6 py-8 text-white lg:min-h-screen lg:px-14 lg:py-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
            <Trophy className="h-6 w-6" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">CampusFest</span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-6xl">
            Every program, venue and result in one place.
          </h1>
        </div>
        <div />
      </section>

      <main className="flex items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-600">Teachers use Email/Staff ID. Students use Register No & DOB.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-500">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#0E4D55] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0B3F46]">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
            New teacher or coordinator? <Link to="/register" className="font-semibold text-[#0B3F46] hover:underline">Register here</Link>
          </div>
        </div>
      </main>
    </div>
  );
}