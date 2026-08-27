import { NextRequest, NextResponse } from "next/server";
import { rest } from "@/lib/personal/db";

// Daily scan of public ATS job boards (Greenhouse / Lever / Ashby) for the
// companies in personal_ats_boards. Filters for PM roles, remote-friendly,
// recent postings; dedupes on URL. Triggered by Supabase pg_cron with the
// x-internal-secret header (same pattern as the betzgames WC syncs).

export const maxDuration = 60;

// All PM levels welcome — mid-level "Product Manager" included, not just
// Senior. The salary floor below is the real gate, not the title.
const TITLE_RE = /product manager|product management lead/i;
const TITLE_EXCLUDE_RE =
  /principal|director|vp|vice president|head of|group product|intern/i;
const REMOTE_RE = /remote|anywhere|distributed|united states|usa/i;
// Only two locations qualify: remote, or onsite in Greenville, SC.
const GREENVILLE_RE = /greenville,?\s*(sc|south carolina)/i;
const MAX_AGE_DAYS = 45;

// Leads with a posted range topping out under this are dropped. Postings with
// no salary info are kept — most boards outside CA/NY/CO don't publish one.
const SALARY_FLOOR = 150_000;

type Board = { company: string; ats: string; board_slug: string; connection_count: number };
type Lead = {
  company: string;
  title: string;
  location: string | null;
  url: string;
  posted_at: string | null;
  source: string;
  connection_count: number;
  salary_min: number | null;
  salary_max: number | null;
  salary_raw: string | null;
};

type Salary = { min: number; max: number; raw: string };

const MONEY_NUM = String.raw`(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)`;
const RANGE_RE = new RegExp(
  String.raw`\$\s*${MONEY_NUM}\s*([kK])?\s*(?:[-–—]|to)\s*\$?\s*${MONEY_NUM}\s*([kK])?`
);
const SINGLE_RE = new RegExp(String.raw`\$\s*${MONEY_NUM}\s*([kK])?`, "g");

function money(numStr: string, k?: string): number {
  const n = Number(numStr.replace(/,/g, ""));
  return Math.round(k ? n * 1000 : n);
}

// Annual USD sanity window — filters out hourly rates, bonuses, typos.
function plausible(n: number): boolean {
  return n >= 40_000 && n <= 2_000_000;
}

