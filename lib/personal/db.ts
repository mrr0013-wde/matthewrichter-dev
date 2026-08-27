// Zero-dep Supabase PostgREST helper for the /personal section.
// Uses the service role key — server-side only. Never import from client components.

const strip = (v?: string) => (v ?? "").trim().replace(/^["']|["']$/g, "");
const SUPA_URL = strip(process.env.SUPABASE_URL);
const SUPA_KEY = strip(process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function rest<T = unknown>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T> {
  if (!SUPA_URL || !SUPA_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  const { prefer, ...rest } = init;
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: SUPA_KEY,
      authorization: `Bearer ${SUPA_KEY}`,
      "content-type": "application/json",
      prefer: prefer ?? "return=representation",
      ...(rest.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return null as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export type Application = {
  id: number;
  company: string;
  role: string;
  date_applied: string | null;
  source: string;
  contact_name: string | null;
  contact_email: string | null;
  status: string;
  last_activity: string | null;
  notes: string | null;
  job_url: string | null;
  archived: boolean;
};

export type JobLead = {
  id: number;
  company: string;
  title: string;
  location: string | null;
  url: string;
  posted_at: string | null;
  source: string;
  connection_count: number;
  found_at: string;
  dismissed: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_raw: string | null;
};

export type Todo = {
  id: number;
  title: string;
  due_date: string;
  application_id: number | null;
  done: boolean;
};

export type Connection = {
  first_name: string;
  last_name: string;
  company: string | null;
  position: string | null;
  url: string | null;
};
