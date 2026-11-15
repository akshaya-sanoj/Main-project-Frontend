import { IndianRupee, ShieldAlert, Calendar, Radio } from 'lucide-react';

export const STUDENT_HOME_PATH = '/student';

export const getStudentNavItems = ({ hasFundDues, hasAssignedDuty, hasPrograms }) => {
  const items = [
    { id: 'fund', label: 'Fest Fund', icon: IndianRupee, badgeKey: 'fund' },
  ];
  if (hasAssignedDuty) {
    items.push({ id: 'duty', label: 'Duty Notice', icon: ShieldAlert });
  }
  if (hasPrograms) {
    items.push({ id: 'programs', label: 'My Programs', icon: Calendar, badgeKey: 'programs' });
  }
  items.push({ id: 'live', label: 'Live Stage Status', icon: Radio });
  return items;
};