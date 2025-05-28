'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeWrapper({ children }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    } else {
      setIsChecking(false);
    }
  }, []);

  if (isChecking) {
    return <div className="p-10 text-center">Memuat...</div>;
  }

  return <>{children}</>;
}
