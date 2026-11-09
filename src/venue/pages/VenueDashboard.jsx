
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Radio,
  CheckSquare,
  Square,
  CheckCircle2,
  Clock,
  CalendarDays,
  Activity,
  Volume2,
  ArrowUpRight
} from 'lucide-react';

export default function VenueDashboard() {
  const [venues] = useState([
    {
      id: 1,
      stageName: 'Stage 1 - Main Auditorium',
      boardInCharge: 'Prof. Rajesh Menon',
      currentProgram: 'Classical Dance (Solo)',
      status: 'Active'
    },
    {
      id: 2,
      stageName: 'Stage 2 - Open Air Theatre',
      boardInCharge: 'Dr. Priya Nair',
      currentProgram: 'Group Song (Western)',
      status: 'Standby'
    }
  ]);

  const [checklist, setChecklist] = useState([
    {
      id: 101,
      item: 'Wireless Microphones (x4)',
      stage: 'Stage 1 - Main Auditorium',
      checked: true
    },
    {
      id: 102,
      item: 'Audio Mixing Console',
      stage: 'Stage 1 - Main Auditorium',
      checked: true
    },
    {
      id: 103,
      item: 'Stage LED Lighting Rig',
      stage: 'Stage 2 - Open Air Theatre',
      checked: false
    }
  ]);

  const toggleCheck = (id) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, checked: !item.checked }
          : item
      )
    );
  };

  const activeVenues = venues.filter(
    (venue) => venue.status === 'Active'
  ).length;

  const readyEquipment = checklist.filter(
    (item) => item.checked
  ).length;

  const pendingEquipment = checklist.length - readyEquipment;

  return (
    <div className="min-h-screen bg-[#F5F8F8] text-[#173B3F] flex">

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0B3F46] text-white flex-col justify-between fixed inset-y-0 left-0 z-20">

        <div>
          {/* Logo */}
          <div className="px-6 py-7 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#0B3F46]">
                <MapPin size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  CampusFest
                </h2>
                <p className="text-[10px] text-[#F5A623] uppercase tracking-[2px] font-bold">
                  Venue Operations
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 mt-4 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/20 font-semibold text-sm">
              <Radio size={18} />
              <span>Venue Management</span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 text-sm">
              <Volume2 size={18} />
              <span>Equipment Checklist</span>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="mb-4">
            <p className="text-sm font-semibold">Venue Operations Team</p>
            <p className="text-xs text-white/50 mt-1">
              Stage & Sound Committee
            </p>
          </div>

          <Link
            to="/login"
            className="text-sm text-[#F5A623] hover:text-[#FFB83D] font-semibold transition"
          >
            ← Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">

          <div>
            <p className="text-xs font-bold text-[#D6336C] uppercase tracking-[2px] mb-2">
              Operations Dashboard
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B3F46]">
              Stage & Venue Management
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Monitor stage availability, live performance queues and equipment readiness.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B3F46] hover:text-[#D6336C] transition"
          >
            Back to Home
            <ArrowUpRight size={16} />
          </Link>
        </header>

        {/* Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

          <div className="bg-white p-5 rounded-2xl border border-[#E1EAEA] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Total Venues
                </p>
                <h2 className="text-3xl font-bold text-[#0B3F46] mt-2">
                  {venues.length}
                </h2>
              </div>

              <div className="p-3 rounded-xl bg-[#E6F1F2] text-[#0B3F46]">
                <MapPin size={22} />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Registered stage locations
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E1EAEA] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Active Stages
                </p>
                <h2 className="text-3xl font-bold text-emerald-600 mt-2">
                  {activeVenues}
                </h2>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Activity size={22} />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Currently hosting performances
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E1EAEA] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Equipment Ready
                </p>
                <h2 className="text-3xl font-bold text-[#0B3F46] mt-2">
                  {readyEquipment}/{checklist.length}
                </h2>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF3D6] text-[#D99416]">
                <CheckCircle2 size={22} />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {pendingEquipment} items awaiting verification
            </p>
          </div>

        </section>

        {/* Live Stage Queue */}
        <section className="bg-white border border-[#E1EAEA] rounded-2xl shadow-sm overflow-hidden mb-8">

          <div className="p-5 sm:p-6 border-b border-[#E1EAEA] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#E6F1F2] rounded-xl text-[#0B3F46]">
                <Radio size={20} />
              </div>

              <div>
                <h3 className="font-bold text-[#0B3F46] text-lg">
                  Live Stage Queue
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Current performance and stage status
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Status
            </span>

          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-[#F5F8F8] text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Stage Venue</th>
                  <th className="p-4 font-bold">Board In-Charge</th>
                  <th className="p-4 font-bold">Current Program</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EAF0F0]">
                {venues.map((venue) => (
                  <tr
                    key={venue.id}
                    className="hover:bg-[#F5F8F8] transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#D99416]" />
                        <span className="font-semibold text-[#173B3F] text-sm">
                          {venue.stageName}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {venue.boardInCharge}
                    </td>

                    <td className="p-4 text-sm font-semibold text-[#0B6970]">
                      {venue.currentProgram}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                          venue.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-[#FFF3D6] text-[#9A680C]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            venue.status === 'Active'
                              ? 'bg-emerald-500'
                              : 'bg-[#D99416]'
                          }`}
                        />
                        {venue.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

        {/* Equipment Checklist */}
        <section className="bg-white border border-[#E1EAEA] rounded-2xl shadow-sm overflow-hidden">

          <div className="p-5 sm:p-6 border-b border-[#E1EAEA]">

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#FFF3D6] rounded-xl text-[#B77A0D]">
                <CheckSquare size={20} />
              </div>

              <div>
                <h3 className="font-bold text-[#0B3F46] text-lg">
                  Stage Equipment & Sound Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select an item to update its verification status
                </p>
              </div>
            </div>

          </div>

          <div className="p-4 sm:p-6 space-y-3">

            {checklist.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCheck(item.id)}
                className={`w-full text-left p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition ${
                  item.checked
                    ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300'
                    : 'bg-[#FFFDF8] border-[#F2E5C9] hover:border-[#E5BD70]'
                }`}
              >

                <div className="flex items-center gap-3 min-w-0">

                  {item.checked ? (
                    <CheckSquare
                      size={22}
                      className="text-emerald-600 shrink-0"
                    />
                  ) : (
                    <Square
                      size={22}
                      className="text-[#D99416] shrink-0"
                    />
                  )}

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold ${
                        item.checked
                          ? 'text-slate-500 line-through'
                          : 'text-[#173B3F]'
                      }`}
                    >
                      {item.item}
                    </p>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      {item.stage}
                    </p>
                  </div>

                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${
                    item.checked
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-[#FFF0D1] text-[#9A680C]'
                  }`}
                >
                  {item.checked ? (
                    <>
                      <CheckCircle2 size={13} />
                      Verified Ready
                    </>
                  ) : (
                    <>
                      <Clock size={13} />
                      Pending Check
                    </>
                  )}
                </span>

              </button>
            ))}

          </div>

          {/* Checklist Footer */}
          <div className="px-5 sm:px-6 py-4 bg-[#F5F8F8] border-t border-[#E1EAEA] flex flex-col sm:flex-row sm:justify-between gap-2">
            <p className="text-xs text-slate-500">
              Equipment verification progress
            </p>

            <p className="text-xs font-bold text-[#0B3F46]">
              {readyEquipment} of {checklist.length} items verified
            </p>
          </div>

        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 mt-8 pb-4">
          CampusFest Venue Operations Dashboard
        </footer>

      </main>
    </div>
  );
}
