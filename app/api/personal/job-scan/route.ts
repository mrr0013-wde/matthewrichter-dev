import { NextRequest, NextResponse } from "next/server";
import { rest } from "@/lib/personal/db";

// Daily scan of public ATS job boards (Greenhouse / Lever / Ashby) for the
// companies in personal_ats_boards. Filters for PM roles, remote-friendly,
// recent postings; dedupes on URL. Triggered by Supabase pg_cron with the
// x-internal-secret header (same pattern as the betzgames WC syncs).

export const maxDuration = 60;

const TITLE_RE = /product manager|product management lead/i;
const TITLE_EXCLUDE_RE =
  /principal|director|vp|vice president|head of|group product|intern|associate product/i;
const REMOTE_RE = /remote|anywhere|distributed|united states|usa/i;
const MAX_AGE_DAYS = 45;

type Board = { company: string; ats: string; board_slug: string; connection_count: number };
type Lead = {
  company: string;
  title: string;
  location: string | null;
  url: string;
  posted_at: string | null;
  source: string;
  connection_count: number;
};

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "matthewrichter.dev job scan" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function freshEnough(iso: string | null): boolean {
  if (!iso) return true; // no date on the board — keep it, dedupe handles noise
  const age = Date.now() - new Date(iso).getTime();
  return age < MAX_AGE_DAYS * 24 * 3600 * 1000;
}

function wantTitle(title: string): boolean {
  return TITLE_RE.test(title) && !TITLE_EXCLUDE_RE.test(title);
}

async function scanBoard(b: Board): Promise<Lead[]> {
  const leads: Lead[] = [];
  if (b.ats === "greenhouse") {
    const data = (await fetchJson(
      `https://boards-api.greenhouse.io/v1/boards/${b.board_slug}/jobs`
    )) as { jobs?: { title: string; absolute_url: string; location?: { name?: string }; updated_at?: string; first_published?: string }[] } | null;
    for (const j of data?.jobs ?? []) {
      const loc = j.location?.name ?? "";
      const posted = j.first_published ?? j.updated_at ?? null;
      if (wantTitle(j.title) && REMOTE_RE.test(loc) && freshEnough(posted)) {
        leads.push({
          company: b.company,
          title: j.title,
          location: loc || null,
          url: j.absolute_url,
          posted_at: posted ? posted.slice(0, 10) : null,
          source: "greenhouse",
          connection_count: b.connection_count,
        });
      }
    }
  } else if (b.ats === "lever") {
    const data = (await fetchJson(
      `https://api.lever.co/v0/postings/${b.board_slug}?mode=json`
    )) as { text: string; hostedUrl: string; createdAt?: number; workplaceType?: string; categories?: { location?: string } }[] | null;
    for (const j of data ?? []) {
      const loc = j.categories?.location ?? "";
      const remote = j.workplaceType === "remote" || REMOTE_RE.test(loc);
      const posted = j.createdAt ? new Date(j.createdAt).toISOString() : null;
      if (wantTitle(j.text) && remote && freshEnough(posted)) {
        leads.push({
          company: b.company,
          title: j.text,
          location: loc || (j.workplaceType === "remote" ? "Remote" : null),
          url: j.hostedUrl,
          posted_at: posted ? posted.slice(0, 10) : null,
          source: "lever",
          connection_count: b.connection_count,
        });
      }
    }
  } else if (b.ats === "ashby") {
    const data = (await fetchJson(
      `https://api.ashbyhq.com/posting-api/job-board/${b.board_slug}`
    )) as { jobs?: { title: string; jobUrl?: string; applyUrl?: string; location?: string; isRemote?: boolean; publishedAt?: string; publishedDate?: string }[] } | null;
    for (const j of data?.jobs ?? []) {
      const loc = j.location ?? "";
      const remote = j.isRemote === true || REMOTE_RE.test(loc);
      const posted = j.publishedAt ?? j.publishedDate ?? null;
      const url = j.jobUrl ?? j.applyUrl;
      if (url && wantTitle(j.title) && remote && freshEnough(posted)) {
        leads.push({
          company: b.company,
          title: j.title,
          location: loc || (j.isRemote ? "Remote" : null),
          url,
          posted_at: posted ? posted.slice(0, 10) : null,
          source: "ashby",
          connection_count: b.connection_count,
        });
      }
    }
  }
  return leads;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const boards = await rest<Board[]>(
    "personal_ats_boards?active=eq.true&select=company,ats,board_slug,connection_count"
  );

  const all: Lead[] = [];
  const queue = [...boards];
  let scanned = 0;
  async function worker() {
    while (queue.length) {
      const b = queue.shift()!;
      all.push(...(await scanBoard(b)));
      scanned++;
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));

  // dedupe within this run, then insert ignoring URLs we already have
  const seen = new Set<string>();
  const unique = all.filter((l) => !seen.has(l.url) && seen.add(l.url));
  let inserted = 0;
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const res = await rest<unknown[]>(`personal_job_leads?on_conflict=url`, {
      method: "POST",
      body: JSON.stringify(chunk),
      prefer: "resolution=ignore-duplicates,return=representation",
    });
    inserted += Array.isArray(res) ? res.length : 0;
  }

  return NextResponse.json({
    boards_scanned: scanned,
    matches_found: unique.length,
    new_leads: inserted,
  });
}
