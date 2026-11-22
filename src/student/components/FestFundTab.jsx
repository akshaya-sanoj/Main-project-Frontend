import React from 'react';
import { IndianRupee, CheckCircle2 } from 'lucide-react';

export default function FestFundTab({
  student,
  fundDues = [],
  startPayment,
  payBusyId,
  payMessage,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <IndianRupee size={24} />
        </div>
        <div>
          <h3 className="fest-display text-base font-bold text-[#0B3F46]">Fest Fund</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {student?.department
              ? `Set by the ${student.department} department for each fest. Pay once per fest.`
              : 'Set by your department for each fest. Pay once per fest.'}
          </p>
        </div>
      </div>

      {fundDues.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          Your department coordinator has not set a fest fund amount yet. It will appear here once it is set.
        </p>
      ) : (
        <div className="space-y-3">
          {fundDues.map((due) => (
            <div
              key={due.fest.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-sm text-[#0B3F46]">{due.fest.name}</p>
                <p className="text-xs text-slate-500">
                  Fest fund due: <span className="font-mono font-bold text-[#0E4D55]">₹{due.fund.amount}</span>
                  {due.fest.festDate ? ` · Fest on ${new Date(due.fest.festDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                </p>
              </div>

              {due.payment ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 size={16} /> Paid ₹{due.payment.amount}
                  {due.payment.paidAt ? ` · ${new Date(due.payment.paidAt).toLocaleDateString('en-IN')}` : ''}
                </span>
              ) : (
                <button
  type="button"
  disabled={payBusyId === due.fest.id}
  onClick={() => startPayment(due)}
  className="rounded-xl bg-[#0B3F46] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0E4D55] disabled:opacity-50"
>
  {payBusyId === due.fest.id ? 'Processing...' : `Pay ₹${due.fund.amount}`}
</button>
              )}
            </div>
          ))}
        </div>
      )}

      {!student?.classSection && student && fundDues.some((d) => !d.payment) && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          Your class is not set on your account, so your class teacher cannot see your payment. Please ask your department coordinator.
        </p>
      )}

      {payMessage.text && (
        <p
          role={payMessage.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border p-3 text-xs font-semibold ${
            payMessage.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          {payMessage.text}
        </p>
      )}
    </div>
  );
}