const DEPT_ALIASES = {
  cse: 'cse',
  'computer science': 'cse',
  'computer science (cse)': 'cse',
  'computer science and engineering': 'cse',
  aiml: 'aiml',
  ece: 'ece',
  electronics: 'ece',
  'electronics (ece)': 'ece',
  eee: 'eee',
  ce: 'ce',
  civil: 'ce',
  me: 'me',
  mechanical: 'me',
  'mechanical engineering': 'me',
  'mechanical engineering (me)': 'me',
};

export const normalizeDept = (d) => {
  const raw = (d || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (DEPT_ALIASES[raw]) return DEPT_ALIASES[raw];

  const match = raw.match(/\(([^)]+)\)\s*$/);
  if (match) return match[1].trim();

  return encodeURIComponent(raw);
};

export const rosterKey = (d) => `coord_pending_rosters_${normalizeDept(d)}`;
export const adminSubmittedKey = (d) => `coord_submitted_to_admin_${normalizeDept(d)}`;
export const adminSubmissionsKey = (d) => `admin_department_submissions_${normalizeDept(d)}`;
export const fundSubmissionsKey = (dept) => `coord_fund_submissions_${normalizeDept(dept)}`;