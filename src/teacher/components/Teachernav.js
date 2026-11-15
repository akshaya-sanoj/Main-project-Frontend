import { BadgeCheck, Users, IndianRupee, ClipboardList } from 'lucide-react';

export const TEACHER_HOME_PATH = '/teacher';

export const getTeacherNavItems = ({ isClassTeacher, hasProgramDuty, committeeCount }) => {
  const items = [];
  if (isClassTeacher) {
    items.push({ id: 'approvals', label: 'Student Approvals', icon: Users, badgeKey: 'approvals' });
    items.push({ id: 'fund', label: 'Class Fund', icon: IndianRupee });
  }
  if (hasProgramDuty) {
    items.push({ id: 'programs', label: 'Program Data Entry', icon: ClipboardList });
  }
  if (committeeCount > 0) {
    items.push({ id: 'committee', label: 'Committee Duties', icon: BadgeCheck, badgeKey: 'committee' });
  }
  return items;
};