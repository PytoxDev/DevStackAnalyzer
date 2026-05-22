'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Sparkles, TrendingUp, ArrowUpRight, GitBranch, Lock, Cpu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

// Dynamically load Recharts components with ssr: false to prevent hydration issues
const TrendChart = dynamic(() => import('@/components/TrendChart'), { ssr: false });
const LanguageShareChart = dynamic(() => import('@/components/LanguageShareChart'), { ssr: false });

// Mock Data
const trendData = [
  { name: 'Jan', score: 40 },
  { name: 'Feb', score: 55 },
  { name: 'Mar', score: 48 },
  { name: 'Apr', score: 70 },
  { name: 'May', score: 85 },
];

const languageData = [
  { name: 'TypeScript', value: 45 },
  { name: 'Python', value: 25 },
  { name: 'Rust', value: 15 },
  { name: 'Go', value: 10 },
  { name: 'Other', value: 5 },
];

const recentScans = [
  { id: '1', repo: 'vercel/next.js', stack: ['React', 'TypeScript', 'Tailwind'], score: 94, date: '2 hours ago' },
  { id: '2', repo: 'fastapi/fastapi', stack: ['Python', 'Pydantic', 'Uvicorn'], score: 89, date: '1 day ago' },
  { id: '3', repo: 'supabase/supabase', stack: ['PostgreSQL', 'Go', 'TypeScript'], score: 92, date: '3 days ago' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [dailyInsight, setDailyInsight] = useState<string>('Loading strategic daily insights...');
  const [authorIndex, setAuthorIndex] = useState(0);
  const authorsText = ["Made by Korolchuk Illia", "Made by Pytox Developer", "Coursework Project"];

  // ── Route guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAuthorIndex((prev) => (prev + 1) % authorsText.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/insight')
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((data) => {
        setDailyInsight(data.tip || 'No insights available today.');
      })
      .catch((error) => {
        console.warn('Daily insights fetch failed. Falling back to default insight.', error);
        setDailyInsight(
          'Vector databases are seeing exponential growth in modern AI architectures. When building Retrieval-Augmented Generation (RAG) pipelines, consider decoupling vector index queries from transactional databases. This isolation allows independent scaling of memory-intensive similarity searches and guarantees predictable latency.'
        );
      });
  }, []);

  // ── Auth loading skeleton ─────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
          <div className="p-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/20">
            <Lock className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          </div>
          <p className="text-sm font-medium tracking-wide">Securing workspace&hellip;</p>
          <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar />
      <div className="hidden">
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-200 dark:border-slate-900 px-8 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md transition-colors duration-300">
          <div className="flex items-center gap-2 md:hidden">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
            <span className="font-bold text-md text-slate-900 dark:text-white">Dev-Stack</span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">
            Coursework Prototype &bull; <span className="text-indigo-600 dark:text-indigo-400 font-medium">Active Session</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1.5 px-3 bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full text-xs">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Gemini 3.5 Flash Connected</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid Container */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* ── Authorship Animation ────────────────────────────────────── */}
          <div className="w-full flex justify-start text-left mb-2 relative h-[44px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={authorIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-3xl font-extrabold tracking-tight text-[rgb(124,134,255)]"
              >
                {authorsText[authorIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Welcome section */}
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
            <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
              Tech stack trends, scan metrics, and recent codebase analysis.
            </p>
          </div>

          {/* AI Daily Analytics Insights widget card */}
          <div className="relative p-6 bg-gradient-to-r from-indigo-100/40 via-purple-100/30 to-slate-100/40 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/40 border border-indigo-200 dark:border-indigo-500/20 rounded-xl backdrop-blur-md shadow-2xl overflow-hidden group transition-colors duration-300">
            {/* Decorative subtle glows */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-500" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/15 transition-all duration-500" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">
                    AI Daily Analytics Insights
                  </h3>
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 rounded-full">
                    Revalidated Daily
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed max-w-4xl">
                  {dailyInsight}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat 1 */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm hover:border-slate-350 dark:hover:border-slate-700 transition-colors duration-300">
              <div className="flex justify-between items-start text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Scans Run</span>
                <span className="p-1 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg"><GitBranch className="w-4 h-4" /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">128</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">+12%</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm hover:border-slate-350 dark:hover:border-slate-700 transition-colors duration-300">
              <div className="flex justify-between items-start text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Security Score</span>
                <span className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg"><ShieldAlert className="w-4 h-4" /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">92.4%</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">+1.8%</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm hover:border-slate-350 dark:hover:border-slate-700 transition-colors duration-300">
              <div className="flex justify-between items-start text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">AI API Requests</span>
                <span className="p-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg"><Sparkles className="w-4 h-4" /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">412</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">this month</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm hover:border-slate-350 dark:hover:border-slate-700 transition-colors duration-300">
              <div className="flex justify-between items-start text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Tracked Techs</span>
                <span className="p-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg"><TrendingUp className="w-4 h-4" /></span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">34</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Active</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Area chart — min-h prevents Recharts -1 width/height warning */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm transition-colors duration-300">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-6">
                Monthly Analysis Volume
              </h3>
              <div className="w-full aspect-video min-h-0">
                <TrendChart data={trendData} />
              </div>
            </div>

            {/* Chart 2: Language breakdown */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm transition-colors duration-300">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-6">
                Most Common Languages Detected
              </h3>
              <div className="w-full aspect-video min-h-0">
                <LanguageShareChart data={languageData} />
              </div>
            </div>
          </div>

          {/* Recent Scans Table */}
          <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Codebase Scans
              </h3>
              <Link href="/history" className="text-xs text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
                View all history
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-semibold">Repository</th>
                    <th className="pb-3 font-semibold">Detected Stack</th>
                    <th className="pb-3 font-semibold">Score</th>
                    <th className="pb-3 font-semibold">Analyzed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                        {scan.repo}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {scan.stack.map((tech) => (
                            <span 
                              key={tech} 
                              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{scan.score}/100</span>
                      </td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 text-xs">{scan.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}