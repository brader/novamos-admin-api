'use client';

import Body from "@/components/Body";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import HomeWrapper from "@/components/HomeWrapper";

export default function Home() {
  const [selectedItem, setSelectedItem] = useState("Dasbor");

  return (
    <HomeWrapper>
      <div className="flex flex-row">
        <div className="w-[20vw]">
          <Sidebar selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
        </div>
        <div className="w-[80vw]">
          <Body selected={selectedItem} />
        </div>
      </div>
    </HomeWrapper>
  );
}
