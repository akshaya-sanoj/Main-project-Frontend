
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Home,
  Clock,
  MapPin,
  Music2,
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

export default function PublicLiveBoard() {
  const stageEntries = [
    {
      id: 1,
      title: 'Currently Performing',
      chestNo: 'A-101',
      name: 'Rahul V.',
      college: 'Vidya Academy',
      status: 'On Stage',
      color: 'emerald',
      icon: PlayCircle
    },
    {
      id: 2,
      title: 'Up Next',
      chestNo: 'A-102',
      name: 'Ananya S.',
      college: 'Govt College',
      status: 'Standby',
      color: 'gold',
      icon: Clock
    },
    {
      id: 3,
      title: 'Following',
      chestNo: 'A-103',
      name: 'Kiran M.',
      college: "St. Joseph's",
      status: 'Preparing',
      color: 'pink',
      icon: Users
    }
  ];

  const styles = {
    emerald: {
      border: 'border-emerald-200',
      background: 'bg-emerald-50',
      heading: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
      icon: 'bg-emerald-100 text-emerald-700'
    },
    gold: {
      border: 'border-[#F5A623]/50',
      background: 'bg-[#FFF8E9]',
      heading: 'text-[#B7791F]',
      badge: 'bg-[#FFF0CE] text-[#A66A12]',
      icon: 'bg-[#FFF0CE] text-[#A66A12]'
    },
    pink: {
      border: 'border-[#D6336C]/30',
      background: 'bg-[#FFF3F7]',
      heading: 'text-[#D6336C]',
      badge: 'bg-[#FCE7EF] text-[#D6336C]',
      icon: 'bg-[#FCE7EF] text-[#D6336C]'
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F8] text-slate-800 font-['DM_Sans']">
      <style>{FONT_CSS}</style>

      {/* Header */}
      <header className="bg-[#072C31] text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5">

            <Link to="/" className="flex items-center gap-3">
              <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#072C31]">
                <Radio size={25} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold font-['Bricolage_Grotesque']">
                  CampusFest
                </h2>
                <p className="text-[10px] text-[#F5A623] uppercase tracking-[2px] font-bold">
                  Public Live Board
                </p>
              </div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              <Home size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10">

        {/* Page Introduction */}
        <section className="mb-10">
          <div className="flex items-center gap-2 text-xs text-[#D6336C] font-bold uppercase tracking-wider mb-3">
            <Radio size={15} />
            Live Event Updates
          </div>

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
                Live Stage Status Board
              </h1>

              <p className="text-slate-500 mt-2 text-sm sm:text-base">
                Follow the latest performance updates from the main stage.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm w-fit">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-700">
                Live Stage Board
              </span>
            </div>
          </div>
        </section>

        {/* Stage Information */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#E6F1F2] text-[#0B3F46] p-3 rounded-xl">
                <MapPin size={22} />
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Current Venue
                </p>
                <h2 className="text-lg font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
                  Main Stage 1
                </h2>
                <p className="text-xs text-slate-500">
                  State Arts Fest 2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays size={16} className="text-[#D6336C]" />
              <span>Stage Performance Schedule</span>
            </div>
          </div>
        </section>

        {/* Performance Cards */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
                Performance Queue
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Current and upcoming participants
              </p>
            </div>

            <span className="bg-[#E6F1F2] text-[#0B3F46] px-3 py-1.5 rounded-full text-xs font-bold">
              3 Participants
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stageEntries.map((item) => {
              const style = styles[item.color];
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className={`bg-white border ${style.border} rounded-3xl p-6 shadow-sm hover:shadow-lg transition duration-300`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${style.heading}`}>
                      {item.title}
                    </span>

                    <div className={`p-2.5 rounded-xl ${style.icon}`}>
                      <Icon size={20} />
                    </div>
                  </div>

                  <p className="text-3xl sm:text-4xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
                    {item.chestNo}
                  </p>

                  <div className="mt-4">
                    <h3 className="text-base font-bold text-slate-800">
                      {item.name}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {item.college}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${style.badge}`}>
                      {item.status === 'On Stage' && (
                        <PlayCircle size={13} />
                      )}
                      {item.status === 'Standby' && (
                        <Clock size={13} />
                      )}
                      {item.status === 'Preparing' && (
                        <Users size={13} />
                      )}
                      {item.status}
                    </span>

                    <span className="text-[10px] text-slate-400 font-semibold">
                      #{item.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Information */}
        <section className="mt-10 bg-[#0B3F46] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full bg-[#F5A623]/10"></div>
          <div className="absolute -right-5 -bottom-20 w-40 h-40 rounded-full bg-[#D6336C]/10"></div>

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="bg-[#F5A623] text-[#072C31] p-3 rounded-xl w-fit">
              <Music2 size={23} />
            </div>

            <div>
              <h3 className="text-lg font-extrabold font-['Bricolage_Grotesque']">
                Stay Tuned for the Next Performance!
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Follow the performance queue to see who's on stage and who's up next.
              </p>
            </div>

            <div className="sm:ml-auto flex items-center gap-2 text-[#F5A623] text-sm font-bold">
              Live Updates
              <ArrowRight size={17} />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs text-slate-400">
          CampusFest • Public Live Stage Status Board • State Arts Fest 2026
        </footer>
      </main>
    </div>
  );
}
