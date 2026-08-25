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
