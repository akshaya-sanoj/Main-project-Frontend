import React, { useRef } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';

/*
 * Card colours. Each department gets the next colour in this list, so students
 * from the same department share a colour. Add or edit entries to change the look.
 * All of these keep white text readable.
 */
export const CARD_THEMES = [
  { name: 'Teal',    from: '#0E4D55', mid: '#0B3F46', to: '#072C31', accent: '#0B3F46' },
  { name: 'Indigo',  from: '#4F46E5', mid: '#3730A3', to: '#1E1B4B', accent: '#3730A3' },
  { name: 'Rose',    from: '#DB2777', mid: '#9D174D', to: '#500724', accent: '#9D174D' },
  { name: 'Amber',   from: '#C2410C', mid: '#92400E', to: '#451A03', accent: '#92400E' },
  { name: 'Emerald', from: '#059669', mid: '#065F46', to: '#022C22', accent: '#065F46' },
];

/*
 * A glossy student card. It tilts toward the mouse and a soft glare follows the cursor.
 * Tilt is skipped for people who have "reduce motion" turned on.
 *
 * Props
 * - student: { studentName, studentId, deptName, teacherName, semester, phone, members, forwardedAt }
 * - themeIndex: which colour from CARD_THEMES to use (default 0)
 * - tiltStrength: how far the card tilts, in degrees (default 12)
 * - radius: corner radius in px (default 24)
 * - formatDate: optional function to format `forwardedAt`
 */
export default function StudentCard({ student, themeIndex = 0, tiltStrength = 12, radius = 24, formatDate }) {
  const ref = useRef(null);
  const theme = CARD_THEMES[themeIndex % CARD_THEMES.length];

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMove = (e) => {
    if (reduceMotion || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty('--rx', `${((0.5 - py) * tiltStrength).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - 0.5) * tiltStrength).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
    el.style.setProperty('--glare', '1');
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--glare', '0');
  };

  const name = student.studentName || 'Unnamed student';
  const members = Array.isArray(student.members) ? student.members : [];

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative overflow-hidden p-5 text-white shadow-lg shadow-black/10"
      style={{
        borderRadius: radius,
        background: `linear-gradient(145deg, ${theme.from} 0%, ${theme.mid} 50%, ${theme.to} 100%)`,
        border: '1px solid rgba(255,255,255,0.15)',
        transform: 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transition: 'transform 0.15s ease-out',
        willChange: 'transform',
      }}
    >
      {/* Metallic sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.1) 45%, transparent 60%)',
        }}
      />
      {/* Glare that follows the cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at var(--gx, 50%) var(--gy, 0%), rgba(255,255,255,0.28), transparent 55%)',
          opacity: 'var(--glare, 0)',
          transition: 'opacity 0.2s ease-out',
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-base font-extrabold"
              style={{ color: theme.accent }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="fest-display truncate text-lg font-extrabold leading-tight">{name}</p>
              <p className="mt-0.5 font-mono text-xs text-white/80">ID: {student.studentId}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white">
            <CheckCircle2 size={12} /> Forwarded
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{student.deptName}</span>
          {student.semester && (
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{student.semester}</span>
          )}
        </div>

        <dl className="mt-4 space-y-1.5 border-t border-white/20 pt-4 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-white/80">Teacher in-charge</dt>
            <dd className="text-right font-semibold">{student.teacherName}</dd>
          </div>
          {student.phone && (
            <div className="flex justify-between gap-3">
              <dt className="text-white/80">Phone</dt>
              <dd className="inline-flex items-center gap-1 font-semibold">
                <Phone size={11} /> {student.phone}
              </dd>
            </div>
          )}
          {student.forwardedAt && (
            <div className="flex justify-between gap-3">
              <dt className="text-white/80">Forwarded</dt>
              <dd className="text-right font-semibold">
                {formatDate ? formatDate(student.forwardedAt) : student.forwardedAt}
              </dd>
            </div>
          )}
        </dl>

        {members.length > 0 && (
          <p className="mt-3 border-t border-white/20 pt-3 text-xs text-white/90">
            <span className="font-semibold text-white">Team:</span> {members.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}