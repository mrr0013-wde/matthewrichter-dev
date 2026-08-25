export default function PersonalHub() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <p className="text-blue-500 font-mono text-sm tracking-wider mb-2">
        PRIVATE
      </p>
      <h1 className="text-4xl font-black mb-10">Personal</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <a
          href="/personal/job-hunting"
          className="rounded-2xl border border-[#33373d] bg-[#1d2025] p-8 hover:border-blue-500/40 transition-all"
        >
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-xl font-black mb-2">Job Hunting</h2>
          <p className="text-sm text-[#a3a3a3]">
            Application tracker + daily job finder, prioritized by where you
            have connections.
          </p>
        </a>
        <a
          href="/personal/family-finance"
          className="rounded-2xl border border-[#33373d] bg-[#1d2025] p-8 hover:border-blue-500/40 transition-all"
        >
          <div className="text-3xl mb-3">💰</div>
          <h2 className="text-xl font-black mb-2">Family Finance</h2>
          <p className="text-sm text-[#a3a3a3]">Coming soon.</p>
        </a>
      </div>
    </div>
  );
}
