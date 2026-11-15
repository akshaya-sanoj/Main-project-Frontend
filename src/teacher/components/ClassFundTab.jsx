import React from 'react';
import { IndianRupee, CheckCircle2 } from 'lucide-react';

export default function ClassFundTab({
  classSection,
  deptFund,
  fundFests = [],
  fundFestId,
  setFundFestId,
  setFundMessage,
  fundMessage,
  classStudents = [],
  paidStudents = [],
  paidPaymentOf,
  fundBusy,
  handleMarkCashPaid,
  handleUndoCash,
}) {
  return (
    <section className="bg-white border border-[#E4ECEC] rounded-3xl p-5 sm:p-7 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#E6F5EC] text-[#218653] rounded-xl flex items-center justify-center">
            <IndianRupee size={21} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#0B3F46]">Fest Fund Status · {classSection}</h2>
            <p className="text-xs text-[#718589] mt-1">Students pay from their own dashboards. This list updates by itself.</p>
          </div>
        </div>

        {deptFund && (
          <div className="text-right">
            <p className="text-xs text-[#718589]">Fund per student</p>
            <p className="font-mono text-lg font-bold text-[#0B3F46]">₹{deptFund.amount}</p>
          </div>
        )}
      </div>

      {fundFests.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
          Your department coordinator has not set a fest fund amount for any fest yet. Students cannot pay until it is set.
        </p>
      ) : (
        <>
          <div className="mb-5 max-w-xs">
            <label htmlFor="fundFest" className="block text-xs font-bold text-[#456166] mb-2">Fest</label>
            <select
              id="fundFest"
              value={fundFestId}
              onChange={(e) => {
                setFundFestId(e.target.value);
                setFundMessage({ type: '', text: '' });
              }}
              className="w-full bg-[#F5F8F8] border border-[#DCE7E7] rounded-xl px-4 py-3 text-sm text-[#173B40] outline-none focus:border-[#F5A623] transition"
            >
              {fundFests.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {fundMessage.text && (
            <p
              role={fundMessage.type === 'error' ? 'alert' : 'status'}
              className={`mb-5 rounded-xl border px-4 py-3 text-xs font-bold ${
                fundMessage.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              {fundMessage.text}
            </p>
          )}

          <div className="mb-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-[#F8FAFA] border border-[#DCE7E7] p-3">
              <p className="text-xl font-extrabold text-[#0B3F46]">{classStudents.length}</p>
              <p className="text-[11px] text-[#718589]">Students</p>
            </div>
            <div className="rounded-2xl bg-[#E6F5EC] border border-emerald-200 p-3">
              <p className="text-xl font-extrabold text-[#218653]">{paidStudents.length}</p>
              <p className="text-[11px] text-[#718589]">Paid</p>
            </div>
            <div className="rounded-2xl bg-[#FCE7EF] border border-rose-200 p-3">
              <p className="text-xl font-extrabold text-[#D6336C]">{classStudents.length - paidStudents.length}</p>
              <p className="text-[11px] text-[#718589]">Unpaid</p>
            </div>
          </div>

          {classStudents.length === 0 ? (
            <p className="p-8 text-center text-xs text-[#91A1A3]">
              No approved students in {classSection} yet. Students appear here after they register with this class and are approved.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[560px]">
                <thead>
                  <tr className="bg-[#F5F8F8] text-[#718589] text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 font-bold">Student</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF1F1]">
                  {classStudents.map((stu) => {
                    const pay = paidPaymentOf(stu.id);
                    return (
                      <tr key={stu.id} className="hover:bg-[#F8FAFA] transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-sm text-[#173B40]">{stu.name}</p>
                          <p className="text-xs text-[#718589] font-mono">Reg: {stu.registerNo || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          {pay ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E6F5EC] text-[#218653]">
                              <CheckCircle2 size={12} />
                              Paid ₹{pay.amount} · {pay.provider === 'cash' ? 'cash' : 'online'}
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FCE7EF] text-[#D6336C]">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!pay && (
                            <button
                              type="button"
                              disabled={fundBusy || !deptFund}
                              onClick={() => handleMarkCashPaid(stu)}
                              className="rounded-lg border border-[#DCE7E7] bg-white px-3 py-1.5 text-xs font-bold text-[#0B3F46] hover:bg-[#F5F8F8] disabled:opacity-50"
                            >
                              Mark paid (cash)
                            </button>
                          )}
                          {pay && pay.provider === 'cash' && (
                            <button
                              type="button"
                              disabled={fundBusy}
                              onClick={() => handleUndoCash(stu)}
                              className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#D6336C] hover:bg-[#FCE7EF] disabled:opacity-50"
                            >
                              Undo
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}