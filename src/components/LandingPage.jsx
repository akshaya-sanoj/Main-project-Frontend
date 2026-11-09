import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Radio, ArrowRight } from 'lucide-react';

/*
 * LandingPage (design only)
 * Needs: React, react-router-dom, Tailwind CSS, lucide-react
 * Links go to /login and /public-status.
 * Fonts: Bricolage Grotesque + DM Sans from Google Fonts, with system fallbacks.
 */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
.fest-display { font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif; }
.fest-body { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
`;

const QUEUE = [
  { no: 104, who: 'Anu Krishnan' },
  { no: 112, who: 'Rahul Menon' },
  { no: 118, who: 'Meera Nair' },
  { no: 121, who: 'Arjun Das' },
  { no: 125, who: 'Fida Rahman' },
  { no: 131, who: 'Devika Suresh' },
  { no: 137, who: 'Alan Joseph' },
  { no: 142, who: 'Sneha Mohan' },
];

const ROW_STYLE = {
  '-1': { label: 'Done', row: 'text-white/45', chip: 'bg-white/10 text-white/60' },
  0: { label: 'Now performing', row: 'bg-[#F5A623] text-[#2A1A00]', chip: 'bg-[#2A1A00] text-[#F5A623]' },
  1: { label: 'Next', row: 'text-white', chip: 'bg-[#D6336C] text-white' },
  2: { label: 'Upcoming', row: 'text-white/80', chip: 'bg-white/15 text-white/80' },
};

function StatusBoard() {
  const [cursor, setCursor] = useState(1);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setCursor((c) => (c + 1) % QUEUE.length), 3500);
    return () => clearInterval(id);
  }, []);

  const rows = [-1, 0, 1, 2, 3].map((offset) => ({
    ...QUEUE[(cursor + offset + QUEUE.length) % QUEUE.length],
    style: ROW_STYLE[Math.min(offset, 2)],
  }));

  return (
    <div aria-hidden="true" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#072C31] p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="fest-display text-lg font-semibold text-white">RECITATION,ENGLISH</p>
          <p className="text-xs text-white/60">Stage 2 · 10:30 AM</p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
          <span className="h-2 w-2 rounded-full bg-[#F5A623] motion-safe:animate-pulse" />
          Live
        </span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.no} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-500 ${r.style.row}`}>
            <span className="fest-display w-10 text-base font-bold tabular-nums">{r.no}</span>
            <span className="flex-1 truncate">{r.who}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.style.chip}`}>{r.style.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = [
  ['The committee sets up the fest', 'Programs, fees, the minimum number of participants, and the last date for data entry.'],
  ['Departments enter participants', 'Coordinators assign teachers to programs, and teachers add the students who will perform.'],
  ['Funds are collected', 'Students pay their class teacher, who passes the amount on to the department coordinator.'],
  ['Fest day runs live', 'Venues, performance order, emergency help and judges\u2019 marks, then results and the leaderboard.'],
];

const ROLES = [
  ['Fest committee', 'Creates the fest and its programs, assigns coordinators and committees, sets venues and dates, and publishes results.'],
  ['Department and section coordinators', 'Assign teachers to programs, review who is taking part, and submit the final list to the committee.'],
  ['Teachers', 'Enter student details for their programs, track class funds, and see the duties they have been given.'],
  ['Students', 'See their programs, venues and duties, pay their class fund, and follow the stage as it happens.'],
  ['Volunteers', 'Get an alert the moment someone asks for emergency help, and see who else is on the team.'],
  ['Judges', 'Enter marks for each program. The committee sees them as soon as they are saved.'],
];

const HOUSES = ['#2563EB', '#DC2626', '#16A34A', '#EAB308'];

export default function LandingPage() {
  return (
    <div className="fest-body min-h-screen bg-white text-slate-900">
      <style>{FONT_CSS}</style>

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0B3F46] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-[#D6336C]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[22px] border-[#F5A623]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full border-[48px] border-[#F5A623]/20" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="fest-display text-xl font-extrabold tracking-tight">CampusFest</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              to="/public-status"
              className="hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#F5A623] sm:inline-flex"
            >
              <Radio className="h-4 w-4 text-[#F5A623]" aria-hidden="true" />
              Live board
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0B3F46] transition hover:bg-[#FFF3D6] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/50"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-16">
          <div className="max-w-xl">
            <h1 className="fest-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Run your whole fest from one screen.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
              CampusFest takes school and college arts fests, sports meets and youth festivals online: entries, funds, venues, live stage status and results.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-7 py-3.5 text-sm font-semibold text-[#2A1A00] transition hover:bg-[#FFB83D] focus:outline-none focus:ring-4 focus:ring-white/40"
              >
                Sign in to your dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/public-status"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <Radio className="h-4 w-4 text-[#F5A623]" aria-hidden="true" />
                Watch the live board
              </Link>
            </div>
          </div>
          <div className="lg:justify-self-end">
            <StatusBoard />
          </div>
        </div>
      </div>

      {/* How a fest runs: a real sequence, so the steps are numbered */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="fest-display max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          From the first entry to the final result
        </h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="border-t-4 border-[#F5A623] pt-5">
              <span className="fest-display text-4xl font-extrabold text-[#0E4D55]/25">{i + 1}</span>
              <h3 className="fest-display mt-2 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="fest-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everyone sees what they need, and nothing more
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-600">
              Each person signs in once and lands on their own dashboard, based on the duties the committee has given them.
            </p>
          </div>
          <dl className="divide-y divide-slate-200 border-y border-slate-200">
            {ROLES.map(([role, text]) => (
              <div key={role} className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
                <dt className="fest-display text-base font-semibold text-[#0E4D55]">{role}</dt>
                <dd className="text-sm leading-relaxed text-slate-600">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* School and college */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="fest-display max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Built for schools and colleges
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-[#E6F1F2] p-8">
            <h3 className="fest-display text-xl font-semibold text-[#0B3F46]">School fests</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Students are grouped by section (LP, UP, HS, HSS) and compete for their house. A program goes ahead only when at least 3 students take part.
            </p>
            <div className="mt-5 flex items-center gap-2" aria-label="House colours: blue, red, green, yellow">
              {HOUSES.map((c) => (
                <span key={c} className="h-6 w-6 rounded-full ring-2 ring-white" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-[#FDEFD3] p-8">
            <h3 className="fest-display text-xl font-semibold text-[#5C3B00]">College fests</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Departments such as CS, EEE, Economics and History take part together. A program goes ahead only when at least 3 departments enter it, and the committee can see what each department has collected.
            </p>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="bg-[#0B3F46] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center">
          <h2 className="fest-display max-w-md text-2xl font-extrabold tracking-tight sm:text-3xl">
            Ready for this year&rsquo;s fest?
          </h2>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-7 py-3.5 text-sm font-semibold text-[#2A1A00] transition hover:bg-[#FFB83D] focus:outline-none focus:ring-4 focus:ring-white/40"
          >
            Sign in
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="bg-[#072C31] px-6 py-6 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} CampusFest. Fest management for schools and colleges.
      </footer>
    </div>
  );
}