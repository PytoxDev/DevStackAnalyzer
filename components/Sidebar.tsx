'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, History, LayoutDashboard, LogOut, User, Sun, Moon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/analyzer',   label: 'Stack Analyzer',   icon: BarChart3 },
  { href: '/history',    label: 'Analysis History', icon: History },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]         = useState<SupabaseUser | null>(null);
  const [isGuest, setIsGuest]   = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setIsGuest(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('devstack_guest');
        }
      } else {
        const guestFlag = localStorage.getItem('devstack_guest') === 'true';
        setIsGuest(guestFlag);
      }
    });

    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkActive = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);

    setIsDark(darkActive);
    if (darkActive) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    localStorage.removeItem('devstack_guest');
    await supabase.auth.signOut();
    router.push('/login');
  };

  /* Derive avatar initial from email or guest */
  const initial = (!user && isGuest) ? 'G' : (user?.email ? user.email[0].toUpperCase() : null);
  const displayEmail = (!user && isGuest) ? 'Guest Session' : (user?.email ?? 'Authenticated User');

  const sidebarContent = (
    <div className="w-64 h-full flex flex-col justify-between p-6 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-900 transition-colors duration-300">
      {/* ── Top: logo + mobile close + nav ── */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Logo and Mobile Close */}
        <div className="flex items-center justify-between gap-3 mb-8 px-1">
          <div className="flex items-center gap-3">
            <img 
              src="/DevStack.png" 
              alt="DevStack Logo" 
              className="w-8 h-8 rounded-lg object-contain shadow-sm" 
            />
            <span className="font-extrabold text-lg bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Dev-Stack
            </span>
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={
                  active
                    ? 'flex items-center gap-3 px-4 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500 font-semibold text-sm rounded-r-lg transition-all'
                    : 'flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/50 font-medium text-sm rounded-lg transition-all'
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Theme Switcher */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60">
          <button
            onClick={toggleTheme}
            type="button"
            className="w-full flex items-center justify-between px-4 py-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50 font-medium text-xs rounded-lg transition-all cursor-pointer"
          >
            <span className="flex items-center gap-3">
              {!mounted ? (
                <span className="w-4.5 h-4.5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ) : isDark ? (
                <>
                  <Sun className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400 shrink-0" />
                  <span>Dark Mode</span>
                </>
              )}
            </span>
            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] rounded text-slate-600 dark:text-slate-400 font-semibold capitalize">
              {mounted ? (isDark ? 'dark' : 'light') : '...'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Bottom: user profile widget ── */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/60 mb-6">
        <div className="flex items-center gap-3 px-2 mb-3">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md ${
            isGuest 
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20' 
              : 'bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-blue-500/20'
          }`}>
            {initial ?? <User className="w-4 h-4" />}
          </div>

          {/* Email / display name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={displayEmail}>
              {displayEmail}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {(!user && isGuest) ? (
                <span className="text-emerald-500 font-semibold">Guest Mode</span>
              ) : (
                'Authenticated'
              )}
            </p>
          </div>

          {/* Sign-out button */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title={(!user && isGuest) ? "Exit Guest Mode" : "Sign out"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {signingOut ? (
              <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin block" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: Fixed/Sticky full-height sidebar ── */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* ── Mobile: Sliding Drawer with Backdrop Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop blur */}
          <div 
            onClick={onMobileClose} 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
            aria-hidden="true"
          />
          {/* Drawer container */}
          <div className="relative z-50 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
