import { NextRequest, NextResponse } from "next/server";
import { rest, type Application } from "@/lib/personal/db";

// Receives daily job-application events from the Gmail Apps Script
// (scripts/gmail-job-sync.gs). Auth: x-internal-secret header.
//
// Body: { events: [{ kind, company, role, date, contact_name, contact_email,
//                    subject, gmail_thread_id }] }
// kind: applied | interview | rejected | offer | update

const RANK: Record<string, number> = {
  outreach: 0,
  applied: 1,
  screening: 2,
  interview: 3,
  offer: 4,
};

type Event = {
  kind: string;
  company: string;
  role?: string;
  date?: string;
  contact_name?: string;
  contact_email?: string;
  subject?: string;
  gmail_thread_id?: string;
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { events?: Event[] } | null;
  const events = (body?.events ?? []).slice(0, 100);
  let created = 0;
  let updated = 0;

  for (const ev of events) {
    const company = (ev.company || "").trim();
    if (!company) continue;
    const date = (ev.date || new Date().toISOString()).slice(0, 10);

    const matches = await rest<Application[]>(
      `personal_applications?company=ilike.${encodeURIComponent("*" + company + "*")}&select=*&order=last_activity.desc.nullslast&limit=1`
    );
    const app = matches?.[0];

    if (app) {
      const patch: Record<string, unknown> = {
        last_activity: date,
        updated_at: new Date().toISOString(),
      };
      if (ev.kind === "rejected") patch.status = "rejected";
      else if (ev.kind === "offer") patch.status = "offer";
      else if (
        ev.kind === "interview" &&
        (RANK[app.status] ?? -1) >= 0 &&
        (RANK[app.status] ?? 0) < RANK.interview
      ) {
        patch.status = "interview";
      }
      if (ev.subject) {
        const stamp = `[${date}] ${ev.subject}`;
        if (!(app.notes || "").includes(stamp)) {
          patch.notes = ((app.notes || "") + `\n${stamp}`).trim();
        }
      }
      await rest(`personal_applications?id=eq.${app.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        prefer: "return=minimal",
      });
      updated++;
    } else {
      try {
        await rest(`personal_applications`, {
          method: "POST",
          body: JSON.stringify({
            company,
            role: ev.role || "Product Manager (from email)",
            date_applied: ev.kind === "applied" ? date : null,
            source: "gmail",
            contact_name: ev.contact_name || null,
            contact_email: ev.contact_email || null,
            status: ev.kind === "rejected" ? "rejected" : ev.kind === "interview" ? "interview" : "applied",
            last_activity: date,
            notes: ev.subject ? `[${date}] ${ev.subject}` : null,
            gmail_thread_id: ev.gmail_thread_id || null,
          }),
          prefer: "return=minimal",
        });
        created++;
      } catch {
        // duplicate (company, role) — treat as noise
      }
    }
  }

  return NextResponse.json({ received: events.length, created, updated });
}
