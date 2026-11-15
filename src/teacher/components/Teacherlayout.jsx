import React from 'react';
import Teachersidebar from './Teachersidebar';

export default function Teacherlayout({
  activeTab,
  onSelect,
  navItems,
  badges,
  teacher,
  dept,
  isClassTeacher,
  classSection,
  onEmergencyCall,
  children,
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8F8] text-[#173B40] md:flex-row font-['DM_Sans',sans-serif]">
      <Teachersidebar
        activeTab={activeTab}
        onSelect={onSelect}
        navItems={navItems}
        badges={badges}
        teacher={teacher}
        dept={dept}
        isClassTeacher={isClassTeacher}
        classSection={classSection}
        onEmergencyCall={onEmergencyCall}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-9">{children}</main>
    </div>
  );
}