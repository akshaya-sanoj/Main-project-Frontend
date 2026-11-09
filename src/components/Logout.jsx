// src/components/Logout.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear all session storage / fest user data
    localStorage.removeItem('fest_user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('coord_assignments');
    localStorage.removeItem('coord_funds');
    localStorage.removeItem('coord_volunteers');

    // Redirect to login page immediately
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8F8] text-slate-800">
      <p className="text-sm font-semibold">Signing out of CampusFest...</p>
    </div>
  );
}