// Pull an annual USD range like "$150,000 - $190,000" or "$150K–$185K" out of
// posting text/HTML. Hourly rates fall outside the plausibility window.
function parseSalaryText(text?: string | null): Salary | null {
  if (!text) return null;
  const t = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:ndash|mdash|#8211|#8212|#x2013|#x2014);/gi, "-")
    .replace(/&[a-z#0-9]+;/gi, " ");
  const m = t.match(RANGE_RE);
  if (m) {
    // In "$150 - $190K" the bare first number is thousands shorthand too.
    const lo = money(m[1], m[2] ?? m[4]);
    const hi = money(m[3], m[4]);
    if (plausible(lo) && plausible(hi) && hi >= lo) {
      return { min: lo, max: hi, raw: m[0].trim() };
    }
  }
  for (const s of t.matchAll(SINGLE_RE)) {
    const n = money(s[1], s[2]);
    if (plausible(n)) return { min: n, max: n, raw: s[0].trim() };
  }
  return null;
}

function withSalary(
  lead: Omit<Lead, "salary_min" | "salary_max" | "salary_raw">,
  salary: Salary | null
): Lead {
  return {
    ...lead,
    salary_min: salary?.min ?? null,
    salary_max: salary?.max ?? null,
    salary_raw: salary?.raw ?? null,
  };
}

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

// "Posted Today" / "Posted Yesterday" / "Posted 6 Days Ago" / "Posted 30+ Days Ago"
function parseWorkdayPostedOn(text?: string): string | null | "stale" {
  if (!text) return null;
  if (/30\+/.test(text)) return "stale";
  const today = new Date();
  if (/today/i.test(text)) return today.toISOString().slice(0, 10);
  if (/yesterday/i.test(text)) {
    today.setDate(today.getDate() - 1);
    return today.toISOString().slice(0, 10);
  }
  const m = text.match(/(\d+)\s*days?\s*ago/i);
  if (m) {
    const days = Number(m[1]);
    if (days > MAX_AGE_DAYS) return "stale";
    today.setDate(today.getDate() - days);
    return today.toISOString().slice(0, 10);
  }
  return null;
}

function freshEnough(iso: string | null): boolean {
  if (!iso) return true; // no date on the board — keep it, dedupe handles noise
  const age = Date.now() - new Date(iso).getTime();
  return age < MAX_AGE_DAYS * 24 * 3600 * 1000;
}

function wantTitle(title: string): boolean {
  return TITLE_RE.test(title) && !TITLE_EXCLUDE_RE.test(title);
}

function wantLocation(loc: string): boolean {
  return REMOTE_RE.test(loc) || GREENVILLE_RE.test(loc);
}

async function scanBoard(b: Board): Promise<Lead[]> {
  const leads: Lead[] = [];
  if (b.ats === "greenhouse") {
    // content=true so the posting body comes along — pay ranges live in there
    const data = (await fetchJson(
      `https://boards-api.greenhouse.io/v1/boards/${b.board_slug}/jobs?content=true`
    )) as { jobs?: { title: string; absolute_url: string; location?: { name?: string }; updated_at?: string; first_published?: string; content?: string }[] } | null;
    for (const j of data?.jobs ?? []) {
      const loc = j.location?.name ?? "";
      const posted = j.first_published ?? j.updated_at ?? null;
      if (wantTitle(j.title) && wantLocation(loc) && freshEnough(posted)) {
        leads.push(
          withSalary(
            {
              company: b.company,
              title: j.title,
              location: loc || null,
              url: j.absolute_url,
              posted_at: posted ? posted.slice(0, 10) : null,
              source: "greenhouse",
              connection_count: b.connection_count,
            },
            parseSalaryText(j.content)
          )
        );
      }
    }
  } else if (b.ats === "lever") {
    const data = (await fetchJson(
      `https://api.lever.co/v0/postings/${b.board_slug}?mode=json`
    )) as { text: string; hostedUrl: string; createdAt?: number; workplaceType?: string; categories?: { location?: string }; salaryRange?: { min?: number; max?: number; currency?: string; interval?: string }; descriptionPlain?: string; additionalPlain?: string }[] | null;
    for (const j of data ?? []) {
      const loc = j.categories?.location ?? "";
      const locOk = j.workplaceType === "remote" || wantLocation(loc);
      const posted = j.createdAt ? new Date(j.createdAt).toISOString() : null;
      if (wantTitle(j.text) && locOk && freshEnough(posted)) {
        // Prefer Lever's structured salaryRange (annual USD only); fall back
        // to scraping the description.
        let salary: Salary | null = null;
        const sr = j.salaryRange;
        if (
          sr?.min &&
          sr?.max &&
          (!sr.currency || sr.currency === "USD") &&
          !/hour|week|month/i.test(sr.interval ?? "") &&
          plausible(sr.min) &&
          plausible(sr.max)
        ) {
          salary = {
            min: Math.round(sr.min),
            max: Math.round(sr.max),
            raw: `$${sr.min.toLocaleString("en-US")} - $${sr.max.toLocaleString("en-US")}`,
          };
        } else {
          // Lever pay-transparency blurbs usually land in the closing text
          salary = parseSalaryText(`${j.descriptionPlain ?? ""}\n${j.additionalPlain ?? ""}`);
        }
        leads.push(
          withSalary(
            {
              company: b.company,
              title: j.text,
              location: loc || (j.workplaceType === "remote" ? "Remote" : null),
              url: j.hostedUrl,
              posted_at: posted ? posted.slice(0, 10) : null,
              source: "lever",
              connection_count: b.connection_count,
            },
            salary
          )
        );
      }
    }
  } else if (b.ats === "workday") {
    // board_slug = "tenant|wdHost|site" — unofficial CXS endpoint behind
    // {tenant}.{host}.myworkdayjobs.com career pages. No auth needed.
    const [tenant, host, site] = b.board_slug.split("|");
    if (!tenant || !host || !site) return leads;
    const base = `https://${tenant}.${host}.myworkdayjobs.com`;
    let data: { jobPostings?: { title: string; externalPath: string; locationsText?: string; postedOn?: string }[] } | null = null;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${base}/wday/cxs/${tenant}/${encodeURIComponent(site)}/jobs`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" },
        body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "product manager" }),
        cache: "no-store",
      });
      clearTimeout(t);
      if (res.ok) data = await res.json();
    } catch {
      /* board unreachable today — skip */
    }
    for (const j of data?.jobPostings ?? []) {
      const posted = parseWorkdayPostedOn(j.postedOn);
      if (posted === "stale") continue; // "Posted 30+ Days Ago"
      const loc = j.locationsText ?? "";
      // "3 Locations" is opaque in the list response — provisionally keep it
      // and resolve the actual cities from the posting detail below.
      const maybeOk =
        wantLocation(loc) || /locations/i.test(loc) || REMOTE_RE.test(j.title);
      if (wantTitle(j.title) && maybeOk) {
        // Posting detail carries both the salary text and the real locations.
        const detail = (await fetchJson(
          `${base}/wday/cxs/${tenant}/${encodeURIComponent(site)}${j.externalPath}`
        )) as { jobPostingInfo?: { jobDescription?: string; location?: string; additionalLocations?: string[] } } | null;
        const info = detail?.jobPostingInfo;
        const detailLocs = [info?.location, ...(info?.additionalLocations ?? [])]
          .filter(Boolean)
          .join(" | ");
        const allLocs = detailLocs || loc;
        // With detail in hand, be strict: remote or Greenville, SC only. If
        // the detail fetch failed, fall back to what the list row showed.
        const locOk = info
          ? wantLocation(allLocs) || REMOTE_RE.test(j.title)
          : wantLocation(loc) || REMOTE_RE.test(j.title);
        if (!locOk) continue;
        leads.push(
          withSalary(
            {
              company: b.company,
              title: j.title,
              location: (info ? allLocs : loc) || null,
              url: `${base}/en-US/${site}${j.externalPath}`,
              posted_at: posted,
              source: "workday",
              connection_count: b.connection_count,
            },
            parseSalaryText(info?.jobDescription)
          )
        );
      }
    }
  } else if (b.ats === "ashby") {
    const data = (await fetchJson(
      `https://api.ashbyhq.com/posting-api/job-board/${b.board_slug}?includeCompensation=true`
    )) as { jobs?: { title: string; jobUrl?: string; applyUrl?: string; location?: string; isRemote?: boolean; publishedAt?: string; publishedDate?: string; compensation?: { compensationTierSummary?: string; scrapeableCompensationSalarySummary?: string } }[] } | null;
    for (const j of data?.jobs ?? []) {
      const loc = j.location ?? "";
      const locOk = j.isRemote === true || wantLocation(loc);
      const posted = j.publishedAt ?? j.publishedDate ?? null;
      const url = j.jobUrl ?? j.applyUrl;
      if (url && wantTitle(j.title) && locOk && freshEnough(posted)) {
        const comp =
          j.compensation?.compensationTierSummary ??
          j.compensation?.scrapeableCompensationSalarySummary;
        leads.push(
          withSalary(
            {
              company: b.company,
              title: j.title,
              location: loc || (j.isRemote ? "Remote" : null),
              url,
              posted_at: posted ? posted.slice(0, 10) : null,
              source: "ashby",
              connection_count: b.connection_count,
            },
            parseSalaryText(comp)
          )
        );
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

  // $150k floor: drop leads whose posted range tops out under it; leads with
  // no posted salary stay (unknown ≠ low).
  const paidEnough = all.filter(
    (l) => l.salary_max == null || l.salary_max >= SALARY_FLOOR
  );

  // dedupe within this run, then upsert on URL — merge (not ignore) so leads
  // scanned before the salary columns existed get theirs backfilled. Columns
  // absent from the payload (dismissed, found_at) are left untouched.
  const seen = new Set<string>();
  const unique = paidEnough.filter((l) => !seen.has(l.url) && seen.add(l.url));
  let upserted = 0;
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const res = await rest<unknown[]>(`personal_job_leads?on_conflict=url`, {
      method: "POST",
      body: JSON.stringify(chunk),
      prefer: "resolution=merge-duplicates,return=representation",
    });
    upserted += Array.isArray(res) ? res.length : 0;
  }

  return NextResponse.json({
    boards_scanned: scanned,
    matches_found: unique.length,
    below_salary_floor: all.length - paidEnough.length,
    upserted_leads: upserted,
  });
}
