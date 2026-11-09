
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Plus,
  Radio,
  Trash2,
  CheckCircle2,
  Home,
  ArrowLeft,
  Users,
  MapPin,
  CalendarDays,
  Video,
  Image
} from 'lucide-react';

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

export default function MediaDashboard() {
  const [coverages, setCoverages] = useState([
    {
      id: 1,
      photographer: 'Arun V. (Media Team)',
      venue: 'Stage 1 - Main Auditorium',
      event: 'Classical Dance',
      status: 'Active Coverage'
    }
  ]);

  const [photographer, setPhotographer] = useState('');
  const [venue, setVenue] = useState('Stage 1 - Main Auditorium');
  const [event, setEvent] = useState('');

  const handleAddCoverage = (e) => {
    e.preventDefault();

    if (!photographer.trim() || !event.trim()) return;

    const newCov = {
      id: Date.now(),
      photographer: photographer.trim(),
      venue,
      event: event.trim(),
      status: 'Scheduled'
    };

    setCoverages((prev) => [...prev, newCov]);
    setPhotographer('');
    setEvent('');
  };

  const handleDeleteCoverage = (id) => {
    setCoverages((prev) => prev.filter((c) => c.id !== id));
  };

  const activeCoverages = coverages.filter(
    (c) => c.status === 'Active Coverage'
  ).length;

  const scheduledCoverages = coverages.filter(
    (c) => c.status === 'Scheduled'
  ).length;

  return (
    <div className="min-h-screen flex bg-[#F5F8F8] text-slate-800 font-['DM_Sans']">
      <style>{FONT_CSS}</style>

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#072C31] text-white flex-col justify-between p-6 shrink-0">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#072C31]">
              <Camera className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold font-['Bricolage_Grotesque']">
                CampusFest
              </h2>
              <p className="text-[10px] text-[#F5A623] uppercase tracking-[2px] font-bold">
                Media Committee
              </p>
            </div>
          </Link>

          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">
            Media Management
          </p>

          <nav className="space-y-2">
            <div className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-[#F5A623] text-[#072C31] text-sm font-bold shadow-lg">
              <Camera size={17} />
              Stage Coverage & Press
            </div>
          </nav>

          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-[#F5A623] mb-2">
              <Radio size={16} />
              <span className="text-xs font-bold">Broadcast & Press</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Coordinate photographers and videographers across event venues.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <Link
            to="/login"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-[#F5A623] font-semibold transition"
          >
            <ArrowLeft size={15} />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-y-auto">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#D6336C] font-bold uppercase tracking-wider mb-2">
              <Camera size={14} />
              Broadcast & Press
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              Media Committee Dashboard
            </h1>

            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Assign media personnel to venues and manage event coverage schedules.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0B3F46] hover:text-[#D6336C] transition"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Assignments
              </p>
              <div className="p-2 rounded-xl bg-[#E6F1F2] text-[#0B3F46]">
                <Users size={19} />
              </div>
            </div>

            <h3 className="text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              {coverages.length}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Media personnel assigned
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Coverage
              </p>
              <div className="p-2 rounded-xl bg-[#E6F5EC] text-emerald-600">
                <Radio size={19} />
              </div>
            </div>

            <h3 className="text-3xl font-extrabold text-emerald-600 font-['Bricolage_Grotesque']">
              {activeCoverages}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Currently active assignments
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Scheduled
              </p>
              <div className="p-2 rounded-xl bg-[#FFF3D6] text-[#B7791F]">
                <CalendarDays size={19} />
              </div>
            </div>

            <h3 className="text-3xl font-extrabold text-[#B7791F] font-['Bricolage_Grotesque']">
              {scheduledCoverages}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Upcoming coverage assignments
            </p>
          </div>
        </section>

        <div className="space-y-8">

          {/* Assign Media Personnel Form */}
          <section className="bg-white border border-slate-200 p-5 sm:p-7 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#FCE7EF] text-[#D6336C] p-2.5 rounded-xl">
                <Plus size={21} />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
                  Assign Media Personnel
                </h2>
                <p className="text-xs text-slate-400">
                  Schedule a photographer or videographer for an event.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleAddCoverage}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Personnel Name
                </label>

                <input
                  type="text"
                  placeholder="Enter photographer name"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  className="w-full bg-[#F5F8F8] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Venue
                </label>

                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-[#F5F8F8] border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0B3F46] focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                >
                  <option value="Stage 1 - Main Auditorium">
                    Stage 1 - Main Auditorium
                  </option>
                  <option value="Stage 2 - Open Air Theatre">
                    Stage 2 - Open Air Theatre
                  </option>
                  <option value="Stage 3 - Indoor Seminar Hall">
                    Stage 3 - Indoor Seminar Hall
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Event Program
                </label>

                <input
                  type="text"
                  placeholder="Enter event name"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="w-full bg-[#F5F8F8] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#FFB83D] text-[#072C31] font-extrabold py-3 px-5 rounded-xl transition shadow-md shadow-[#F5A623]/20 text-sm"
                >
                  <Plus size={17} />
                  Assign Schedule
                </button>
              </div>
            </form>
          </section>

          {/* Media Coverage Roster */}
          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-[#0B3F46] text-lg font-['Bricolage_Grotesque']">
                  Media Coverage Roster
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  View and manage assigned media coverage schedules.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E6F1F2] text-[#0B3F46]">
                {coverages.length} Assignments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-[#F5F8F8] text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 font-bold">Media Personnel</th>
                    <th className="p-4 font-bold">Venue</th>
                    <th className="p-4 font-bold">Program</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {coverages.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F5F8F8]/70 transition"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-[#E6F1F2] text-[#0B3F46] p-2 rounded-lg">
                            <Camera size={16} />
                          </div>

                          <span className="font-bold text-[#0B3F46]">
                            {item.photographer}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#D6336C]" />
                          {item.venue}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 font-medium">
                        {item.event}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                            item.status === 'Active Coverage'
                              ? 'bg-[#E6F5EC] text-emerald-700'
                              : 'bg-[#FFF3D6] text-[#B7791F]'
                          }`}
                        >
                          <CheckCircle2 size={13} />
                          {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCoverage(item.id)}
                          title="Delete assignment"
                          className="text-[#D6336C] hover:bg-[#FCE7EF] p-2 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {coverages.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-10 text-center">
                        <div className="flex flex-col items-center">
                          <Image className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-500">
                            No media assignments yet
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Add a media assignment using the form above.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs text-slate-400">
          CampusFest Media Committee • Broadcast & Press
        </footer>
      </main>
    </div>
  );
}
