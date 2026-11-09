
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils, Plus, CheckCircle2, Trash2,
  Users, Trophy, Ticket, ClipboardList
} from 'lucide-react';

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
.fest-display {
  font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
}
.fest-body {
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
}
`;

export default function FoodDashboard() {
  const [activeTab, setActiveTab] = useState('coupons');

  const [coupons, setCoupons] = useState([
    {
      id: 1,
      recipient: 'Computer Science Dept (Delegation)',
      count: 65,
      mealType: 'Lunch & Refreshments',
      status: 'Issued'
    },
    {
      id: 2,
      recipient: 'Judge Panel & Chief Guests',
      count: 12,
      mealType: 'VIP Hospitality Dining',
      status: 'Pending Collection'
    }
  ]);

  const [recipient, setRecipient] = useState('');
  const [count, setCount] = useState('');
  const [mealType, setMealType] = useState('Lunch & Refreshments');

  const handleIssueCoupons = (e) => {
    e.preventDefault();

    if (!recipient.trim() || !count || Number(count) <= 0) return;

    const newCoupon = {
      id: Date.now(),
      recipient: recipient.trim(),
      count: parseInt(count, 10),
      mealType,
      status: 'Issued'
    };

    setCoupons(prev => [...prev, newCoupon]);
    setRecipient('');
    setCount('');
  };

  const handleDeleteCoupon = (id) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const totalMealsCount = coupons.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  const pendingCount = coupons.filter(
    c => c.status === 'Pending Collection'
  ).length;

  const issuedCount = coupons.filter(
    c => c.status === 'Issued'
  ).length;

  const navItems = [
    {
      id: 'coupons',
      label: 'Coupon & Meal Management',
      icon: Utensils
    }
  ];

  const cardStyle =
    'rounded-2xl border border-slate-200 bg-white shadow-sm';

  const inputStyle =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/10';

  const primaryButton =
    'flex items-center justify-center gap-2 rounded-xl bg-[#0B3F46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0E4D55] focus:outline-none focus:ring-4 focus:ring-[#F5A623]/30';

  return (
    <div className="fest-body flex min-h-screen bg-[#F5F8F8] text-slate-800">
      <style>{FONT_CSS}</style>

      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#072C31] p-6 text-white md:flex">

        <div>
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5A623] text-[#2A1A00]">
              <Trophy className="h-5 w-5" />
            </div>

            <div>
              <h2 className="fest-display text-lg font-extrabold">
                CampusFest
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F5A623]">
                Food Committee
              </p>
            </div>
          </div>

          {/* Role Information */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">
              Food Committee
            </p>
            <p className="mt-1 text-[10px] text-[#F5A623]">
              Hospitality Desk
            </p>
          </div>

          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-white/40">
            Management
          </p>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeTab === id
                    ? 'border border-[#F5A623]/30 bg-[#F5A623] text-[#2A1A00] shadow-lg'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10 pt-5">
          <div className="mb-5 rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">
              CampusFest
            </p>
            <p className="mt-1 text-[10px] text-white/50">
              Food & Hospitality Management
            </p>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-2 text-sm font-semibold text-[#F5A623] transition hover:text-white"
          >
            ← Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">

        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D6336C]">
              <span className="h-2 w-2 rounded-full bg-[#D6336C]" />
              CampusFest Hospitality
            </div>

            <h1 className="fest-display text-2xl font-extrabold tracking-tight text-[#0B3F46] sm:text-3xl">
              Food Committee Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage meal headcounts, food coupons and VIP hospitality dining.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#0B3F46] transition hover:border-[#F5A623] hover:bg-[#FFF8E9] sm:self-auto"
          >
            ← Back to Home
          </Link>
        </header>

        {/* Mobile Navigation */}
        <div className="mb-7 md:hidden">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex w-full items-center gap-3 rounded-xl bg-[#0B3F46] px-4 py-3 text-sm font-semibold text-white"
            >
              <Icon className="h-5 w-5 text-[#F5A623]" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'coupons' && (
          <div className="space-y-8">

            {/* Summary Cards */}
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {/* Total Meals */}
              <div className={`${cardStyle} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    Total
                  </span>
                </div>

                <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">
                  {totalMealsCount}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Total Meals / Plates
                </p>
              </div>

              {/* Issued Passes */}
              <div className={`${cardStyle} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-[#E6F1F2] p-3 text-[#0B3F46]">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    Active
                  </span>
                </div>

                <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">
                  {issuedCount}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Issued Passes
                </p>
              </div>

              {/* Pending Collection */}
              <div className={`${cardStyle} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-[#FCE7EF] p-3 text-[#D6336C]">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    Awaiting
                  </span>
                </div>

                <p className="fest-display text-3xl font-extrabold text-[#0B3F46]">
                  {pendingCount}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Pending Collections
                </p>
              </div>
            </section>

            {/* Issue Coupons Form */}
            <section className={`${cardStyle} p-6 sm:p-8`}>

              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#FFF3D6] p-3 text-[#B87908]">
                  <Plus className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="fest-display text-lg font-bold text-[#0B3F46]">
                    Issue Food Coupons / Passes
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Allocate meal passes to departments, committees and guests.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleIssueCoupons}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <input
                  type="text"
                  placeholder="Recipient Unit / Dept / Committee"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className={inputStyle}
                  required
                />

                <input
                  type="number"
                  min="1"
                  placeholder="Number of Coupons / Plates"
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  className={inputStyle}
                  required
                />

                <select
                  value={mealType}
                  onChange={e => setMealType(e.target.value)}
                  className={inputStyle}
                >
                  <option value="Lunch & Refreshments">
                    Lunch & Refreshments
                  </option>
                  <option value="VIP Hospitality Dining">
                    VIP Hospitality Dining
                  </option>
                  <option value="Volunteer Packets">
                    Volunteer Packets
                  </option>
                </select>

                <button
                  type="submit"
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4 text-[#F5A623]" />
                  Issue Passes
                </button>
              </form>
            </section>

            {/* Issued Passes Roster */}
            <section className={`${cardStyle} overflow-hidden`}>

              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h3 className="fest-display font-bold text-[#0B3F46]">
                    Issued Passes Roster
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    View and manage all meal coupon allocations.
                  </p>
                </div>

                <span className="rounded-full bg-[#E6F1F2] px-3 py-1 text-xs font-bold text-[#0B3F46]">
                  {coupons.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left">

                  <thead>
                    <tr className="bg-[#F5F8F8] text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="p-4">Recipient Unit</th>
                      <th className="p-4">Pass Count</th>
                      <th className="p-4">Meal Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-sm">

                    {coupons.map(item => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-[#F5F8F8]"
                      >
                        <td className="p-4 font-semibold text-[#0B3F46]">
                          {item.recipient}
                        </td>

                        <td className="p-4 font-bold text-[#B87908]">
                          {item.count} Plates
                        </td>

                        <td className="p-4 text-slate-600">
                          {item.mealType}
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'Issued'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {item.status}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(item.id)}
                            aria-label={`Delete coupon for ${item.recipient}`}
                            className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {coupons.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-10 text-center text-sm text-slate-400"
                        >
                          No food coupons issued yet.
                        </td>
                      </tr>
                    )}

                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} CampusFest. Fest management for schools and colleges.
        </footer>

      </main>
    </div>
  );
}
