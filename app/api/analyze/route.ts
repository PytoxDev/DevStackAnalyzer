import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const systemInstruction = `You are a strict Dev-Stack Architecture Expert. You only answer questions related to software engineering, IT architectures, developer stacks, programming languages, web/mobile development, databases, and DevOps. If the user asks about any non-IT topics (such as cooking, history, poetry, politics, sports, general knowledge, etc.), you must refuse to answer. Use this exact disclaimer prefix in your refusal: "Disclaimer: As an AI Dev-Stack Architecture Expert, I am only authorized to assist with software engineering and technology stack questions." followed by a polite refusal.

To ensure high readability, you must ALWAYS format technical recommendations, comparisons, and structural summaries using Markdown tables, bulleted lists, and inline code markers. Avoid presenting information in huge walls of text. Ensure text is relaxed and readable.

CRITICAL: You MUST respond with a valid JSON object matching this exact schema:
{
  "markdownResponse": "<your full markdown-formatted answer here>",
  "techBreakdownData": [
    { "tech": "<technology_name>", "percentage": <number 0-100> }
  ] or null,
  "popularityTrendData": [
    { "month": "Jan", "<tech1_name>": <number 0-100>, "<tech2_name>": <number 0-100> },
    { "month": "Feb", "<tech1_name>": <number 0-100>, "<tech2_name>": <number 0-100> },
    { "month": "Mar", "<tech1_name>": <number 0-100>, "<tech2_name>": <number 0-100> },
    { "month": "Apr", "<tech1_name>": <number 0-100>, "<tech2_name>": <number 0-100> },
    { "month": "May", "<tech1_name>": <number 0-100>, "<tech2_name>": <number 0-100> }
  ] or null
}
Provide techBreakdownData and popularityTrendData ONLY when your response recommends or compares specific popular tech stacks or technologies. The technology keys inside each monthly object of popularityTrendData must match the tech names listed in techBreakdownData. If the question is conceptual or non-comparative, set BOTH techBreakdownData and popularityTrendData to null. Do NOT wrap the JSON in markdown code fences. Return raw JSON only.`;

