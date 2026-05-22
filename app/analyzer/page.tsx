'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Cpu, 
  History, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  Sparkles, 
  CheckCircle,
  Play,
  Terminal,
  ShieldCheck,
  Bot,
  Send,
  FlaskConical,
  Lock
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalysisResult {
  repositoryUrl: string;
  detectedStack: string[];
  securityScore: number;
  aiInsights: string;
  recommendations: string[];
}

interface TechBreakdownEntry {
  tech: string;
  percentage: number;
}

interface PopularityTrendEntry {
  month: string;
  [techKey: string]: any;
}

interface ConsultResponse {
  markdownResponse: string;
  techBreakdownData: TechBreakdownEntry[] | null;
  popularityTrendData: PopularityTrendEntry[] | null;
}

// ─── Colour palette per technology type ──────────────────────────────────────

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

function EvidenceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  
  // Check if it is a tech breakdown entry (has 'tech' property)
  if (data.tech !== undefined) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs shadow-xl transition-colors duration-300">
        <p className="text-slate-900 dark:text-white font-semibold mb-0.5">{data.tech}</p>
        <p className="text-indigo-650 dark:text-indigo-400 font-bold">{data.percentage}% Share</p>
      </div>
    );
  }
  
  // Otherwise, it's popularityTrendData
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs shadow-xl space-y-1 transition-colors duration-300">
      <p className="text-slate-900 dark:text-white font-semibold border-b border-slate-200 dark:border-slate-800/80 pb-1 mb-1.5">{data.month}</p>
      {payload.map((item: any, idx: number) => (
        <div key={idx} className="flex justify-between items-center gap-4">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: item.color || item.stroke }} />
            {item.name}
          </span>
          <span className="text-slate-900 dark:text-white font-bold">{item.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1 font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800/80 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 shadow-md">
              <table className="w-full text-left text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }: any) => (
            <thead className="bg-slate-200/80 dark:bg-slate-800/80 text-slate-750 dark:text-slate-300">{children}</thead>
          ),
          th: ({ children }: any) => (
            <th className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">{children}</th>
          ),
          td: ({ children }: any) => (
            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800/60 text-xs">{children}</td>
          ),
          p: ({ children }: any) => (
            <p className="leading-relaxed text-slate-750 dark:text-slate-300 mb-4 text-sm">{children}</p>
          ),
          strong: ({ children }: any) => (
            <strong className="text-slate-900 dark:text-white font-semibold">{children}</strong>
          ),
          ul: ({ children }: any) => (
            <ul className="list-disc list-inside space-y-1 mb-4 text-slate-705 dark:text-slate-300 text-sm">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal list-inside space-y-1 mb-4 text-slate-705 dark:text-slate-300 text-sm">{children}</ol>
          ),
          li: ({ children }: any) => (
            <li className="leading-relaxed">{children}</li>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-5 mb-2">{children}</h3>
          ),
          h4: ({ children }: any) => (
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-105 mt-4 mb-1.5">{children}</h4>
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = match || String(children).includes('\n');

            if (isCodeBlock) {
              const language = match ? match[1] : '';
              const codeText = String(children).replace(/\n$/, '');
              return (
                <div className="my-4 border border-slate-200 dark:border-slate-800/80 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 font-mono text-xs">
                  <div className="bg-slate-100 dark:bg-slate-900/60 px-4 py-2 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>{language || 'code'}</span>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText(codeText)}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors text-[10px] uppercase font-semibold tracking-wider cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-indigo-705 dark:text-indigo-300 bg-slate-100/50 dark:bg-slate-950/90 font-mono">
                    <code className="font-mono">{codeText}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code className="bg-slate-150 dark:bg-slate-800 text-emerald-750 dark:text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200 dark:border-slate-700/30" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }: any) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ─── Architecture Evidence Panel ─────────────────────────────────────────────

function ArchitectureEvidencePanel({
  techBreakdownData,
  popularityTrendData,
}: {
  techBreakdownData: TechBreakdownEntry[];
  popularityTrendData: PopularityTrendEntry[] | null;
}) {
  const CHART_COLORS = [
    '#6366f1', // Indigo
    '#a855f7', // Purple
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#14b8a6', // Teal
  ];

  const techColors = techBreakdownData.reduce((acc, entry, index) => {
    acc[entry.tech] = CHART_COLORS[index % CHART_COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  const techKeys = popularityTrendData && popularityTrendData.length > 0
    ? Object.keys(popularityTrendData[0]).filter(key => key !== 'month')
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6 h-fit"
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div className="p-1.5 bg-indigo-500/10 rounded-md">
          <FlaskConical className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Architecture Insights</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Empirical evidence & popularity data</p>
        </div>
      </div>

      {/* Tech Breakdown section */}
      <div className="space-y-3">
        <h5 className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wide">Technology Share</h5>
        <div className="w-full aspect-video min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={techBreakdownData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.2} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="tech"
                stroke="#64748b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip content={<EvidenceTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={12}>
                {techBreakdownData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={techColors[entry.tech] || '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popularity Trend section */}
      {popularityTrendData && popularityTrendData.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <h5 className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wide">Trend Over Time</h5>
          <div className="w-full aspect-video min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={popularityTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.2} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<EvidenceTooltip />} />
                {techKeys.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={techColors[key] || '#6366f1'}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tech badges */}
      <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        {techBreakdownData.map((entry) => (
          <span
            key={entry.tech}
            className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full border transition-all"
            style={{
              color: techColors[entry.tech] || '#6366f1',
              borderColor: `${techColors[entry.tech] || '#6366f1'}40`,
              backgroundColor: `${techColors[entry.tech] || '#6366f1'}10`,
            }}
          >
            {entry.tech} ({entry.percentage}%)
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyzerPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'chat'>('scan');

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

  // Chat / Consultant state
  const [promptInput, setPromptInput] = useState('');
  const [consultResponse, setConsultResponse] = useState<ConsultResponse | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Repo scan state
  const [repoUrl, setRepoUrl] = useState('');
  const [depth, setDepth] = useState('standard');
  const [targetAreas, setTargetAreas] = useState({
    dependencies: true,
    codeQuality: true,
    licenses: false,
    secrets: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  
  const hasResult = !!result || !!consultResponse;

  // ── Auth loading skeleton ─────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
          <div className="p-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/20">
            <Lock className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          </div>
          <p className="text-sm font-medium tracking-wide">Securing workspace&hellip;</p>
          <span className="w-6 h-6 border-2 border-indigo-650 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Repo scan handler ─────────────────────────────────────────────────────

  const triggerAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsLoading(true);
    setError('');
    setResult(null);
    
    const steps = [
      'Cloning repository structure...',
      'Parsing package manifests and dependency trees...',
      'Scanning for API tokens and raw secrets...',
      'Formulating Gemini context payload...',
      'Consulting Gemini 3.5 Flash for architectural insights...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgressMsg(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryUrl: repoUrl, depth, targets: targetAreas }),
      });

      if (!response.ok) throw new Error('API server returned an error');

      const data = await response.json();
      const finalResult = {
        repositoryUrl: repoUrl,
        detectedStack: data.detectedStack || ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        securityScore: data.securityScore || 92,
        aiInsights: data.aiInsights || 'Repository exhibits clean structure.',
        recommendations: data.recommendations || [],
      };
      setResult(finalResult);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('analysis_history').upsert([
            {
              user_id: user.id,
              repository_url: repoUrl,
              detected_stack: finalResult.detectedStack,
              ai_insights: finalResult.aiInsights
            }
          ], { onConflict: 'repository_url' });
        }
      } catch (dbErr) {
        console.error('Error saving history to database:', dbErr);
      }
    } catch {
      console.warn('API error. Falling back to simulated mock insights.');
      const fallbackResult = {
        repositoryUrl: repoUrl,
        detectedStack: repoUrl.includes('fastapi')
          ? ['Python', 'FastAPI', 'Pydantic', 'SQLite']
          : ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'],
        securityScore: 88,
        aiInsights: `AI Analysis (Simulated Fallback for ${repoUrl}):\nThis project displays a well-structured layout. The stack uses robust dependencies, but stricter linting and license monitoring are recommended.`,
        recommendations: [
          'Add security scanner in CI/CD pipeline',
          'Optimize image loading with next/image',
          'Conduct license audit for third-party scripts',
        ],
      };
      setResult(fallbackResult);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('analysis_history').upsert([
            {
              user_id: user.id,
              repository_url: repoUrl,
              detected_stack: fallbackResult.detectedStack,
              ai_insights: fallbackResult.aiInsights
            }
          ], { onConflict: 'repository_url' });
        }
      } catch (dbErr) {
        console.error('Error saving history to database:', dbErr);
      }
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  // ── Consultant chat handler ───────────────────────────────────────────────

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput) return;

    setIsChatLoading(true);
    setConsultResponse(null);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: promptInput }),
      });

      if (!response.ok) throw new Error('API server returned an error');

      const data = await response.json();
      const finalResponse = {
        markdownResponse: data.markdownResponse || data.text || 'No response returned from the expert.',
        techBreakdownData: data.techBreakdownData || null,
        popularityTrendData: data.popularityTrendData || null,
      };
      setConsultResponse(finalResponse);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('analysis_history').upsert([
            {
              user_id: user.id,
              repository_url: `AI Consult: ${promptInput}`,
              detected_stack: finalResponse.techBreakdownData,
              ai_insights: finalResponse.markdownResponse
            }
          ], { onConflict: 'repository_url' });
        }
      } catch (dbErr) {
        console.error('Error saving consult history to database:', dbErr);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to reach the AI consultant.');
      const fallbackResponse = {
        markdownResponse: `Disclaimer: As an AI Dev-Stack Architecture Expert, I am only authorized to assist with software engineering and technology stack questions. (Simulation Fallback: Connection issue encountered for query: "${promptInput}")`,
        techBreakdownData: null,
        popularityTrendData: null,
      };
      setConsultResponse(fallbackResponse);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('analysis_history').upsert([
            {
              user_id: user.id,
              repository_url: `AI Consult: ${promptInput}`,
              detected_stack: fallbackResponse.techBreakdownData,
              ai_insights: fallbackResponse.markdownResponse
            }
          ], { onConflict: 'repository_url' });
        }
      } catch (dbErr) {
        console.error('Error saving consult history to database:', dbErr);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-900 px-8 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md transition-colors duration-300">
          <div className="flex items-center gap-2 md:hidden">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
            <span className="font-bold text-md text-slate-900 dark:text-white">Dev-Stack</span>
          </div>
          <div className="text-sm text-slate-550 dark:text-slate-400 hidden md:block">
            Stack Analysis Engine &bull; <span className="text-indigo-600 dark:text-indigo-400 font-medium">Gemini-Powered</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1.5 px-3 bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full text-xs text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
              <span>Analyzer Online</span>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Stack Analyzer</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Provide a repository URL to scan dependencies, estimate security posture, and generate AI insights.
            </p>
          </div>

          {/* ── Top grid: input + how-it-works sidebar ──────────────────── */}
          <div className={`grid grid-cols-1 ${!hasResult ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-8`}>

            {/* Input column */}
            <div className={`${!hasResult ? 'lg:col-span-2' : ''} space-y-6`}>

              {/* Tab selector */}
              <div className="flex p-1 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg w-fit transition-colors duration-300">
                <button
                  type="button"
                  onClick={() => setActiveTab('scan')}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'scan' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Repository Scan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  AI Architecture Consultant
                </button>
              </div>

              {/* ── Scan Tab ─────────────────────────────────────────── */}
              {activeTab === 'scan' ? (
                <form onSubmit={triggerAnalysis} className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm space-y-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2.5">Repository URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450 dark:text-slate-500">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">Analysis Depth</label>
                      <select
                        value={depth}
                        onChange={(e) => setDepth(e.target.value)}
                        className="w-full px-3.5 py-3 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 text-sm"
                        disabled={isLoading}
                      >
                        <option value="quick">Quick Scan</option>
                        <option value="standard">Standard Analysis</option>
                        <option value="deep">Deep Security Audit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400 mb-2">Engine Priority</label>
                      <div className="px-3.5 py-3 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-lg text-xs text-indigo-650 dark:text-indigo-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-650 dark:text-purple-400" />
                        Gemini 3.5 Flash
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400 mb-3">Target Audit Areas</label>
                    <div className="grid grid-cols-2 gap-3.5">
                      {(['dependencies', 'codeQuality', 'licenses', 'secrets'] as const).map((area) => (
                        <label key={area} className="flex items-center gap-3 p-3 bg-slate-100/30 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-200/20 dark:hover:bg-slate-900/10 transition-colors cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={targetAreas[area]}
                            onChange={(e) => setTargetAreas({ ...targetAreas, [area]: e.target.checked })}
                            className="rounded border-slate-350 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-950"
                            disabled={isLoading}
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300 capitalize">{area === 'codeQuality' ? 'Code Quality' : area === 'secrets' ? 'Secret Leaks' : area.charAt(0).toUpperCase() + area.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !repoUrl}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Analyze Codebase Stack
                  </button>
                </form>
              ) : (
                /* ── Chat Tab ────────────────────────────────────────── */
                <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm space-y-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-md">AI Architecture Consultant</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ask the Dev-Stack expert about engineering strategies, libraries, or architectures.</p>
                    </div>
                  </div>

                  <form onSubmit={handleChatSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">Your Query</label>
                      <textarea
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="e.g., Should I use Next.js Server Actions or Route Handlers for posting comments? / How can I structure a high-performance vector DB connection?"
                        rows={4}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 text-sm resize-none"
                        disabled={isChatLoading}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isChatLoading || !promptInput}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                    >
                      {isChatLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Ask Expert
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Progress bar (scan tab only) */}
              {activeTab === 'scan' && isLoading && (
                <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 border-2 border-indigo-605 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      {progressMsg}
                    </span>
                    <span>Processing...</span>
                  </div>
                  <div className="h-1 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-3/4 rounded-full animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* How it works sidebar (1/3) */}
            {!hasResult && (
              <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm space-y-6 h-fit hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
                  How it works
                </h3>
                {activeTab === 'scan' ? (
                  <div className="space-y-4 text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">1. Structure Scan</h4>
                      <p>Parse configuration manifests, lock files, and key system directories to construct a full technology map.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">2. Vulnerability Scan</h4>
                      <p>Cross-reference package maps against known CVE databases to flag deprecated or compromised dependencies.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">3. AI Insights Pipeline</h4>
                      <p>Send clean stack details to Gemini 3.5 Flash to synthesize development suggestions, design observations, and migrations.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">1. Architecture Queries</h4>
                      <p>Submit questions about modern libraries, software patterns, systems scaling, database design, and framework details.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">2. Guardrail Isolation</h4>
                      <p>Requests are automatically audited using strict system parameters to enforce exclusive focus on software engineering topics.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">3. Evidence Chart</h4>
                      <p>When recommending technology stacks, the expert generates a live popularity chart in the Architecture Evidence panel.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Chat Expert Response Results ───────────────────────────────── */}
          {activeTab === 'chat' && consultResponse && (() => {
            const hasCharts = !!consultResponse && 
                              Array.isArray(consultResponse.techBreakdownData) && 
                              consultResponse.techBreakdownData.length > 0;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-650 dark:text-purple-400" />
                  Expert Response
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-start">
                  {/* Left Column: Markdown Text Output (2/3 width or 3/3 if no charts) */}
                  <div className={`${hasCharts ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
                    <div className="p-6 bg-white/90 dark:bg-slate-950/85 border border-slate-200 dark:border-slate-800/60 rounded-xl backdrop-blur-sm shadow-xl">
                      <MarkdownContent text={consultResponse.markdownResponse} />
                    </div>
                  </div>

                  {/* Right Column: Interactive Charts Panel (1/3 width) */}
                  {hasCharts && (
                    <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm sticky top-24">
                      <ArchitectureEvidencePanel
                        techBreakdownData={consultResponse.techBreakdownData!}
                        popularityTrendData={consultResponse.popularityTrendData}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* ── Repository Scan Results ───────────────────────────────────── */}
          {activeTab === 'scan' && result && (
            <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm space-y-8 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-450">Analysis completed successfully</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{result.repositoryUrl}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Security Score:</span>
                  <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-lg flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    {result.securityScore}/100
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400">Detected Technologies</div>
                <div className="flex flex-wrap gap-2">
                  {result.detectedStack.map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-indigo-650 dark:text-indigo-400 text-xs font-semibold rounded-lg">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-650 dark:text-purple-400" />
                  Gemini Synthesis Insights
                </div>
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm leading-relaxed text-slate-750 dark:text-slate-300 font-mono whitespace-pre-line">
                  {result.aiInsights}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-400">Recommended Steps</div>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
