"use client";

import { useState, useTransition } from "react";
import type { Application, Connection, JobLead, Todo } from "@/lib/personal/db";
import {
  updateApplicationStatus,
  setApplicationArchived,
  dismissLead,
  addApplicationFromLead,
  addTodo,
  addFollowUpTodo,
  completeTodo,
  snoozeTodo,
} from "./actions";

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

function fmt(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d + (d.length === 10 ? "T12:00:00Z" : ""));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── To-Do section (drop target) ────────────────── */

export function TodoSection({
  dueNow,
  later,
  apps,
}: {
  dueNow: Todo[];
  later: Todo[];
  apps: Application[];
}) {
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const appById = new Map(apps.map((a) => [a.id, a]));

  return (
    <section
      className={`mb-14 rounded-2xl transition-colors ${dragOver ? "outline-2 outline-dashed outline-blue-500 bg-blue-500/5" : ""}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/app-id")) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = Number(e.dataTransfer.getData("text/app-id"));
        if (id) startTransition(() => addFollowUpTodo(id));
      }}
    >
      <h2 className="text-2xl font-black mb-1">To-Do</h2>
      <p className="text-sm text-[#737373] mb-4">
        Drag an application here to add a follow-up.{isPending && " Adding…"}
      </p>
      <div className="space-y-2">
        {dueNow.map((t) => (
          <TodoRow
            key={t.id}
            todo={t}
            app={t.application_id ? appById.get(t.application_id) : undefined}
            overdue={t.due_date < todayStr()}
          />
        ))}
        {dueNow.length === 0 && (
          <p className="text-sm text-[#737373]">Nothing due this week. 🎉</p>
        )}
      </div>
      {later.length > 0 && (
        <details className="mt-3">
          <summary className="text-sm text-[#737373] cursor-pointer hover:text-white transition-colors">
            Snoozed / later ({later.length})
          </summary>
          <div className="space-y-2 mt-2">
            {later.map((t) => (
              <TodoRow
                key={t.id}
                todo={t}
                app={t.application_id ? appById.get(t.application_id) : undefined}
                overdue={false}
              />
            ))}
          </div>
        </details>
      )}
      <details className="mt-4">
        <summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
          + Add a to-do
        </summary>
        <form action={addTodo} className="mt-3 flex flex-wrap gap-2 items-center">
          <input
            name="title"
            placeholder="What needs doing?"
            className="flex-1 min-w-52 rounded-lg border border-[#33373d] bg-[#14161a] px-3 py-2 text-sm text-[#ededed] focus:border-blue-500 focus:outline-none"
          />
          <input
            type="date"
            name="due_date"
            defaultValue={todayStr()}
            className="rounded-lg border border-[#33373d] bg-[#14161a] px-3 py-2 text-sm text-[#a3a3a3]"
          />
          <select
            name="application_id"
            defaultValue=""
            className="rounded-lg border border-[#33373d] bg-[#14161a] px-3 py-2 text-sm text-[#a3a3a3] max-w-44"
          >
            <option value="">No linked company</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>{a.company}</option>
            ))}
          </select>
          <button className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
            Add
          </button>
        </form>
      </details>
    </section>
  );
}

function TodoRow({ todo, app, overdue }: { todo: Todo; app?: Application; overdue: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-2.5 bg-[#1d2025] ${overdue ? "border-amber-500/40" : "border-[#33373d]"}`}
    >
      <span className="text-sm">{todo.title}</span>
      {app && (
        <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-xs">
          {app.company}
        </span>
      )}
      <span className={`text-xs ${overdue ? "text-amber-300 font-bold" : "text-[#737373]"}`}>
        {overdue ? "overdue · " : "due "}{fmt(todo.due_date)}
      </span>
      <div className="ml-auto flex gap-1.5">
        <form action={completeTodo}>
          <input type="hidden" name="id" value={todo.id} />
          <button className="text-xs px-2.5 py-1 rounded-lg bg-green-600/80 hover:bg-green-500 text-white font-bold transition-colors">
            Done
          </button>
        </form>
        <form action={snoozeTodo}>
          <input type="hidden" name="id" value={todo.id} />
          <input type="hidden" name="days" value="7" />
          <button className="text-xs px-2.5 py-1 rounded-lg border border-[#33373d] hover:border-[#404040] text-[#737373] hover:text-white transition-colors">
            😴 +1w
          </button>
        </form>
        <form action={snoozeTodo}>
          <input type="hidden" name="id" value={todo.id} />
          <input type="hidden" name="days" value="30" />
          <button className="text-xs px-2.5 py-1 rounded-lg border border-[#33373d] hover:border-[#404040] text-[#737373] hover:text-white transition-colors">
            😴 +1m
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Application row (draggable) ────────────────── */

export function AppRow({ a, whoAt }: { a: Application; whoAt: Connection[] }) {
  const [isPending, startTransition] = useTransition();
  return (
    <details
      className="rounded-xl border border-[#33373d] bg-[#1d2025] open:border-blue-500/30 transition-colors"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/app-id", String(a.id));
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      <summary className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="text-[#525252] cursor-grab select-none" title="Drag to To-Do">⠿</span>
        <span className="font-bold">{a.company}</span>
        <span className="text-[#a3a3a3] text-sm truncate max-w-72">{a.role}</span>
        <span
          className={`px-2 py-0.5 rounded border text-xs font-mono ${STATUS_STYLES[a.status] ?? STATUS_STYLES.applied}`}
        >
          {a.status}
        </span>
        {(a.notes || "").includes("ACTION NEEDED") && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-xs">
            ⚠ action
          </span>
        )}
        <span className="ml-auto text-xs text-[#737373]">{fmt(a.last_activity)}</span>
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-[#33373d]">
        <p className="text-xs text-[#737373] mb-2">
          {a.contact_name && (
            <>
              Contact: <span className="text-[#a3a3a3]">{a.contact_name}</span>
              {a.contact_email && ` (${a.contact_email})`} ·{" "}
            </>
          )}
          Applied {fmt(a.date_applied)} · Last activity {fmt(a.last_activity)}
          {a.job_url && (
            <>
              {" · "}
              <a href={a.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                posting ↗
              </a>
            </>
          )}
        </p>
        {a.notes && (
          <p className={`text-sm leading-relaxed whitespace-pre-line mb-2 ${a.notes.includes("ACTION NEEDED") ? "text-amber-300" : "text-[#a3a3a3]"}`}>
            {a.notes}
          </p>
        )}
        {whoAt.length > 0 && (
          <p className="text-xs text-[#737373] mb-3">
            You know:{" "}
            {whoAt.slice(0, 5).map((c, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <span className="text-[#a3a3a3]">{c.first_name} {c.last_name}</span> ({c.position})
              </span>
            ))}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <form action={updateApplicationStatus} className="flex items-center gap-2">
            <input type="hidden" name="id" value={a.id} />
            <select
              name="status"
              defaultValue={a.status}
              className="rounded-lg border border-[#33373d] bg-[#14161a] px-2 py-1 text-xs text-[#a3a3a3]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-[#33373d] hover:border-blue-500/40 text-[#a3a3a3] hover:text-white transition-colors">
              Update
            </button>
          </form>
          <button
            onClick={() => startTransition(() => addFollowUpTodo(a.id))}
            disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#33373d] hover:border-blue-500/40 text-[#a3a3a3] hover:text-white transition-colors disabled:opacity-50"
          >
            {isPending ? "Adding…" : "📌 + To-Do"}
          </button>
          <form action={setApplicationArchived} className="ml-auto">
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="archived" value={a.archived ? "false" : "true"} />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-[#33373d] hover:border-[#404040] text-[#737373] hover:text-white transition-colors">
              {a.archived ? "Unarchive" : "🗄 Archive"}
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}

/* ── Job lead row ───────────────────────────────── */

export function LeadRow({ l, whoAt }: { l: JobLead; whoAt: Connection[] }) {
  return (
    <details className="rounded-xl border border-[#33373d] bg-[#1d2025] open:border-blue-500/30 transition-colors">
      <summary className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="font-bold">{l.company}</span>
        <span className="text-[#a3a3a3] text-sm truncate max-w-72">{l.title}</span>
        {whoAt.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-300 border border-green-500/30 font-mono text-xs">
            {whoAt.length} 🤝
          </span>
        )}
        <span className="ml-auto text-xs text-[#737373]">
          {l.posted_at ? `posted ${fmt(l.posted_at)}` : l.source}
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-[#33373d]">
        <p className="text-sm text-[#a3a3a3] mb-2">
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            Open posting ↗
          </a>
          {l.location && <span className="text-[#737373]"> · {l.location}</span>}
        </p>
        {whoAt.length > 0 && (
          <p className="text-xs text-[#737373] mb-3">
            You know:{" "}
            {whoAt.slice(0, 5).map((c, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <span className="text-[#a3a3a3]">{c.first_name} {c.last_name}</span> ({c.position})
              </span>
            ))}
          </p>
        )}
        <div className="flex gap-2">
          <form action={addApplicationFromLead}>
            <input type="hidden" name="id" value={l.id} />
            <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
              I applied
            </button>
          </form>
          <form action={dismissLead}>
            <input type="hidden" name="id" value={l.id} />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-[#33373d] hover:border-[#404040] text-[#737373] hover:text-white transition-colors">
              Dismiss
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
