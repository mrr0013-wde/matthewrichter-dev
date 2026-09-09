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
        <div className="w-full max-w-sm rounded-2xl border border-[#33373d] bg-[#1d2025] p-8 text-center">
          <p className="text-blue-500 font-mono text-xs tracking-wider mb-2">
            PRIVATE AREA
          </p>
          <h1 className="text-2xl font-black mb-6">Matthew only 🔒</h1>
          <a
            href="/api/personal/auth/login"
            className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
          >
            Sign in with Google
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-[#33373d] bg-[#14161a]">
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
