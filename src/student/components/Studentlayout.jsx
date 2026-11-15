import React from 'react';
import Studentsidebar from './Studentsidebar';

export default function Studentlayout({
  activeTab,
  onSelect,
  navItems,
  badges,
  student,
  onEmergencyCall,
  children,
}) {
  return (
    <div className="fest-body flex min-h-screen flex-col bg-[#F5F8F8] text-slate-800 md:flex-row">
      <Studentsidebar
        activeTab={activeTab}
        onSelect={onSelect}
        navItems={navItems}
        badges={badges}
        student={student}
        onEmergencyCall={onEmergencyCall}
      />
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}