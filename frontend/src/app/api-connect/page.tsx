"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { APIConnect } from "@/components/APIConnect";
import { useState } from "react";

export default function APIConnectPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab="api-connect"
        onTabChange={() => {}} // Navigation handled by Next.js router
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-6">
          <APIConnect />
        </main>
      </div>
    </div>
  );
}
