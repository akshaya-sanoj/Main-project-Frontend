
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Plus,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Home,
  ClipboardList,
  MessageSquareWarning,
  Clock,
  CheckCircle
} from 'lucide-react';

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

export default function GrievanceDashboard() {
  const [grievances, setGrievances] = useState([
    {
      id: 1,
      department: 'Computer Science Dept',
      issue: 'Delay in stage timing for Classical Dance slot',
      status: 'Under Review'
    }
  ]);

  const [department, setDepartment] = useState('');
  const [issue, setIssue] = useState('');

  const handleLogGrievance = (e) => {
    e.preventDefault();

    if (!department.trim() || !issue.trim()) return;

    const newGrievance = {
      id: Date.now(),
      department: department.trim(),
      issue: issue.trim(),
      status: 'Open Ticket'
    };

    setGrievances((prev) => [...prev, newGrievance]);
    setDepartment('');
    setIssue('');
  };

  const handleResolve = (id) => {
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, status: 'Resolved by Committee' }
          : g
      )
    );
  };

  const totalTickets = grievances.length;
  const resolvedTickets = grievances.filter(
    (g) => g.status === 'Resolved by Committee'
  ).length;
  const pendingTickets = totalTickets - resolvedTickets;

  return (
    <div className="min-h-screen flex bg-[#F5F8F8] text-slate-800 font-['DM_Sans']">
      <style>{FONT_CSS}</style>

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#072C31] text-white flex-col justify-between p-6 shrink-0">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#072C31]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-['Bricolage_Grotesque']">
                CampusFest
              </h2>
              <p className="text-[10px] text-[#F5A623] uppercase tracking-[2px] font-bold">
                Grievance Panel
              </p>
            </div>
          </Link>

          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">
            Management
          </p>

          <nav className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F5A623] text-[#072C31] font-bold text-sm shadow-lg">
              <ShieldAlert className="w-4 h-4" />
              Appeals & Objections
            </div>
          </nav>

          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-[#F5A623] mb-2">
              <AlertCircle size={16} />
              <span className="text-xs font-bold">Dispute Resolution</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review department concerns and manage appeal tickets transparently.
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
              <ShieldAlert size={14} />
              Committee Management
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              Grievance & Disciplinary Dashboard
            </h1>

            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Manage department disputes, timing issues, objections, and appeal resolutions.
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
                Total Tickets
              </p>
              <div className="p-2 rounded-xl bg-[#E6F1F2] text-[#0B3F46]">
                <ClipboardList size={19} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              {totalTickets}
            </h3>
            <p className="text-xs text-slate-400 mt-1">All submitted grievances</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Review
              </p>
              <div className="p-2 rounded-xl bg-[#FFF3D6] text-[#B7791F]">
                <Clock size={19} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#B7791F] font-['Bricolage_Grotesque']">
              {pendingTickets}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Awaiting resolution</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Resolved
              </p>
              <div className="p-2 rounded-xl bg-[#E6F5EC] text-emerald-600">
                <CheckCircle2 size={19} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-600 font-['Bricolage_Grotesque']">
              {resolvedTickets}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Resolved by committee</p>
          </div>
        </section>

        <div className="space-y-8">

          {/* Log Grievance Form */}
          <section className="bg-white border border-slate-200 p-5 sm:p-7 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#FCE7EF] text-[#D6336C] p-2.5 rounded-xl">
                <Plus size={21} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
                  Log a Grievance
                </h2>
                <p className="text-xs text-slate-400">
                  Submit an official objection or dispute ticket.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleLogGrievance}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Department / Unit Name
                </label>
                <input
                  type="text"
                  placeholder="Enter department name"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#F5F8F8] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Issue Description
                </label>
                <input
                  type="text"
                  placeholder="Describe the issue or objection"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full bg-[#F5F8F8] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#FFB83D] text-[#072C31] font-extrabold py-3 px-7 rounded-xl transition shadow-md shadow-[#F5A623]/20 text-sm"
                >
                  <Plus size={17} />
                  Submit Ticket
                </button>
              </div>
            </form>
          </section>

          {/* Grievance Tickets */}
          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-[#0B3F46] text-lg font-['Bricolage_Grotesque']">
                  Grievance & Appeal Tickets
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Track and resolve submitted department concerns.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E6F1F2] text-[#0B3F46]">
                {totalTickets} Tickets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[#F5F8F8] text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 font-bold">Department / Unit</th>
                    <th className="p-4 font-bold">Objection Details</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {grievances.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F5F8F8]/70 transition"
                    >
                      <td className="p-4 font-bold text-[#0B3F46]">
                        {item.department}
                      </td>

                      <td className="p-4 text-slate-600 max-w-xs">
                        {item.issue}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                            item.status === 'Resolved by Committee'
                              ? 'bg-[#E6F5EC] text-emerald-700'
                              : item.status === 'Under Review'
                              ? 'bg-[#FCE7EF] text-[#D6336C]'
                              : 'bg-[#FFF3D6] text-[#B7791F]'
                          }`}
                        >
                          {item.status === 'Resolved by Committee' ? (
                            <CheckCircle size={13} />
                          ) : (
                            <Clock size={13} />
                          )}
                          {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        {item.status !== 'Resolved by Committee' && (
                          <button
                            onClick={() => handleResolve(item.id)}
                            className="inline-flex items-center gap-1.5 bg-[#0B3F46] hover:bg-[#072C31] text-white text-xs px-3 py-2 rounded-lg font-bold transition"
                          >
                            <CheckCircle2 size={14} />
                            Resolve
                          </button>
                        )}

                        {item.status === 'Resolved by Committee' && (
                          <span className="text-xs text-emerald-600 font-bold">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {grievances.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-10 text-center">
                        <div className="flex flex-col items-center">
                          <MessageSquareWarning className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-500">
                            No grievance tickets yet
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Submitted tickets will appear here.
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
          CampusFest Grievance Management • Dispute Resolution Panel
        </footer>
      </main>
    </div>
  );
}
