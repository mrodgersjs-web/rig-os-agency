import type { ReactNode } from "react";
import Sidebar, { MobileNav } from "./Sidebar";
import TopBar from "./TopBar";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8">
          <TopBar />
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
