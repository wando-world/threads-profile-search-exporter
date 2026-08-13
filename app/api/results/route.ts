import { NextRequest, NextResponse } from "next/server";
import type { ThreadsAccount } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredResults = {
  query: string;
  count: number;
  results: ThreadsAccount[];
  receivedAt: string;
};

declare global {
  var latestThreadsResults: StoredResults | undefined;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Private-Network": "true",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function GET() {
  return NextResponse.json(
    globalThis.latestThreadsResults ?? { query: "", count: 0, results: [], receivedAt: null },
    { headers: { ...corsHeaders, "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { query?: unknown; results?: unknown };
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 80) : "";
    if (!query || !Array.isArray(body.results)) {
      return NextResponse.json({ message: "검색어와 결과 배열이 필요합니다." }, { status: 400, headers: corsHeaders });
    }

    const unique = new Map<string, ThreadsAccount>();
    for (const value of body.results.slice(0, 10_000)) {
      if (!value || typeof value !== "object") continue;
      const item = value as Record<string, unknown>;
      const username = typeof item.username === "string" ? item.username.trim() : "";
      if (!/^[\w.]{1,50}$/.test(username)) continue;
      unique.set(username, {
        username,
        displayName: typeof item.displayName === "string" ? item.displayName.slice(0, 200) : "",
        bio: typeof item.bio === "string" ? item.bio.slice(0, 2_000) : "",
        followerCount: typeof item.followerCount === "number" && Number.isFinite(item.followerCount)
          ? Math.max(0, Math.floor(item.followerCount))
          : null,
        verified: item.verified === true,
        url: `https://www.threads.com/@${username}`,
      });
    }

    const stored: StoredResults = {
      query,
      count: unique.size,
      results: Array.from(unique.values()),
      receivedAt: new Date().toISOString(),
    };
    globalThis.latestThreadsResults = stored;
    return NextResponse.json(stored, { headers: corsHeaders });
  } catch {
    return NextResponse.json({ message: "결과 데이터를 읽지 못했습니다." }, { status: 400, headers: corsHeaders });
  }
}
