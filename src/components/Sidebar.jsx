import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function Sidebar({ navItems, activeTab, setActiveTab, setTeacherError, setTeacherNotice, coordinator, dept }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#072C31] p-6 text-white md:flex">
      <div>
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="fest-display text-lg font-extrabold">CampusFest</h2>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F5A623]">
              Coordinator Portal
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold text-white">
            {coordinator?.name || 'Department Coordinator'}
          </p>
          <p className="mt-1 text-[10px] text-[#F5A623]">Dept: {dept}</p>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setTeacherError('');
                setTeacherNotice('');
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                activeTab === id
                  ? 'bg-[#F5A623] font-bold text-[#2A1A00] shadow-lg'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 pt-5">
        <Link
          to="/login"
          onClick={() => localStorage.removeItem('fest_user')}
          className="text-sm font-semibold text-[#F5A623] hover:text-white"
        >
          ← Sign Out
        </Link>
      </div>
    </aside>
  );
}