export async function POST(request: Request) {
  try {
    const { repositoryUrl, depth, targets, promptText } = await request.json();

    if (!repositoryUrl && !promptText) {
      return NextResponse.json({ error: 'Either repositoryUrl or promptText is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Handle Direct Text Query Mode (AI Architecture Consultant)
    if (promptText) {
      if (!apiKey) {
        return NextResponse.json(getMockPromptResponse(promptText));
      }
      try {
        const ai = new GoogleGenAI({ apiKey });
        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: promptText,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
            }
          });
        } catch (modelErr: any) {
          // If gemini-3.8-flash experiences temporary 503 high demand or unavailability, fallback to gemini-3.1-flash-lite
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: promptText,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
            }
          });
        }

        const rawText = response.text || '';
        try {
          const parsed = JSON.parse(rawText.trim());
          return NextResponse.json({
            markdownResponse: parsed.markdownResponse || rawText,
            techBreakdownData: parsed.techBreakdownData || null,
            popularityTrendData: parsed.popularityTrendData || null,
          });
        } catch {
          return NextResponse.json({ markdownResponse: rawText, techBreakdownData: null, popularityTrendData: null });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed for promptText, falling back to mock response:', geminiError?.message || geminiError);
        return NextResponse.json(getMockPromptResponse(promptText));
      }
    }

    // ── Handle Repository Scan Mode ──────────────────────────────────────────

    // 1. URL Parsing & Validation
    const cleanUrl = repositoryUrl.trim();
    const match = cleanUrl.match(/github\.com\/([a-zA-Z0-9\-]+)\/([a-zA-Z0-9\-\._]+)/i);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL. Must be a valid public github.com/owner/repo link.' },
        { status: 400 }
      );
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    let fileTree = '';
    let manifestContents = '';
    let isSimulated = false;

    // 2. Live Fetching via GitHub API
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Dev-Stack-Analyzer-App',
      };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
      const res = await fetch(githubUrl, { headers });

      if (!res.ok) {
        throw new Error(`GitHub API returned status ${res.status}`);
      }

      const files = await res.json();
      if (Array.isArray(files)) {
        fileTree = files.map(f => `${f.type === 'dir' ? '[DIR]' : '[FILE]'} ${f.name}`).join('\n');
        
        const manifestNames = [
          'package.json', 
          'requirements.txt', 
          'cargo.toml', 
          'go.mod', 
          'gemfile', 
          'pnpm-lock.yaml',
          'yarn.lock',
          'package-lock.json'
        ];
        
        const manifestFiles = files.filter(f => f.type === 'file' && manifestNames.includes(f.name.toLowerCase()));

        for (const file of manifestFiles) {
          if (file.download_url) {
            const rawRes = await fetch(file.download_url, { headers });
            if (rawRes.ok) {
              const rawText = await rawRes.text();
              manifestContents += `\n--- File: ${file.name} ---\n${rawText.slice(0, 5000)}\n`;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`GitHub API fetch failed for ${owner}/${repo}, switching to simulated analysis:`, err.message);
      isSimulated = true;
    }

    // If API key is missing, return a clean fallback mock analysis
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. Falling back to mock details.');
      return NextResponse.json(getMockAnalysis(repositoryUrl, isSimulated));
    }

    // 3. Real LLM-Powered Analysis Prompt
    const scanPrompt = `
You are an expert software architect and security auditor.
Analyze the following public GitHub repository contents for: "${owner}/${repo}".

Top-level file tree:
${fileTree || 'Could not fetch file tree'}

Raw contents of detected manifests:
${manifestContents || 'No package manifest files were detected.'}

The scan config parameters:
- Depth: ${depth}
- Audit Targets: ${JSON.stringify(targets)}

Please perform a genuine structural audit of these files and return a JSON object matching this exact schema:
{
  "detectedStack": ["Tech1", "Tech2", ...],
  "securityScore": number (integer between 0 and 100),
  "aiInsights": "Detailed description of the architectural structure, design patterns, and security notes.",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "markdownResponse": "Detailed, highly readable Markdown report of the codebase architecture, folder structure, and tech suggestions.",
  "techBreakdownData": [
    { "tech": "TechName", "percentage": number }
  ],
  "popularityTrendData": [
    { "month": "Jan", "TechName1": number, "TechName2": number },
    { "month": "Feb", "TechName1": number, "TechName2": number },
    { "month": "Mar", "TechName1": number, "TechName2": number },
    { "month": "Apr", "TechName1": number, "TechName2": number },
    { "month": "May", "TechName1": number, "TechName2": number }
  ]
}

Enforce that you evaluate the actual frameworks and libraries discovered in the manifests to build the tech breakdown percentage and trend charts dynamically.
Provide techBreakdownData and popularityTrendData matching the detected stack. Make sure all technology keys in popularityTrendData match the names in techBreakdownData. Return raw JSON only, no markdown wrapping.
`;

    const fallbackPrompt = `
You are an expert software architect and security auditor.
We attempted to fetch the codebase contents for the repository "${owner}/${repo}" via the GitHub API, but encountered an access restriction or rate limit.
Please generate a simulated/estimate analysis report for this repository based on its name and typical stack, indicating in the markdownResponse and aiInsights that this is a simulated estimate due to API rate limits.

Return a JSON object matching this exact schema:
{
  "detectedStack": ["Tech1", "Tech2", ...],
  "securityScore": number (integer between 0 and 100),
  "aiInsights": "Estimated analysis (GitHub API Rate Limited). Detailed description...",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "markdownResponse": "### Estimated Codebase Analysis\\n\\n*Note: This is an estimated analysis because the GitHub API rate limit was hit or the repository is private.*\\n\\n...",
  "techBreakdownData": [
    { "tech": "TechName", "percentage": number }
  ],
  "popularityTrendData": [
    { "month": "Jan", "TechName1": number, "TechName2": number },
    { "month": "Feb", "TechName1": number, "TechName2": number },
    { "month": "Mar", "TechName1": number, "TechName2": number },
    { "month": "Apr", "TechName1": number, "TechName2": number },
    { "month": "May", "TechName1": number, "TechName2": number }
  ]
}
Return raw JSON only, no markdown wrapping.
`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: isSimulated ? fallbackPrompt : scanPrompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
      } catch (scanErr: any) {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: isSimulated ? fallbackPrompt : scanPrompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
      }

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText.trim());
      return NextResponse.json(parsedData);
    } catch (error: any) {
      console.error('Gemini call or JSON parse failed. Switching to static fallback:', error);
      return NextResponse.json(getMockAnalysis(repositoryUrl, true));
    }

  } catch (error: any) {
    console.error('Error during analysis API call:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function getMockPromptResponse(promptText: string): {
  markdownResponse: string;
  techBreakdownData: Array<{ tech: string; percentage: number }> | null;
  popularityTrendData: Array<{ month: string; [techKey: string]: any }> | null;
} {
  const lowercasePrompt = promptText.toLowerCase();
  const nonITKeywords = [
    'poem', 'poetry', 'recipe', 'cook', 'bake', 'cake', 'soup', 'history', 'politic', 
    'sports', 'football', 'soccer', 'president', 'weather', 'love', 'philosophy', 'joke'
  ];

  const containsNonIT = nonITKeywords.some(keyword => lowercasePrompt.includes(keyword));

  if (containsNonIT) {
    return {
      markdownResponse: 'Disclaimer: As an AI Dev-Stack Architecture Expert, I am only authorized to assist with software engineering and technology stack questions. Therefore, I cannot assist with this request.',
      techBreakdownData: null,
      popularityTrendData: null,
    };
  }

  return {
    markdownResponse: `### Architectural Recommendation for: "${promptText}"

Based on your query, here is an optimized architecture strategy comparison:

| Layer | Strategy | Recommended Technology | Key Benefit |
| :--- | :--- | :--- | :--- |
| **Frontend** | Component Isolation | React / Next.js | SSR, ISR, and hydration control |
| **Caching** | Server-Side Caching | Redis Key-Value Store | Sub-50ms query response latency |
| **Database** | Read-Replication | PostgreSQL Replicas | Protects write-nodes from intensive queries |
| **Infra** | Container Orchestration | Kubernetes / Docker | Horizontal scaling with zero-downtime deploys |

Additional recommendations:
* **Decoupling**: Keep computational logic separate from transactional workflows.
* **Typing**: Enforce strict compile-time configurations in \`tsconfig.json\`.
* **Observability**: Instrument with OpenTelemetry for distributed tracing.

\`\`\`typescript
// Example Cache Middleware
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const cached = await redis.get(req.url);
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
\`\`\``,
    techBreakdownData: [
      { tech: 'Next.js', percentage: 91 },
      { tech: 'React', percentage: 96 },
      { tech: 'PostgreSQL', percentage: 78 },
      { tech: 'Redis', percentage: 72 },
    ],
    popularityTrendData: [
      { month: 'Jan', 'Next.js': 80, 'React': 90, 'PostgreSQL': 70, 'Redis': 65 },
      { month: 'Feb', 'Next.js': 82, 'React': 91, 'PostgreSQL': 72, 'Redis': 66 },
      { month: 'Mar', 'Next.js': 85, 'React': 93, 'PostgreSQL': 74, 'Redis': 68 },
      { month: 'Apr', 'Next.js': 88, 'React': 94, 'PostgreSQL': 76, 'Redis': 70 },
      { month: 'May', 'Next.js': 91, 'React': 96, 'PostgreSQL': 78, 'Redis': 72 },
    ],
  };
}

function getMockAnalysis(repositoryUrl: string, isSimulated: boolean = false) {
  const isPython = repositoryUrl.includes('fastapi') || repositoryUrl.includes('python');
  const note = isSimulated 
    ? '\n\n*Note: This analysis is simulated because the GitHub API rate limit was hit or the repository is private.*'
    : '';
  const techList = isPython 
    ? ['Python', 'FastAPI', 'Pydantic', 'Uvicorn', 'SQLite']
    : ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'];
  
  const techBreakdown = isPython
    ? [
        { tech: 'Python', percentage: 55 },
        { tech: 'FastAPI', percentage: 30 },
        { tech: 'SQLite', percentage: 15 }
      ]
    : [
        { tech: 'React', percentage: 40 },
        { tech: 'Next.js', percentage: 35 },
        { tech: 'TypeScript', percentage: 15 },
        { tech: 'PostgreSQL', percentage: 10 }
      ];

  const popularityTrend = isPython
    ? [
        { month: 'Jan', 'Python': 50, 'FastAPI': 25, 'SQLite': 12 },
        { month: 'Feb', 'Python': 52, 'FastAPI': 26, 'SQLite': 13 },
        { month: 'Mar', 'Python': 53, 'FastAPI': 28, 'SQLite': 14 },
        { month: 'Apr', 'Python': 54, 'FastAPI': 29, 'SQLite': 15 },
        { month: 'May', 'Python': 55, 'FastAPI': 30, 'SQLite': 15 }
      ]
    : [
        { month: 'Jan', 'React': 38, 'Next.js': 30, 'TypeScript': 12, 'PostgreSQL': 8 },
        { month: 'Feb', 'React': 39, 'Next.js': 32, 'TypeScript': 13, 'PostgreSQL': 9 },
        { month: 'Mar', 'React': 40, 'Next.js': 33, 'TypeScript': 14, 'PostgreSQL': 9 },
        { month: 'Apr', 'React': 40, 'Next.js': 34, 'TypeScript': 15, 'PostgreSQL': 10 },
        { month: 'May', 'React': 40, 'Next.js': 35, 'TypeScript': 15, 'PostgreSQL': 10 }
      ];

  return {
    detectedStack: techList,
    securityScore: 88,
    aiInsights: `AI Analysis (Simulated Response for ${repositoryUrl})${note}\nThis project displays a well-structured directory configuration. The stack uses robust dependencies, but stricter linting and license monitoring are recommended.`,
    recommendations: [
      'Pin library versions to strict minor/patch releases',
      'Audit licenses for third party utility scripts',
      'Integrate automatic static application security testing (SAST) in CI'
    ],
    markdownResponse: `### Codebase Analysis (Simulated Fallback for ${repositoryUrl})${note}\n\nThis project appears to have a clean layout. The config files suggest a modern frontend/backend stack.`,
    techBreakdownData: techBreakdown,
    popularityTrendData: popularityTrend
  };
}
