"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AdminDashboard from "@/components/admin-dashboard";
import ConsumerInterface from "@/components/consumer-interface";
import TrackingSystem from "@/components/tracking-system";
import LoginView from "@/components/login-view";
import SettingsView from "@/components/settings-view";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface User {
  name: string;
  role: string;
  id: string;
}

export default function CouponSystem() {
  const [activeView, setActiveView] = useState<
    "admin" | "consumer" | "tracking" | "settings"
  >("admin");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved session on mount
    const savedUser = localStorage.getItem("currentUser");
    const savedView = localStorage.getItem("activeView");

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    if (savedView) {
      setActiveView(
        savedView as "admin" | "consumer" | "tracking" | "settings"
      );
    }
    setLoading(false);
  }, []);

  // Save active view changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("activeView", activeView);
    }
  }, [activeView, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    // Always open Dashboard after login
    setActiveView("admin");
    localStorage.setItem("activeView", "admin");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView("admin");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("activeView");
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#94a3b8_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/60 z-30 flex-col shadow-xl shadow-slate-200/40">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-red-500/20 flex-shrink-0">
            <Image
              src="/favicon.jpg"
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">
            Reward System
          </span>
        </div>

        {/* User Info */}
        <div className="px-4 py-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-slate-800 text-sm truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveView("admin")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
              activeView === "admin"
                ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard
              className={`w-5 h-5 ${
                activeView === "admin"
                  ? "text-red-500"
                  : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            Dashboard
          </button>

          <button
            onClick={() => setActiveView("tracking")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
              activeView === "tracking"
                ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <BarChart3
              className={`w-5 h-5 ${
                activeView === "tracking"
                  ? "text-red-500"
                  : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            Tracking
          </button>

          <button
            onClick={() => setActiveView("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
              activeView === "settings"
                ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings
              className={`w-5 h-5 ${
                activeView === "settings"
                  ? "text-red-500"
                  : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            Settings
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 gap-3 px-4"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
          <p className="text-center text-[10px] text-slate-300 mt-4">
            Powered by Botivate
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative z-0">
        {/* Mobile Header - Glassmorphism & Premium Feel */}
        <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 flex-shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-red-500/20 ring-2 ring-white">
              <Image
                src="/favicon.jpg"
                alt="Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-lg">
              Reward System
            </span>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-[280px] bg-white border-r border-slate-100"
            >
              <div className="h-full flex flex-col">
                {/* Drawer Header - User Profile Banner */}
                <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 pt-10 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white/30 shadow-inner">
                      {currentUser?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none mb-1">
                        {currentUser?.name}
                      </p>
                      <p className="text-red-100 text-xs font-medium uppercase tracking-wider bg-red-800/30 px-2 py-0.5 rounded-full inline-block">
                        {currentUser?.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                  <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Menu
                  </p>
                  <button
                    onClick={() => setActiveView("admin")}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      activeView === "admin"
                        ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <LayoutDashboard
                      className={`w-5 h-5 ${
                        activeView === "admin"
                          ? "text-red-500"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    Dashboard
                  </button>

                  <button
                    onClick={() => setActiveView("tracking")}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      activeView === "tracking"
                        ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <BarChart3
                      className={`w-5 h-5 ${
                        activeView === "tracking"
                          ? "text-red-500"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    Tracking
                  </button>

                  <button
                    onClick={() => setActiveView("settings")}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      activeView === "settings"
                        ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Settings
                      className={`w-5 h-5 ${
                        activeView === "settings"
                          ? "text-red-500"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    Settings
                  </button>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 gap-3 px-4 h-11"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {activeView === "admin" && <AdminDashboard />}
            {activeView === "consumer" && <ConsumerInterface />}
            {activeView === "tracking" && <TrackingSystem />}
            {activeView === "settings" && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
}
