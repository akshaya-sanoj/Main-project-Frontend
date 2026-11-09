const API_BASE = 'http://localhost:3000';

export async function loginUser({ query, password }) {
  try {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) {
      throw new Error('Failed to connect to JSON server.');
    }

    const users = await response.json();
    const searchTerm = query.trim().toLowerCase();

    const matchedUser = users.find(
      (u) => 
        (u.email && u.email.toLowerCase() === searchTerm) || 
        (u.staffId && u.staffId.toLowerCase() === searchTerm) ||
        (u.registerNo && u.registerNo.toLowerCase() === searchTerm)
    );

    if (!matchedUser) {
      throw new Error('No account found with this ID, Email, or Register Number.');
    }

    if (matchedUser.approved === false) {
      throw new Error('Your account is pending administrator approval.');
    }

    if (matchedUser.password && matchedUser.password !== password) {
      throw new Error('Incorrect password or credentials.');
    }

    return matchedUser;
  } catch (err) {
    throw new Error(err.message || 'Failed to login.');
  }
}