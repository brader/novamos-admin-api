'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import dasborIcon from '../assett/dasborIcon.png';
import pesananIcon from '../assett/pesananIcon.png';
import produkIcon from '../assett/produkIcon.png';
import voucherIcon from '../assett/voucherIcon.png';
import kategoriIcon from '../assett/kategoriIcon.png';
import penggunaIcon from '../assett/penggunaIcon.png';
import beritaIcon from '../assett/beritaIcon.png';
import adminIcon from '../assett/adminIcon.png';
import settingIcon from '../assett/setting.png';

const MenuItem = ({ text, icon, selected, onClick, isImage = false }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-start w-full h-[6vh] p-[1.5vw] rounded-[1vw] mb-[1vh] gap-[0.8vw] cursor-pointer ${
        selected ? 'bg-[#EBEBEC]' : 'bg-[#F5F5F6]'
      }`}
    >
      <div className="flex w-[2.5vw] h-[2.5vw] bg-white rounded-[1vw] justify-center items-center overflow-hidden">
        {isImage ? (
          <Image src={icon} alt="profile" width={32} height={32} className="rounded-full object-cover w-full h-full" />
        ) : (
          <Image src={icon} alt="icon" className="w-[2.4vh] aspect-square" />
        )}
      </div>
      <h1 className="text-[1vw] truncate">{text}</h1>
    </div>
  );
};

const Sidebar = ({ selectedItem, setSelectedItem }) => {
  const [username, setUsername] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username') || 'Admin';
    const storedImage = localStorage.getItem('image') || '/default-profile.png'; // fallback jika kosong
    setUsername(storedUsername);
    setImage(storedImage);
  }, []);

  const menuItems = [
    { text: 'Dasbor', icon: dasborIcon },
    { text: 'Pesanan', icon: pesananIcon },
    { text: 'Produk', icon: produkIcon },
    { text: 'Kategori', icon: kategoriIcon },
    { text: 'Pengguna', icon: penggunaIcon },
    { text: 'Voucher', icon: voucherIcon },
    { text: 'Berita', icon: beritaIcon },
    { text: 'Admin', icon: adminIcon },
    { text: 'Setting', icon: settingIcon },
  ];

  return (
    <div className="px-[2vw] py-[2vh] flex flex-col justify-center gap-[1.5vh]">
      <div className="flex items-center justify-center mb-2">
        <h1 className="text-[2vw] font-bold">NOVAMOS</h1>
      </div>

      {/* 🔵 Tambahkan profil admin */}
      <MenuItem
        text={username}
        icon={image}
        selected={selectedItem === username}
        onClick={() => setSelectedItem("Profile")}
        isImage
      />

      {/* 🔹 Menu utama */}
      <div className="flex flex-col gap-[0.5vh] mt-[1vh]">
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            text={item.text}
            icon={item.icon}
            selected={selectedItem === item.text}
            onClick={() => setSelectedItem(item.text)}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
