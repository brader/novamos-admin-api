'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SettingDashboard = () => {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [expeditions, setExpeditions] = useState({
    JNE: false,
    JNT: false,
    SiCepat: false,
    Antaraja: false,
    Tiki: false,
    Wahana: false,
    Ninja: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch current settings
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/v1/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.warehousePostalCode) {
            setPostalCode(data.warehousePostalCode);
          }
          if (data.accountNumber) {
            setAccountNumber(data.accountNumber);
          }
          if (data.bankName) {
            setBankName(data.bankName);
          }
          if (data.availableExpeditions) {
            setExpeditions(data.availableExpeditions);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleExpeditionChange = (expedition) => {
    setExpeditions(prev => ({
      ...prev,
      [expedition]: !prev[expedition]
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehousePostalCode: postalCode,
          accountNumber: accountNumber,
          bankName: bankName,
          availableExpeditions: expeditions
        }),
      });

      if (response.ok) {
        alert('Pengaturan berhasil disimpan!');
      } else {
        throw new Error('Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return <div className="p-10">Memuat pengaturan...</div>;
  }

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Lokasi Gudang Pengiriman</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Masukkan kode pos gudang"
            className="border rounded px-3 py-2 w-64"
            maxLength={5}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Informasi Bank</h2>
        <div className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="bankName" className="mb-1">Nama Bank</label>
            <input
              type="text"
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Contoh: BCA, Mandiri, BRI"
              className="border rounded px-3 py-2 w-full md:w-64"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="accountNumber" className="mb-1">Nomor Rekening</label>
            <input
              type="text"
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Masukkan nomor rekening"
              className="border rounded px-3 py-2 w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Ekspedisi Tersedia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(expeditions).map((expedition) => (
            <div key={expedition} className="flex items-center">
              <input
                type="checkbox"
                id={expedition}
                checked={expeditions[expedition]}
                onChange={() => handleExpeditionChange(expedition)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={expedition} className="ml-2">
                {expedition}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default SettingDashboard;