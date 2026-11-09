
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Save,
  Send,
  Home,
  ArrowLeft,
  ClipboardList,
  Clock,
  MapPin,
  Trophy,
  Users
} from 'lucide-react';

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

export default function JudgeDashboard() {
  const [activeTab, setActiveTab] = useState('scorecard');

  const assignedPrograms = [
    {
      id: 1,
      programName: 'Classical Dance (Solo)',
      venue: 'Stage 1 - Main Auditorium',
      status: 'Pending Evaluation'
    },
    {
      id: 2,
      programName: 'Mohiniyattam',
      venue: 'Stage 1 - Main Auditorium',
      status: 'Completed'
    }
  ];

  const [contestants, setContestants] = useState([
    { id: 101, chestNo: 'C-01', participantName: 'Rahul V. (CSE)', score: '', rank: '' },
    { id: 102, chestNo: 'C-02', participantName: 'Ananya S. (ECE)', score: '', rank: '' },
    { id: 103, chestNo: 'C-03', participantName: 'Meera R. (EEE)', score: '', rank: '' }
  ]);

  const handleScoreChange = (id, field, value) => {
    setContestants((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSubmitScorecard = (e) => {
    e.preventDefault();

    const incomplete = contestants.some(
      (c) => c.score === '' || c.rank === ''
    );

    if (incomplete) {
      alert('Please enter the score and rank for every contestant.');
      return;
    }

    alert('Successfully submitted judge scores and results to the Fest Committee!');
  };

  const completedPrograms = assignedPrograms.filter(
    (p) => p.status === 'Completed'
  ).length;

  return (
    <div className="min-h-screen flex bg-[#F5F8F8] text-slate-800 font-['DM_Sans']">
      <style>{FONT_CSS}</style>

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#072C31] text-white flex-col justify-between p-6 shrink-0">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="bg-[#F5A623] p-2.5 rounded-xl text-[#072C31]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-['Bricolage_Grotesque']">
                CampusFest
              </h2>
              <p className="text-[10px] text-[#F5A623] uppercase tracking-[2px] font-bold">
                Judge Committee
              </p>
            </div>
          </Link>

          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">
            Evaluation
          </p>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition ${
                activeTab === 'scorecard'
                  ? 'bg-[#F5A623] text-[#072C31] shadow-lg'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <ClipboardList size={17} />
              Scorecard & Markings
            </button>
          </nav>

          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-[#F5A623] mb-2">
              <Trophy size={16} />
              <span className="text-xs font-bold">Evaluation Panel</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluate participants fairly and submit their final scores to the Fest Committee.
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
              <Award size={14} />
              Evaluation Panel
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              Judge Committee Dashboard
            </h1>

            <p className="text-slate-500 text-sm mt-1">
              Evaluate performances, assign marks, and submit final results.
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
                Assigned Programs
              </p>
              <div className="p-2 rounded-xl bg-[#E6F1F2] text-[#0B3F46]">
                <ClipboardList size={19} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
              {assignedPrograms.length}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Programs assigned to you</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Evaluation
              </p>
              <div className="p-2 rounded-xl bg-[#FFF3D6] text-[#B7791F]">
                <Clock size={19} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-[#B7791F] font-['Bricolage_Grotesque']">
              {assignedPrograms.length - completedPrograms}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Awaiting completion</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Completed
              </p>
              <div className="p-2 rounded-xl bg-[#E6F5EC] text-emerald-600">
                <CheckCircle2 size={19} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-600 font-['Bricolage_Grotesque']">
              {completedPrograms}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Completed evaluations</p>
          </div>
        </section>

        <div className="space-y-8">

          {/* Assigned Programs */}
          <section className="bg-white border border-slate-200 p-5 sm:p-7 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#FFF3D6] text-[#B7791F] p-2.5 rounded-xl">
                <Award size={21} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0B3F46] font-['Bricolage_Grotesque']">
                  Your Assigned Programs
                </h2>
                <p className="text-xs text-slate-400">
                  Programs scheduled for your evaluation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {assignedPrograms.map((prog) => (
                <div
                  key={prog.id}
                  className="bg-[#F5F8F8] border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-[#F5A623] transition"
                >
                  <div>
                    <h3 className="font-bold text-[#0B3F46] text-sm">
                      {prog.programName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#D6336C]" />
                      {prog.venue}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit px-3 py-1.5 rounded-full text-[11px] font-bold ${
                      prog.status === 'Completed'
                        ? 'bg-[#E6F5EC] text-emerald-700'
                        : 'bg-[#FFF3D6] text-[#B7791F]'
                    }`}
                  >
                    {prog.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Scorecard */}
          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-[#E6F1F2] text-[#0B3F46] p-2 rounded-lg">
                    <ClipboardList size={18} />
                  </div>
                  <h3 className="font-extrabold text-[#0B3F46] text-lg font-['Bricolage_Grotesque']">
                    Contestant Scorecard
                  </h3>
                </div>
                <span className="text-xs text-[#D6336C] font-bold">
                  Program: Classical Dance (Solo)
                </span>
              </div>

              <button
                onClick={handleSubmitScorecard}
                className="inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#FFB83D] text-[#072C31] px-5 py-3 rounded-xl text-xs font-extrabold transition shadow-md shadow-[#F5A623]/20"
              >
                <Send size={16} />
                Submit Final Results
              </button>
            </div>

            <form onSubmit={handleSubmitScorecard}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#F5F8F8] text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="p-4 font-bold">Chest No</th>
                      <th className="p-4 font-bold">Participant Name & Unit</th>
                      <th className="p-4 font-bold">Marks / Score (100)</th>
                      <th className="p-4 font-bold">Assigned Rank</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-sm">
                    {contestants.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F5F8F8]/70 transition"
                      >
                        <td className="p-4 font-mono text-[#D6336C] font-bold">
                          {item.chestNo}
                        </td>

                        <td className="p-4 font-bold text-[#0B3F46]">
                          {item.participantName}
                        </td>

                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            placeholder="e.g. 85"
                            value={item.score}
                            onChange={(e) =>
                              handleScoreChange(item.id, 'score', e.target.value)
                            }
                            className="bg-[#F5F8F8] border border-slate-200 rounded-xl px-3 py-2.5 text-[#0B3F46] text-sm w-32 font-mono focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                            required
                          />
                        </td>

                        <td className="p-4">
                          <select
                            value={item.rank}
                            onChange={(e) =>
                              handleScoreChange(item.id, 'rank', e.target.value)
                            }
                            className="bg-[#F5F8F8] border border-slate-200 rounded-xl px-3 py-2.5 text-[#0B3F46] text-sm w-36 focus:outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition"
                            required
                          >
                            <option value="">Select Rank</option>
                            <option value="1st Place">1st Place</option>
                            <option value="2nd Place">2nd Place</option>
                            <option value="3rd Place">3rd Place</option>
                            <option value="A Grade">A Grade</option>
                            <option value="B Grade">B Grade</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <p className="text-xs text-slate-400">
                  Enter a score and rank for each contestant before submitting.
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-[#0B3F46] hover:bg-[#072C31] text-white px-5 py-3 rounded-xl text-xs font-bold transition"
                >
                  <Save size={15} />
                  Save Scorecard
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs text-slate-400">
          CampusFest Judge Committee • Evaluation Panel
        </footer>
      </main>
    </div>
  );
}
