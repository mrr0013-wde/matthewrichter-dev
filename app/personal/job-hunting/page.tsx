import {
  rest,
  type Application,
  type JobLead,
  type Connection,
  type Todo,
} from "@/lib/personal/db";
import { TodoSection, AppRow, LeadRow } from "./ui";

export const dynamic = "force-dynamic";

const ACTIVE_ORDER = ["offer", "interview", "screening", "applied", "outreach"];

export default async function JobHunting() {
  const [apps, leads, connections, todos] = await Promise.all([
    rest<Application[]>(
      "personal_applications?select=*&order=last_activity.desc.nullslast,date_applied.desc.nullslast"
    ),
    rest<JobLead[]>(
      // salary floor also applied here so pre-existing low-band leads hide
      "personal_job_leads?dismissed=eq.false&or=(salary_max.is.null,salary_max.gte.150000)&select=*&order=posted_at.desc.nullslast,connection_count.desc&limit=100"
    ),
    rest<Connection[]>(
      "personal_connections?select=first_name,last_name,company,position,url&company=not.is.null"
    ),
    rest<Todo[]>("personal_todos?done=eq.false&select=*&order=due_date.asc"),
  ]);

  const byCompany = new Map<string, Connection[]>();
  for (const c of connections) {
    const key = (c.company || "").toLowerCase().trim();
    if (!key) continue;
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key)!.push(c);
  }
  const whoAt = (company: string) =>
    byCompany.get(company.toLowerCase().trim()) ?? [];

  const current = apps.filter((a) => !a.archived);
  const archived = apps.filter((a) => a.archived);
  const sorted = [
    ...current
      .filter((a) => ACTIVE_ORDER.includes(a.status))
      .sort(
        (a, b) => ACTIVE_ORDER.indexOf(a.status) - ACTIVE_ORDER.indexOf(b.status)
      ),
    ...current.filter((a) => !ACTIVE_ORDER.includes(a.status)),
  ];

  const soonCutoff = new Date();
  soonCutoff.setDate(soonCutoff.getDate() + 7);
  const cutoffStr = soonCutoff.toISOString().slice(0, 10);
  const dueNow = todos.filter((t) => t.due_date <= cutoffStr);
  const later = todos.filter((t) => t.due_date > cutoffStr);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <p className="text-blue-500 font-mono text-sm tracking-wider mb-2">JOB HUNTING</p>
      <h1 className="text-4xl font-black mb-10">Tracker &amp; Finder</h1>

      <TodoSection dueNow={dueNow} later={later} apps={apps} />

      <section className="mb-16">
        <h2 className="text-2xl font-black mb-1">Applications</h2>
        <p className="text-sm text-[#737373] mb-5">
          Synced from Gmail daily. Click a row to expand; drag one up to To-Do.
        </p>
        <div className="space-y-2">
          {sorted.map((a) => (
            <AppRow key={a.id} a={a} whoAt={whoAt(a.company)} />
          ))}
          {sorted.length === 0 && (
            <p className="text-[#737373]">No applications tracked yet.</p>
          )}
        </div>
        {archived.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm text-[#737373] cursor-pointer hover:text-white transition-colors">
              Archived ({archived.length})
            </summary>
            <div className="space-y-2 mt-2 opacity-70">
              {archived.map((a) => (
                <AppRow key={a.id} a={a} whoAt={whoAt(a.company)} />
              ))}
            </div>
          </details>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-black mb-1">Job Finder</h2>
        <p className="text-sm text-[#737373] mb-5">
          Fresh PM roles — all levels, not just Senior — at companies where you
          have connections, scanned daily from their public job boards
          (Greenhouse, Lever, Ashby, Workday). Remote or Greenville, SC only;
          roles posting a range that tops out under $150k are filtered out.
          Newest postings first.
        </p>
        <div className="space-y-2">
          {leads.map((l) => (
            <LeadRow key={l.id} l={l} whoAt={whoAt(l.company)} />
          ))}
          {leads.length === 0 && (
            <p className="text-[#737373]">
              No open suggestions — the daily scan adds new ones as they&apos;re posted.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
