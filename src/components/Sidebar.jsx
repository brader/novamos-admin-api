'use client'
import { useState } from "react";
import Image from "next/image";
import dasborIcon from "../assett/dasborIcon.png";
import pesananIcon from "../assett/pesananIcon.png";
import produkIcon from "../assett/produkIcon.png";
import voucherIcon from "../assett/voucherIcon.png";
import kategoriIcon from "../assett/kategoriIcon.png";
import penggunaIcon from "../assett/penggunaIcon.png";
import beritaIcon from "../assett/beritaIcon.png";
import adminIcon from "../assett/adminIcon.png";
import settingIcon from "../assett/setting.png";

const MenuItem = ({ text, icon, selected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-start w-full h-[6vh] p-[1.5vw] rounded-[1vw] mb-[1vh] gap-[0.8vw] cursor-pointer ${
        selected ? "bg-[#EBEBEC]" : "bg-[#F5F5F6]"
      }`}
    >
      <div className="flex w-[2.5vw] h-[2.5vw] bg-white rounded-[1vw] justify-center items-center">
        <Image src={icon} alt="icon" className="w-[2.4vh] aspect-square" />
      </div>
      <h1 className="text-[1vw]">{text}</h1>
    </div>
  );
};

const Sidebar = ({ selectedItem, setSelectedItem }) => {
  const menuItems = [
    { text: "Dasbor", icon: dasborIcon },
    { text: "Pesanan", icon: pesananIcon },
    { text: "Produk", icon: produkIcon },
    { text: "Kategori", icon: kategoriIcon },
    { text: "Pengguna", icon: penggunaIcon },
    { text: "Voucher", icon: voucherIcon },
    { text: "Berita", icon: beritaIcon },
    { text: "Admin", icon: adminIcon },
    { text: "Setting", icon: settingIcon },
  ];

  return (
    <div className="px-[2vw] py-[2vh] flex flex-col justify-center gap-[1.5vh]">
      <div className="flex items-center justify-center">
        <h1 className="text-[2vw]">NOVAMOS</h1>
      </div>
      <div className="flex flex-col gap-[0.5vh]">
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