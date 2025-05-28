'use client';

import { useRouter } from 'next/navigation';

const SettingDashboard = () => {
  const router = useRouter();

  const handleLogout = () => {
    // Remove token or any session data from localStorage
    localStorage.removeItem('token');

    // Redirect to login page
    router.push('/login');
  };

  return (
    <div className="p-10">
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-md"
      >
        Logout
      </button>
    </div>
  );
};

export default SettingDashboard;
