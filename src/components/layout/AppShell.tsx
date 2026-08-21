import React from 'react';
import { SideNavBar } from './SideNavBar';
import { TopAppBar } from './TopAppBar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Side Navigation Bar */}
      <SideNavBar />

      {/* Main Container */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative overflow-x-hidden">
        {/* Top Header */}
        <TopAppBar />

        {/* Scrollable Canvas View */}
        <main className="flex-1 p-4 md:p-6 bg-slate-50 w-full max-w-[1440px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
