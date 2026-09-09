"use server";

import { revalidatePath } from "next/cache";
import { rest } from "@/lib/personal/db";
import { isAuthed } from "@/lib/personal/auth";

const STATUSES = [
  "outreach",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
];

export async function updateApplicationStatus(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!id || !STATUSES.includes(status)) return;
  await rest(`personal_applications?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      updated_at: new Date().toISOString(),
    }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}

export async function setApplicationArchived(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = Number(formData.get("id"));
  const archived = formData.get("archived") === "true";
  if (!id) return;
  await rest(`personal_applications?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ archived, updated_at: new Date().toISOString() }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}

export async function addTodo(formData: FormData) {
  if (!(await isAuthed())) return;
  const title = String(formData.get("title") ?? "").trim().slice(0, 300);
  const due = String(formData.get("due_date") ?? "").trim();
  const appId = Number(formData.get("application_id")) || null;
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return;
  await rest(`personal_todos`, {
    method: "POST",
    body: JSON.stringify({ title, due_date: due, application_id: appId }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}

export async function addFollowUpTodo(applicationId: number) {
  if (!(await isAuthed())) return;
  if (!applicationId) return;
  const apps = await rest<{ id: number; company: string; role: string }[]>(
    `personal_applications?id=eq.${applicationId}&select=id,company,role`
  );
  const app = apps?.[0];
  if (!app) return;
  const due = new Date();
  due.setDate(due.getDate() + 3);
  await rest(`personal_todos`, {
    method: "POST",
    body: JSON.stringify({
      title: `Follow up: ${app.company} (${app.role})`,
      due_date: due.toISOString().slice(0, 10),
      application_id: app.id,
    }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}

export async function completeTodo(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = Number(formData.get("id"));
  if (!id) return;
  await rest(`personal_todos?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ done: true }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}

export async function snoozeTodo(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = Number(formData.get("id"));
  const days = Number(formData.get("days"));
  if (!id || !days || days < 1 || days > 365) return;
  const rows = await rest<{ due_date: string }[]>(
    `personal_todos?id=eq.${id}&select=due_date`
  );
  const from = rows?.[0]?.due_date ? new Date(rows[0].due_date + "T12:00:00Z") : new Date();
  const base = from.getTime() < Date.now() ? new Date() : from; // snooze from today if overdue
  base.setDate(base.getDate() + days);
  await rest(`personal_todos?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ due_date: base.toISOString().slice(0, 10) }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}

export async function dismissLead(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = Number(formData.get("id"));
  if (!id) return;
  await rest(`personal_job_leads?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ dismissed: true }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}

export async function addApplicationFromLead(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = Number(formData.get("id"));
  if (!id) return;
  const leads = await rest<
    { company: string; title: string; url: string }[]
  >(`personal_job_leads?id=eq.${id}&select=company,title,url`);
  const lead = leads?.[0];
  if (!lead) return;
  try {
    await rest(`personal_applications`, {
      method: "POST",
      body: JSON.stringify({
        company: lead.company,
        role: lead.title,
        date_applied: new Date().toISOString().slice(0, 10),
        source: "manual",
        status: "applied",
        job_url: lead.url,
      }),
      prefer: "return=minimal",
    });
  } catch {
    // duplicate (company, role) — already tracked, that's fine
  }
  await rest(`personal_job_leads?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ dismissed: true }),
    prefer: "return=minimal",
  });
  revalidatePath("/personal/job-hunting");
}
