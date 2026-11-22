const STORAGE_KEY = 'fest_sos_alerts';

function readLocalAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAlerts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('fest_sos_updated'));
  } catch {
    // ignore storage errors
  }
}

export async function triggerSosAlert({ senderName, senderRole, department, classSection, location, matter }) {
  const newAlert = {
    id: `sos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sender: `${senderName || 'User'} (${senderRole || 'Member'})`,
    senderName: senderName || 'User',
    senderRole: senderRole || 'Member',
    department: department || '',
    classSection: classSection || '',
    matter: (matter || '').trim() || 'Immediate assistance requested',
    location:
      (location || '').trim() ||
      (classSection ? `${department || ''} · ${classSection}`.trim() : department || 'Campus Venue'),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
    status: 'Pending Response',
  };

  const localList = readLocalAlerts();
  writeLocalAlerts([newAlert, ...localList]);
  return newAlert;
}

export async function fetchSosAlerts() {
  return readLocalAlerts();
}

export async function resolveSosAlert(alertId) {
  const updatedLocal = readLocalAlerts().map((a) =>
    String(a.id) === String(alertId) ? { ...a, status: 'Resolved & Attended' } : a
  );
  writeLocalAlerts(updatedLocal);
}