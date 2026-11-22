import { normalizeDept } from './deptKeys';

const sameId = (a, b) => String(a) === String(b);

export function buildFestFeeSummary({ fests = [], deptFunds = [], payments = [], users = [], remittances = [] }) {
  const students = users.filter((u) => u.baseType === 'student' && u.approved !== false && !u.rejected);
  const paidPayments = payments.filter((p) => p.status === 'paid');

  return fests.map((fest) => {
    const festFunds = deptFunds.filter((f) => sameId(f.festId, fest.id));
    const festPayments = paidPayments.filter((p) => sameId(p.festId, fest.id));
    const festRemittances = remittances.filter((r) => sameId(r.festId, fest.id));

    // Group by department
    const deptMap = {};

    festFunds.forEach((fund) => {
      const key = fund.deptKey || normalizeDept(fund.department);
      deptMap[key] = {
        deptKey: key,
        department: fund.department || key.toUpperCase(),
        feePerStudent: Number(fund.amount || 0),
        totalStudents: 0,
        paidStudents: 0,
        collectedAmount: 0,
        expectedAmount: 0,
        remittedAmount: 0,
        classes: {},
      };
    });

    students.forEach((stu) => {
      const key = normalizeDept(stu.department || '');
      if (!deptMap[key]) return;
      const cls = stu.classSection || 'Unassigned';

      deptMap[key].totalStudents += 1;
      deptMap[key].expectedAmount += deptMap[key].feePerStudent;

      if (!deptMap[key].classes[cls]) {
        deptMap[key].classes[cls] = {
          classSection: cls,
          totalStudents: 0,
          paidStudents: 0,
          collectedAmount: 0,
          remittance: null,
        };
      }
      deptMap[key].classes[cls].totalStudents += 1;
    });

    festPayments.forEach((pay) => {
      const key = pay.deptKey || normalizeDept(pay.department || '');
      if (!deptMap[key]) return;
      const cls = pay.classSection || 'Unassigned';

      deptMap[key].paidStudents += 1;
      deptMap[key].collectedAmount += Number(pay.amount || 0);

      if (!deptMap[key].classes[cls]) {
        deptMap[key].classes[cls] = {
          classSection: cls,
          totalStudents: 0,
          paidStudents: 0,
          collectedAmount: 0,
          remittance: null,
        };
      }
      deptMap[key].classes[cls].paidStudents += 1;
      deptMap[key].classes[cls].collectedAmount += Number(pay.amount || 0);
    });

    festRemittances.forEach((rem) => {
      const key = rem.deptKey || normalizeDept(rem.department || '');
      if (!deptMap[key]) return;
      const cls = rem.classSection || 'Unassigned';
      deptMap[key].remittedAmount += Number(rem.amount || 0);
      if (deptMap[key].classes[cls]) {
        deptMap[key].classes[cls].remittance = rem;
      }
    });

    const departments = Object.values(deptMap).map((d) => ({
      ...d,
      classes: Object.values(d.classes).sort((a, b) => a.classSection.localeCompare(b.classSection)),
    }));

    return {
      fest,
      departments,
      totalCollected: departments.reduce((sum, d) => sum + d.collectedAmount, 0),
      totalExpected: departments.reduce((sum, d) => sum + d.expectedAmount, 0),
      totalPaidStudents: departments.reduce((sum, d) => sum + d.paidStudents, 0),
      totalStudents: departments.reduce((sum, d) => sum + d.totalStudents, 0),
    };
  });
}