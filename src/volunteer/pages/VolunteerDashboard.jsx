
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Clock,
  MapPin,
  Activity,
  ArrowUpRight,
  Bell,
  HeartHandshake
} from 'lucide-react';

export default function VolunteerDashboard() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      sender: 'Prof. Ramesh Kumar (Teacher)',
      location: 'Stage 1 Green Room',
      time: '10:45 AM',
      status: 'Pending Response'
    }
  ]);

  const handleResolveAlert = (id) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id
          ? { ...alert, status: 'Resolved & Attended' }
          : alert
      )
    );
  };

  const pendingAlerts = alerts.filter(
    (alert) => alert.status === 'Pending Response'
  ).length;

  const resolvedAlerts = alerts.filter(
    (alert) => alert.status === 'Resolved & Attended'
  ).length;

  return (
    <div className="min-h-screen bg-[#F5F8F8] text-[#173B3F] flex">

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0B3F46] text-white flex-col justify-between fixed inset-y-0 left-0 z-20">

        <div>
          {/* Logo */}
          <div className="px-6 py-7 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#0B3F46]">
                <Shield size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  CampusFest
                </h2>
                <p className="text-[10px] text-[#F5A623] uppercase tracking-[2px] font-bold">
                  Volunteer Squad
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 mt-4 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/20 font-semibold text-sm">
              <AlertTriangle size={18} />
              <span>Emergency SOS Alerts</span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 text-sm">
              <HeartHandshake size={18} />
              <span>Response Management</span>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="mb-4">
            <p className="text-sm font-semibold">
              Volunteer Team
            </p>
            <p className="text-xs text-white/50 mt-1">
              Emergency Response Committee
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
              Emergency Response
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B3F46]">
              Volunteer Support Dashboard
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Monitor emergency alerts and manage volunteer responses across fest venues.
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

          {/* Total Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-[#E1EAEA] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Total Alerts
                </p>

                <h2 className="text-3xl font-bold text-[#0B3F46] mt-2">
                  {alerts.length}
                </h2>
              </div>

              <div className="p-3 rounded-xl bg-[#E6F1F2] text-[#0B3F46]">
                <Bell size={22} />
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              All reported SOS notifications
            </p>
          </div>

          {/* Pending Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-[#E1EAEA] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Pending Response
                </p>

                <h2 className="text-3xl font-bold text-[#D6336C] mt-2">
                  {pendingAlerts}
                </h2>
              </div>

              <div className="p-3 rounded-xl bg-[#FCE7EF] text-[#D6336C]">
                <AlertTriangle size={22} />
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Alerts awaiting volunteer action
            </p>
          </div>

          {/* Resolved Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-[#E1EAEA] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Resolved Alerts
                </p>

                <h2 className="text-3xl font-bold text-emerald-600 mt-2">
                  {resolvedAlerts}
                </h2>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Successfully attended alerts
            </p>
          </div>

        </section>

        {/* Emergency Queue */}
        <section className="bg-white border border-[#E1EAEA] rounded-2xl shadow-sm overflow-hidden">

          {/* Section Header */}
          <div className="p-5 sm:p-6 border-b border-[#E1EAEA] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#FCE7EF] rounded-xl text-[#D6336C]">
                <AlertTriangle size={20} />
              </div>

              <div>
                <h3 className="font-bold text-[#0B3F46] text-lg">
                  Active Emergency SOS Queue
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Review and respond to reported emergencies
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 text-xs font-bold text-[#D6336C] bg-[#FCE7EF] px-3 py-2 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#D6336C] animate-pulse" />
              {pendingAlerts} Pending
            </span>

          </div>

          {/* Alert List */}
          <div className="p-4 sm:p-6 space-y-4">

            {alerts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} />
                </div>

                <h4 className="font-bold text-[#0B3F46]">
                  No Emergency Alerts
                </h4>

                <p className="text-sm text-slate-500 mt-2">
                  There are no reported emergencies at the moment.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 transition ${
                    alert.status === 'Resolved & Attended'
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : 'bg-[#FFF9FA] border-[#F5D6E1]'
                  }`}
                >

                  {/* Alert Information */}
                  <div className="flex gap-4">

                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.status === 'Resolved & Attended'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-[#FCE7EF] text-[#D6336C]'
                    }`}>
                      {alert.status === 'Resolved & Attended' ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <PhoneCall size={22} />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#173B3F] text-sm sm:text-base">
                          {alert.sender}
                        </h4>

                        {alert.status === 'Pending Response' && (
                          <span className="text-[10px] font-bold text-[#D6336C] bg-[#FCE7EF] px-2 py-1 rounded-full">
                            SOS ALERT
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#D99416]" />
                        <span className="font-semibold text-slate-700">
                          {alert.location}
                        </span>
                      </p>

                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock size={13} />
                        Reported at {alert.time}
                      </p>
                    </div>

                  </div>

                  {/* Alert Actions */}
                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">

                    <span
                      className={`px-3 py-2 rounded-full text-xs font-bold ${
                        alert.status === 'Resolved & Attended'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-[#FCE7EF] text-[#D6336C]'
                      }`}
                    >
                      {alert.status}
                    </span>

                    {alert.status !== 'Resolved & Attended' && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="inline-flex items-center justify-center gap-2 bg-[#0B3F46] hover:bg-[#14545C] text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-sm"
                      >
                        <CheckCircle2 size={15} />
                        Mark Resolved
                      </button>
                    )}

                  </div>

                </div>
              ))
            )}

          </div>

          {/* Queue Footer */}
          <div className="px-5 sm:px-6 py-4 bg-[#F5F8F8] border-t border-[#E1EAEA]">
            <p className="text-xs text-slate-500">
              Please attend to pending emergency alerts promptly and update their status after responding.
            </p>
          </div>

        </section>

        {/* Important Note */}
        <div className="mt-6 p-4 bg-[#FFF3D6] border border-[#F3DDAA] rounded-xl flex gap-3">
          <Shield className="text-[#B77A0D] shrink-0" size={20} />

          <p className="text-xs text-[#80601E] leading-relaxed">
            <strong>Volunteer reminder:</strong> Mark an alert as resolved only after attending to the reported situation. In this demo, status updates are stored locally and do not notify other users.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 mt-8 pb-4">
          CampusFest Volunteer Support Dashboard
        </footer>

      </main>
    </div>
  );
}
