import type { Metadata } from "next";
import { isAuthed } from "@/lib/personal/auth";

export const metadata: Metadata = {
  title: "Personal | Matthew Richter",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PersonalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authed = await isAuthed();

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <form
          method="POST"
          action="/api/personal/login"
          className="w-full max-w-sm rounded-2xl border border-[#262626] bg-[#141414] p-8"
        >
          <p className="text-blue-500 font-mono text-xs tracking-wider mb-2">
            PRIVATE AREA
          </p>
          <h1 className="text-2xl font-black mb-6">Enter password</h1>
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-lg border border-[#262626] bg-[#0a0a0a] px-4 py-3 mb-4 text-[#ededed] focus:border-blue-500 focus:outline-none"
            placeholder="Password"
          />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
          >
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-[#262626] bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6 text-sm">
          <a href="/personal" className="font-mono font-bold text-[#ededed]">
            personal<span className="text-blue-500">.</span>
          </a>
          <a href="/personal/job-hunting" className="text-[#737373] hover:text-white transition-colors">
            Job Hunting
          </a>
          <a href="/personal/family-finance" className="text-[#737373] hover:text-white transition-colors">
            Family Finance
          </a>
          <a href="/" className="ml-auto text-[#737373] hover:text-white transition-colors">
            ← matthewrichter.dev
          </a>
        </div>
      </nav>
      {children}
    </main>
  );
}
