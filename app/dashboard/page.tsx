'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Sparkles, TrendingUp, ArrowUpRight, GitBranch, Lock } from 'lucide-react';
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
  const [isGuest, setIsGuest] = useState(false);
  const [dailyInsight, setDailyInsight] = useState<string>('Loading strategic daily insights...');
  const [authorIndex, setAuthorIndex] = useState(0);
  const authorsText = ["Made by Korolchuk Illia", "Made by Pytox Developer", "Practic Project"];

  // ── Route guard (supports Supabase session and Guest mode) ───────────────────
  useEffect(() => {
    const guestFlag = localStorage.getItem('devstack_guest') === 'true';
    if (guestFlag) {
      setIsGuest(true);
      setAuthChecked(true);
      return;
    }

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
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Lock className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-pulse" />
          </div>
          <p className="text-sm font-medium tracking-wide">Securing workspace&hellip;</p>
          <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-200 dark:border-slate-900 px-8 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md transition-colors duration-300">
          <div className="flex items-center gap-2 md:hidden">
            <img 
              src="/DevStack.png" 
              alt="DevStack Logo" 
              className="w-8 h-8 rounded-lg object-contain" 
            />
            <span className="font-bold text-md text-slate-900 dark:text-white">Dev-Stack</span>
          </div>
          <div className="text-sm text-slate-550 dark:text-slate-400 hidden md:block">
            Practic Project &bull; <span className="text-blue-600 dark:text-blue-400 font-medium">{isGuest ? 'Guest Session' : 'Active Session'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {isGuest && (
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full hidden sm:inline-block">
                Гостьовий режим (Non-saving)
              </span>
            )}
            <div className="flex items-center gap-2 p-1.5 px-3 bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full text-xs">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Gemini 3.8 Flash Connected</span>
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
                className="text-3xl font-extrabold tracking-tight text-blue-500 dark:text-blue-400"
              >
                {authorsText[authorIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Welcome section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Workspace Overview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Real-time tech stack intelligence, security benchmarks, and codebase telemetry.
              </p>
            </div>
            <Link
              href="/analyzer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all self-start md:self-auto cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Start New Analysis
            </Link>
          </div>

          {/* AI Daily Analytics Insights widget card (Blue to Teal gradient) */}
          <div className="relative p-6 bg-gradient-to-r from-blue-950/20 via-slate-900/60 to-emerald-950/20 border border-blue-900/40 dark:border-blue-500/20 rounded-2xl backdrop-blur-md shadow-2xl overflow-hidden group transition-colors duration-300">
            {/* Decorative subtle glows */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/15 transition-all duration-500" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-500" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-gradient-to-tr from-blue-600 to-emerald-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    AI Strategic Stack Insight
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/25 text-[10px] font-semibold text-blue-600 dark:text-blue-300 rounded-full">
                    Auto-Refreshed Daily
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed max-w-4xl">
                  {dailyInsight}
                </p>
              </div>
            </div>
          </div>

          {/* ── ASYMMETRIC UI GRID: 1 Prominent Hero Card + 2 Secondary Stats ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* HERO BLOCK: Spans 2 columns on large screens - High visual hierarchy */}
            <div className="lg:col-span-2 p-7 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-black/80 border border-slate-800 rounded-2xl backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                      <GitBranch className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Architecture Health</span>
                      <h4 className="text-base font-bold text-white">Production Stack Posture</h4>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Optimal Security Rating
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <span className="text-xs text-slate-400">Overall Security Score</span>
                    <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
                      92.4%
                      <span className="text-xs text-emerald-400 font-semibold">+1.8%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Evaluated across 128 scans</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">Total Codebases Audited</span>
                    <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
                      128
                      <span className="text-xs text-blue-400 font-semibold">+12%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">GitHub repos analyzed</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">Gemini Invocations</span>
                    <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
                      412
                      <span className="text-xs text-emerald-400 font-semibold">100% OK</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Direct architecture queries</p>
                  </div>
                </div>
              </div>

              {/* Progress bar indicator */}
              <div className="mt-8 pt-6 border-t border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Stack Modernity & Compliance Index</span>
                  <span className="text-blue-400 font-semibold">88 / 100 benchmark</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 w-[88%] rounded-full" />
                </div>
              </div>
            </div>

            {/* SECONDARY ASYMMETRIC COLUMN (1 Col): Stacked compact telemetry cards */}
            <div className="flex flex-col gap-4 justify-between">
              
              {/* Secondary Card 1 */}
              <div className="p-5 bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-sm hover:border-slate-700 transition-colors flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tracked Technologies</span>
                  <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">34</span>
                  <span className="text-xs text-emerald-500 font-semibold">Active Frameworks</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">React, Next.js, FastAPI, Rust & PostgreSQL lead adoption</p>
              </div>

              {/* Secondary Card 2 */}
              <div className="p-5 bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-sm hover:border-slate-700 transition-colors flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Telemetry</span>
                  <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">0.42s</span>
                  <span className="text-xs text-emerald-500 font-semibold">Avg Latency</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Real-time LLM streaming & AST parse pipeline online</p>
              </div>

            </div>

          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Area chart */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-sm transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Monthly Analysis Volume
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Execution count per calendar month</p>
                </div>
                <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <GitBranch className="w-4 h-4" />
                </span>
              </div>
              <div className="w-full aspect-video min-h-0">
                <TrendChart data={trendData} />
              </div>
            </div>

            {/* Chart 2: Language breakdown */}
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-sm transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Detected Language Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Normalized share across analyzed repositories</p>
                </div>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="w-full aspect-video min-h-0">
                <LanguageShareChart data={languageData} />
              </div>
            </div>
          </div>

          {/* Recent Scans Table */}
          <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Recent Codebase Scans
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Most recent audit benchmarks</p>
              </div>
              <Link href="/history" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-1 font-medium">
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
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        {scan.repo}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {scan.stack.map((tech) => (
                            <span 
                              key={tech} 
                              className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full font-medium"
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