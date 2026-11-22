import { Users, DollarSign, FileText, UserCheck, Shield, Send } from 'lucide-react';

export const COORDINATOR_HOME_PATH = '/coordinator';

export const COORDINATOR_NAV_ITEMS = [
  { id: 'teachers', label: 'My Teachers', icon: Users },
  { id: 'funds', label: 'Classes & Fund', icon: DollarSign },
  { id: 'classLists', label: 'Class Lists', icon: FileText, badgeKey: 'classLists' },
  { id: 'volunteers', label: 'Department Volunteers', icon: Shield },
  { id: 'submissions', label: 'Submissions to Admin', icon: Send },
];