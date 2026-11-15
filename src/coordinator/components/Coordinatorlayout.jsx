import React from 'react';
import Coordinatorsidebar from './Coordinatorsidebar';

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
.fest-display { font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif; }
.fest-body { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
`;

export default function Coordinatorlayout({ activeTab, onSelect, badges, coordinator, dept, children }) {
  return (
    <div className="fest-body flex min-h-screen flex-col bg-[#F5F8F8] text-slate-800 md:flex-row">
      <style>{FONT_CSS}</style>
      <Coordinatorsidebar
        activeTab={activeTab}
        onSelect={onSelect}
        badges={badges}
        coordinator={coordinator}
        dept={dept}
      />
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}