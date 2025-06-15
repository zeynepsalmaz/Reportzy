"use client";

import { useState } from "react";
import { Header } from "@/components/modern/Header";
import { Sidebar } from "@/components/modern/Sidebar";
import { ImportData } from "@/components/modern/ImportData";

export default function ImportDataPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="page-layout">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="page-content">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        
        <main className="page-main">
          <ImportData />
        </main>
      </div>
    </div>
  );
}
