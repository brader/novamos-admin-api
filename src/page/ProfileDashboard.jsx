'use client';
import { useEffect, useState } from 'react';

const ProfileDashboard = () => {
  const [username, setUsername] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username') || 'Admin';
    const storedImage = localStorage.getItem('image') || '/default-profile.png';
    setUsername(storedUsername);
    setImage(storedImage);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Profil Admin</h2>
        <img
          src={image}
          alt="Foto Profil"
          className="w-32 h-32 mx-auto rounded-full object-cover border mb-4"
        />
        <p className="text-lg font-semibold">Username:</p>
        <p className="text-gray-700 text-xl">{username}</p>
      </div>
    </div>
  );
};

export default ProfileDashboard;
