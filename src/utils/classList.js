// Helpers for class lists (register numbers, names, dates of birth).
// Put this file at src/utils/classList.js

// Compare register numbers while ignoring case, spaces and symbols
export const normReg = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Run many requests a few at a time, so a long class list does not flood the server
export const inChunks = async (items, fn, size = 15) => {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
};

// Dates of birth are never stored as plain text. The class list keeps only this fingerprint
// (a SHA-256 of register number + date). Register.jsx must use exactly the same code.
export const hashDob = async (regNo, dobIso) => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('The date of birth check needs a secure page (https or localhost).');
  }
  const data = new TextEncoder().encode(`${String(regNo || '').toLowerCase().replace(/[^a-z0-9]/g, '')}|${dobIso}`);
  const buf = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Turn a date like 05/03/2004, 5-3-2004, 5.3.2004 or 2004-03-05 into 2004-03-05 (day first when written with slashes)
export const normalizeDob = (raw) => {
  const t = String(raw || '').trim();
  if (!t) return '';
  let y;
  let m;
  let d;
  let mm = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (mm) {
    y = +mm[1]; m = +mm[2]; d = +mm[3];
  } else {
    mm = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (!mm) return '';
    d = +mm[1]; m = +mm[2]; y = +mm[3];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return '';
  if (y < 1950 || y > new Date().getFullYear()) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

// Read a class list from CSV text, or from rows pasted out of Excel.
// Columns: Register No, Name, Date of Birth (date optional). A header row is optional.
export const parseClassList = (text) => {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { rows: [], duplicates: 0, withDob: 0, badDob: 0 };

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const split = (line) => line.split(delimiter).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim());

  let table = lines.map(split);
  let regCol = 0;
  let nameCol = 1;
  let dobCol = 2;

  const headerCells = table[0].map((c) => c.toLowerCase());
  const looksLikeHeader = headerCells.some((c) => /^(reg|register|roll|admission|name|student|s\.?no|sl|dob|date|birth)/.test(c));
  if (looksLikeHeader) {
    const r = headerCells.findIndex((c) => /(reg|roll|admission|\bid\b)/.test(c));
    const n = headerCells.findIndex((c) => /name/.test(c));
    const d = headerCells.findIndex((c) => /(dob|birth|date)/.test(c));
    if (r >= 0) regCol = r;
    if (n >= 0) nameCol = n;
    else if (regCol === 0) nameCol = 1;
    dobCol = d; // -1 when the file has no date of birth column
    table = table.slice(1);
  }

  const seen = new Set();
  const rows = [];
  let duplicates = 0;
  let withDob = 0;
  let badDob = 0;
  table.forEach((cells) => {
    const registerNo = (cells[regCol] || '').trim();
    const name = (cells[nameCol] || '').trim();
    if (!registerNo) return;
    const key = normReg(registerNo);
    if (!key) return;
    if (seen.has(key)) {
      duplicates += 1;
      return;
    }
    seen.add(key);
    const dobRaw = dobCol >= 0 ? (cells[dobCol] || '').trim() : '';
    const dob = normalizeDob(dobRaw);
    if (dob) withDob += 1;
    else if (dobRaw) badDob += 1;
    rows.push({ registerNo, name, dob });
  });
  return { rows, duplicates, withDob, badDob };
};

// What the registration check found for a student, shown to whoever approves them
export const LIST_CHECK = {
  dob_mismatch: { text: 'On the class list, but the date of birth did not match. Check carefully.', tone: 'bg-rose-50 text-rose-700' },
  other_class: { text: "Register number is on another class's list.", tone: 'bg-amber-50 text-amber-800' },
  not_on_list: { text: 'Not on the class list.', tone: 'bg-slate-100 text-slate-500' },
  unchecked: { text: 'Date of birth could not be checked.', tone: 'bg-slate-100 text-slate-500' },
};