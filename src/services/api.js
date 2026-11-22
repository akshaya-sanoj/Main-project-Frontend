export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function authHeaders() {
  try {
    const saved = JSON.parse((sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user')) || 'null');
    return saved?.token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${saved.token}` }
      : { 'Content-Type': 'application/json' };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

export async function loginUser({ query, password }) {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Incorrect password or credentials.');
    }

    if (data.rejected === true) {
      throw new Error('Your account registration was rejected.');
    }

    if (data.approved === false) {
      throw new Error('Your account is pending administrator approval.');
    }

    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to login.');
  }
}

export async function registerUser(payload) {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed.');
    }
    return data;
  } catch (err) {
    throw new Error(err.message || 'Registration failed.');
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}