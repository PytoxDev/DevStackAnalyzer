import { NextResponse } from 'next/server';

// Revalidate this API route's cached response every 24 hours (86400 seconds)
export const revalidate = 86400;

export async function GET() {
  return NextResponse.json({
    tip: "Vector databases are seeing exponential growth in modern AI architectures. When building Retrieval-Augmented Generation (RAG) pipelines, consider decoupling vector index queries from transactional databases. This isolation allows independent scaling of memory-intensive similarity searches and guarantees predictable latency."
  });
}
