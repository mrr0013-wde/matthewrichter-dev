import {
  rest,
  type Application,
  type JobLead,
  type Connection,
} from "@/lib/personal/db";
import {
  updateApplicationStatus,
  dismissLead,
  addApplicationFromLead,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  outreach: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  applied: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  screening: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  interview: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  offer: "bg-green-500/15 text-green-300 border-green-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  withdrawn: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
  ghosted: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
};
const STATUSES = Object.keys(STATUS_STYLES);
const ACTIVE_ORDER = ["offer", "interview", "screening", "applied", "outreach"];

function fmt(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d + (d.length === 10 ? "T12:00:00Z" : ""));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function JobHunting() {
  const [apps, leads, connections] = await Promise.all([
    rest<Application[]>(
      "personal_applications?select=*&order=last_activity.desc.nullslast,date_applied.desc.nullslast"
    ),
    rest<JobLead[]>(
      "personal_job_leads?dismissed=eq.false&select=*&order=connection_count.desc,posted_at.desc.nullslast&limit=100"
    ),
    rest<Connection[]>(
      "personal_connections?select=first_name,last_name,company,position,url&company=not.is.null"
    ),
  ]);

  const byCompany = new Map<string, Connection[]>();
  for (const c of connections) {
    const key = (c.company || "").toLowerCase().trim();
    if (!key) continue;
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key)!.push(c);
  }
  const whoAt = (company: string) => byCompany.get(company.toLowerCase().trim()) ?? [];

  const active = apps
    .filter((a) => ACTIVE_ORDER.includes(a.status))
    .sort((a, b) => ACTIVE_ORDER.indexOf(a.status) - ACTIVE_ORDER.indexOf(b.status));
  const closed = apps.filter((a) => !ACTIVE_ORDER.includes(a.status));

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <p className="text-blue-500 font-mono text-sm tracking-wider mb-2">JOB HUNTING</p>
      <h1 className="text-4xl font-black mb-10">Tracker &amp; Finder</h1>

      {/* ── Applications ─────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-black mb-1">Applications</h2>
        <p className="text-sm text-[#737373] mb-6">
          Synced from Gmail daily. Change a status any time — your edits win.
        </p>
        <div className="space-y-4">
          {[...active, ...closed].map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-[#262626] bg-[#141414] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-lg font-black">
                    {a.company}
                    <span className="text-[#737373] font-medium"> · {a.role}</span>
                  </h3>
                  <p className="text-xs text-[#737373] mt-1">
                    {a.contact_name && <>Contact: {a.contact_name} · </>}
                    Applied {fmt(a.date_applied)} · Last activity {fmt(a.last_activity)}
                  </p>
                </div>
                <form action={updateApplicationStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <span
                    className={`px-2 py-1 rounded border text-xs font-mono ${STATUS_STYLES[a.status] ?? STATUS_STYLES.applied}`}
                  >
                    {a.status}
                  </span>
                  <select
                    name="status"
                    defaultValue={a.status}
                    className="rounded-lg border border-[#262626] bg-[#0a0a0a] px-2 py-1 text-xs text-[#a3a3a3]"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button className="text-xs px-3 py-1.5 rounded-lg border border-[#262626] hover:border-blue-500/40 text-[#a3a3a3] hover:text-white transition-colors">
                    Update
                  </button>
                </form>
              </div>
              {a.notes && (
                <p className={`text-sm leading-relaxed ${a.notes.includes("ACTION NEEDED") ? "text-amber-300" : "text-[#a3a3a3]"}`}>
                  {a.notes}
                </p>
              )}
              {whoAt(a.company).length > 0 && (
                <p className="text-xs text-[#737373] mt-2">
                  You know:{" "}
                  {whoAt(a.company).slice(0, 4).map((c, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      <span className="text-[#a3a3a3]">
                        {c.first_name} {c.last_name}
                      </span>{" "}
                      ({c.position})
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
          {apps.length === 0 && (
            <p className="text-[#737373]">No applications tracked yet.</p>
          )}
        </div>
      </section>

      {/* ── Job Finder ───────────────────────────── */}
      <section>
        <h2 className="text-2xl font-black mb-1">Job Finder</h2>
        <p className="text-sm text-[#737373] mb-6">
          Fresh Product Manager roles at companies where you have connections,
          scanned daily from their public job boards. Ranked by who you know.
        </p>
        <div className="space-y-4">
          {leads.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-[#262626] bg-[#141414] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition-colors"
                    >
                      {l.title} ↗
                    </a>
                  </h3>
                  <p className="text-sm text-[#a3a3a3] mt-1">
                    {l.company}
                    {l.location && <span className="text-[#737373]"> · {l.location}</span>}
                    {l.posted_at && <span className="text-[#737373]"> · posted {fmt(l.posted_at)}</span>}
                  </p>
                  {whoAt(l.company).length > 0 && (
                    <p className="text-xs text-[#737373] mt-2">
                      <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-300 border border-green-500/30 font-mono mr-2">
                        {whoAt(l.company).length} connection{whoAt(l.company).length > 1 ? "s" : ""}
                      </span>
                      {whoAt(l.company).slice(0, 3).map((c, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <span className="text-[#a3a3a3]">{c.first_name} {c.last_name}</span> ({c.position})
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={addApplicationFromLead}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
                      I applied
                    </button>
                  </form>
                  <form action={dismissLead}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="text-xs px-3 py-1.5 rounded-lg border border-[#262626] hover:border-[#404040] text-[#737373] hover:text-white transition-colors">
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <p className="text-[#737373]">
              No open suggestions right now — the daily scan will add new ones
              as they&apos;re posted.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
