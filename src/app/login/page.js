'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/v1/login', {
        username,
        password,
      });

      const data = res.data;

      if (data.success) {
        // ✅ Simpan ke localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('image', data.image || '');

        router.push('/');
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Terjadi kesalahan saat login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold text-center">Login Admin</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input
          className="w-full mb-4 px-4 py-2 border rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full mb-4 px-4 py-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
}
