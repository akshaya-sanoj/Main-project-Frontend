import React from 'react';
import AdminSidebar from '../../admin/components/Adminsidebar';

/**
 * Wrap any admin page in this to get the shared sidebar.
 *
 * <AdminLayout activeTab="submissions" badges={{ submissions: 1 }}>
 *   ...page content...
 * </AdminLayout>
 */
export default function AdminLayout({ activeTab, onSelect, badges, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8F8] text-slate-800 md:flex-row">
      <AdminSidebar activeTab={activeTab} onSelect={onSelect} badges={badges} />
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}