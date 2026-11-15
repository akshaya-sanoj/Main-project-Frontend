import {
  CalendarDays,
  ClipboardList,
  Users,
  ClipboardCheck,
  UserCheck,
  Send,
  DollarSign,
} from 'lucide-react';

// Change this if your admin dashboard lives on a different route
export const ADMIN_HOME_PATH = '/admin';

// `id` must match the tab ids your AdminDashboard already uses.
// `badgeKey` links an item to a count passed in the `badges` prop.
export const ADMIN_NAV_ITEMS = [
  { id: 'fests', label: 'Manage Fests & Committees', icon: CalendarDays },
  { id: 'programs', label: 'Programs', icon: ClipboardList },
  { id: 'coordinators', label: 'Assign Coordinators', icon: Users },
  { id: 'staff', label: 'Staff List', icon: ClipboardCheck },
  { id: 'approvals', label: 'Pending Approvals', icon: UserCheck, badgeKey: 'approvals' },
  { id: 'submissions', label: 'Department Submissions', icon: Send, badgeKey: 'submissions' },
  { id: 'funds', label: 'Funds, Participation & Leaderboards', icon: DollarSign },
];