'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Calendar, 
  ExternalLink,
  X,
  FileText,
  ShieldCheck,
  Lock
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HistoricalScan {
  id: string;
  repo: string;
  url: string;
  date: string;
  score: number;
  stack: string[];
  insights: string;
  recommendations: string[];
}

// ─── Markdown Content Renderer ───────────────────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1 font-sans text-sm text-slate-700 dark:text-slate-350 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800/80 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 shadow-md">
              <table className="w-full text-left text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }: any) => (
            <thead className="bg-slate-200/85 dark:bg-slate-800/80 text-slate-750 dark:text-slate-300">{children}</thead>
          ),
          th: ({ children }: any) => (
            <th className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">{children}</th>
          ),
          td: ({ children }: any) => (
            <td className="px-4 py-2.5 text-slate-750 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800/60 text-xs">{children}</td>
          ),
          p: ({ children }: any) => (
            <p className="leading-relaxed text-slate-750 dark:text-slate-300 mb-3 text-sm">{children}</p>
          ),
          strong: ({ children }: any) => (
            <strong className="text-slate-900 dark:text-white font-semibold">{children}</strong>
          ),
          ul: ({ children }: any) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-slate-705 dark:text-slate-300 text-sm">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-705 dark:text-slate-300 text-sm">{children}</ol>
          ),
          li: ({ children }: any) => (
            <li className="leading-relaxed">{children}</li>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{children}</h3>
          ),
          h4: ({ children }: any) => (
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3.5 mb-1.5">{children}</h4>
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = match || String(children).includes('\n');

            if (isCodeBlock) {
              const language = match ? match[1] : '';
              const codeText = String(children).replace(/\n$/, '');
              return (
                <div className="my-3 border border-slate-200 dark:border-slate-800/80 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 font-mono text-xs">
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
                  <pre className="p-3 overflow-x-auto text-indigo-705 dark:text-indigo-300 bg-slate-100/50 dark:bg-slate-950/90 font-mono">
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

// ─── Main History Page Component ─────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState<HistoricalScan | null>(null);
  
  const [historyList, setHistoryList] = useState<HistoricalScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // ── Fetch historical records & merge with static templates ────────────────
  useEffect(() => {
    if (!authChecked) return;

    async function fetchHistory() {
      try {
        setIsLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('analysis_history')
          .select('*')
          .eq('user_id', user.id)
          .order('analyzed_at', { ascending: false });

        if (error) {
          console.error('Error fetching historical records:', error);
        }

        const staticTemplates: HistoricalScan[] = [
          {
            id: 'template-1',
            repo: 'facebook/react',
            url: 'https://github.com/facebook/react',
            date: 'May 22, 2026',
            score: 95,
            stack: ['Flow', 'C++', 'JavaScript', 'HTML', 'Jest'],
            insights: 'React core codebase displaying highly modular configuration. Testing coverage is extremely high, utilizing extensive integration benchmarks. Recommended actions include continuing migration toward TypeScript definitions for public API entries.',
            recommendations: ['Expand TS support on legacy internals', 'Incorporate lock-file verification check in PR pipelines']
          },
          {
            id: 'template-2',
            repo: 'django/django',
            url: 'https://github.com/django/django',
            date: 'May 20, 2026',
            score: 87,
            stack: ['Python', 'SQLAlchemy', 'PostgreSQL', 'SQLite', 'Memcached'],
            insights: 'Django Framework source codebase. Integrates classical MVC architecture. Code quality is high, although deep database queries could benefit from unified profiling configurations to identify connection bottlenecks.',
            recommendations: ['Profile connection pool efficiency under load', 'Modernize legacy async compatibility layer']
          },
          {
            id: 'template-3',
            repo: 'nestjs/nest',
            url: 'https://github.com/nestjs/nest',
            date: 'May 18, 2026',
            score: 93,
            stack: ['TypeScript', 'Node.js', 'RxJS', 'Express', 'Fastify', 'Jest'],
            insights: 'Enterprise-grade Node.js framework leveraging decorators and strong module isolation. Injected dependencies are managed cleanly. Recommended improvements focus on Fastify handler integration updates.',
            recommendations: ['Audit RxJS stream error-handlers', 'Verify HTTP/2 Fastify performance metrics']
          }
        ];

        const fetchedRecords: HistoricalScan[] = (data || []).map((row: any) => {
          const isConsult = row.repository_url?.startsWith('AI Consult: ');
          
          let repoName = row.repository_url || 'Unknown Scan';
          let repoUrlStr = row.repository_url || '';
          if (!isConsult) {
            try {
              const parsedUrl = new URL(row.repository_url);
              const paths = parsedUrl.pathname.split('/').filter(Boolean);
              if (paths.length >= 2) {
                repoName = `${paths[paths.length - 2]}/${paths[paths.length - 1]}`;
              }
            } catch {
              if (row.repository_url?.startsWith('http')) {
                repoName = row.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//, '');
              }
            }
          }

          let parsedStack: string[] = [];
          let scoreVal = 90;
          let recommendationsList: string[] = [];

          if (row.detected_stack) {
            try {
              const stackObj = typeof row.detected_stack === 'string' 
                ? JSON.parse(row.detected_stack) 
                : row.detected_stack;
              
              if (isConsult) {
                if (Array.isArray(stackObj)) {
                  parsedStack = stackObj
                    .map((t: any) => (t && typeof t === 'object' ? t.tech : t))
                    .filter(Boolean);
                } else if (stackObj && typeof stackObj === 'object') {
                  if (stackObj.techBreakdownData && Array.isArray(stackObj.techBreakdownData)) {
                    parsedStack = stackObj.techBreakdownData.map((t: any) => t.tech);
                  } else if (Array.isArray(stackObj.detectedStack)) {
                    parsedStack = stackObj.detectedStack;
                  }
                }
                scoreVal = 100;
                recommendationsList = ['Follow the suggested architectural patterns', 'Implement caching layers as needed'];
              } else {
                if (Array.isArray(stackObj)) {
                  parsedStack = stackObj;
                  scoreVal = 90;
                  recommendationsList = ['Review dependency configurations.'];
                } else if (stackObj && typeof stackObj === 'object') {
                  parsedStack = stackObj.detectedStack || [];
                  scoreVal = stackObj.securityScore || 90;
                  recommendationsList = stackObj.recommendations || [];
                }
              }
            } catch (e) {
              console.error('Error parsing detected_stack:', e);
            }
          }

          let dateStr = 'Unknown Date';
          if (row.analyzed_at) {
            try {
              const dateObj = new Date(row.analyzed_at);
              dateStr = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
            } catch {}
          }

          return {
            id: row.id.toString(),
            repo: repoName,
            url: isConsult ? '' : repoUrlStr,
            date: dateStr,
            score: scoreVal,
            stack: parsedStack.length > 0 ? parsedStack : ['Other'],
            insights: row.ai_insights || 'No insights provided.',
            recommendations: recommendationsList.length > 0 ? recommendationsList : ['Review dependency configurations.']
          };
        });

        // Merge Strategy
        setHistoryList([...fetchedRecords, ...staticTemplates]);
      } catch (err) {
        console.error('Failed to load history list:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [authChecked]);

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

  const filteredHistory = historyList.filter(scan => 
    scan.repo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.stack.some(tech => {
      const name = typeof tech === 'object' && tech !== null && 'tech' in tech
        ? (tech as any).tech
        : String(tech);
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-900 px-8 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-2 md:hidden">
            <img 
              src="/DevStack.png" 
              alt="DevStack Logo" 
              className="w-8 h-8 rounded-lg object-contain" 
            />
            <span className="font-bold text-md">Dev-Stack</span>
          </div>
          <div className="text-sm text-slate-550 dark:text-slate-400 hidden md:block">
            Historical Scan Registers &bull; <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Total Scans: {historyList.length}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1.5 px-3 bg-slate-200/65 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full text-xs">
              <span className="w-2 h-2 bg-indigo-550 dark:bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-slate-700 dark:text-slate-350">History Sync Active</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-8 max-w-5xl w-full mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Analysis History</h2>
            <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
              Browse, search, and review detailed reports for previously executed repository stack analyses.
            </p>
          </div>

          {/* Search/Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search repository name or technology..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-805 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-850 p-2.5 px-4 rounded-lg select-none">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Filter: All Completed Scans</span>
            </div>
          </div>

          {/* Main List Grid */}
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <span className="w-8 h-8 border-4 border-indigo-650 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Fetching analysis history...</span>
              </div>
            ) : (
              <>
                {filteredHistory.map((scan) => (
                  <div 
                    key={scan.id} 
                    className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight break-all md:break-normal">{scan.repo}</h3>
                        {scan.url && (
                          <a 
                            href={scan.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(scan.stack) && scan.stack.map((techItem, index) => {
                          const techName = typeof techItem === 'object' && techItem !== null && 'tech' in techItem
                            ? (techItem as any).tech
                            : String(techItem);

                          return (
                            <span
                              key={`${techName}-${index}`}
                              className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-indigo-600 dark:text-indigo-400 text-xs rounded-full font-medium"
                            >
                              {techName}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {scan.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-stretch md:self-auto justify-between border-t border-slate-200 dark:border-slate-800/50 md:border-0 pt-4 md:pt-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Postulate Score</span>
                        <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{scan.score === 100 ? '100' : `${scan.score}/100`}</span>
                      </div>

                      <button
                        onClick={() => setSelectedScan(scan)}
                        className="px-4 py-2.5 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer transition-all duration-200"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}

                {filteredHistory.length === 0 && (
                  <div className="p-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-850 rounded-xl">
                    No matching scan records found. Try modifying your search term.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal / Report Dialog */}
          {selectedScan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Detailed Analysis Report</span>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white mt-1 break-all pr-4">{selectedScan.repo}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedScan(null)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-lg">
                    <span className="text-slate-550 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Metrics</span>
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      Score: {selectedScan.score}/100
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detected Technologies</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(selectedScan.stack) && selectedScan.stack.map((techItem, index) => {
                        const techName = typeof techItem === 'object' && techItem !== null && 'tech' in techItem
                          ? (techItem as any).tech
                          : String(techItem);

                        return (
                          <span
                            key={`${techName}-${index}`}
                            className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-indigo-600 dark:text-indigo-400 text-xs rounded-full font-semibold"
                          >
                            {techName}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Gemini Synthesis Insights
                    </h4>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300">
                      <MarkdownContent text={selectedScan.insights} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Recommended Steps</h4>
                    <ul className="space-y-2.5">
                      {selectedScan.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-350">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
                  <button 
                    onClick={() => setSelectedScan(null)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg cursor-pointer transition-colors"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
