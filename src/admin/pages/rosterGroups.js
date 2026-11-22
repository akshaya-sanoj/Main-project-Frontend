// Helpers for Lists that department coordinators forwarded to the admin.
// A forwarded List is a /registrations record with status "Forwarded to Admin".

export const isForwarded = (r) => r.status === 'Forwarded to Admin';

// One entry per fest, for the cards on the Department Submissions tab.
export function groupByFest(regs) {
  const map = new Map();
  regs.filter(isForwarded).forEach((r) => {
    const key = String(r.festId);
    const f = map.get(key) || {
      festId: r.festId,
      festName: r.festName || 'Fest',
      departments: new Set(),
      students: new Set(),
      entries: 0,
      latest: '',
    };
    f.departments.add(r.deptKey);
    f.students.add(String(r.studentId));
    f.entries += 1;
    if (String(r.forwardedAt || '') > f.latest) f.latest = String(r.forwardedAt || '');
    map.set(key, f);
  });
  return [...map.values()].map((f) => ({
    ...f,
    departmentCount: f.departments.size,
    studentCount: f.students.size,
  }));
}

// One entry per department inside a fest, each with its teachers and their participants.
export function groupDepartments(regs, festId) {
  const byDept = {};
  regs
    .filter((r) => isForwarded(r) && String(r.festId) === String(festId))
    .forEach((r) => {
      const d = (byDept[r.deptKey] = byDept[r.deptKey] || {
        deptKey: r.deptKey,
        department: r.teacherDept || r.deptKey,
        coordinatorName: r.forwardedBy || 'Coordinator',
        forwardedAt: r.forwardedAt,
        teachers: {},
      });
      if (String(r.forwardedAt || '') > String(d.forwardedAt || '')) d.forwardedAt = r.forwardedAt;
      const t = (d.teachers[r.teacherId] = d.teachers[r.teacherId] || { teacherName: r.teacherName, participants: [] });
      t.participants.push(r);
    });
  return Object.values(byDept).map((d) => ({ ...d, teachers: Object.values(d.teachers) }));
}

export const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');