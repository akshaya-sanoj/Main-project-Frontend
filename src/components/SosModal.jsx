import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, X, Send } from 'lucide-react';

const QUICK_MATTERS = [
  'Medical / First Aid needed',
  'Stage / Crowd control support',
  'Audio / Technical issue',
  'Participant assistance',
];

export default function SosModal({ open, onClose, onSubmit, defaultLocation = '' }) {
  const [matter, setMatter] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setMatter('');
      setLocation(defaultLocation);
      setError('');
    }
  }, [open, defaultLocation]);

  if (!open) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!matter.trim()) {
      setError('Please describe the emergency matter.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter the exact location where the volunteer should come.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await onSubmit({ matter: matter.trim(), location: location.trim() });
      onClose();
    } catch {
      setError('Could not send SOS alert. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#FCE7EF] p-2.5 text-[#D6336C]">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0B3F46]">Emergency SOS Alert</h3>
              <p className="text-xs text-slate-500">Dispatch the Volunteer Squad immediately</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close SOS modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
            {error}
          </p>
        )}

        <form onSubmit={handleSend} className="mt-5 space-y-4">
          <div>
            <label htmlFor="sosMatter" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Emergency Matter
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_MATTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMatter(item)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    matter === item
                      ? 'bg-[#D6336C] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <textarea
              id="sosMatter"
              rows={2}
              placeholder="Describe what happened or what help is needed..."
              value={matter}
              onChange={(e) => setMatter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#D6336C] focus:ring-2 focus:ring-[#D6336C]/15"
            />
          </div>

          <div>
            <label htmlFor="sosLocation" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Location (Where the volunteer should come)
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3 text-[#D99416]" />
              <input
                id="sosLocation"
                type="text"
                placeholder="e.g. Main Auditorium Stage 1, Green Room 2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-800 outline-none focus:border-[#0B3F46] focus:ring-2 focus:ring-[#0B3F46]/15"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D6336C] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#B82558] disabled:opacity-60"
            >
              <Send size={14} />
              {sending ? 'Sending...' : 'Send SOS Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}