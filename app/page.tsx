export default function Home() {
  return (
    <main className="flex-1">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#0a0a0a]/80 border-b border-[#262626]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-sm font-bold tracking-tight">
            matthew<span className="text-blue-500">richter</span>.dev
          </span>
          <div className="flex items-center gap-6 text-sm text-[#737373]">
            <a href="#projects" className="hover:text-white transition-colors">
              Projects
            </a>
            <a href="#approach" className="hover:text-white transition-colors">
              Approach
            </a>
            <a
              href="mailto:matthew.r.richter@gmail.com"
              className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-blue-500 font-mono text-sm mb-4 tracking-wider">
              PRODUCT BUILDER
            </p>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              I turn ideas into
              <br />
              shipped products.
            </h1>
            <p className="text-lg sm:text-xl text-[#a3a3a3] leading-relaxed max-w-2xl mb-8">
              Product manager who builds. I scope features, design systems,
              manage production infrastructure, and ship real software used by
              real people &mdash; leveraging AI-assisted development to move at
              startup speed as a solo operator.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              {["Product Strategy", "Full-Stack Shipping", "AI-Assisted Development", "Supabase / Vercel / Fly.io"].map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full border border-[#262626] text-[#a3a3a3]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-500 font-mono text-sm mb-2 tracking-wider">
            WHAT I&apos;VE SHIPPED
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-12">Projects</h2>

          <div className="space-y-8">
            {/* BetzGolf */}
            <ProjectCard
              icon="&#9971;"
              title="BetzGolf"
              subtitle="Fantasy golf draft platform"
              href="https://betzgames.com/golf"
              linkLabel="betzgames.com"
              description="A full-stack fantasy golf platform where friend groups draft PGA golfers before each tournament and compete for real money based on how their golfers finish. Think fantasy football, but for golf, with a live snake draft, real-time leaderboards, and dynamic payout calculations."
              productDecisions={[
                "Designed a snake draft system with SMS-driven pick notifications — no app download required, players draft from a text message link",
                "Built dynamic payout configuration so each tournament can have custom prize structures (winner-take-all to PGA-style top-15 splits)",
                "Created a championship-prediction mini-game (pick NBA winners to determine golf draft order) that drives engagement before the draft even starts",
                "Multi-clubhouse architecture — each friend group gets their own tournaments, rosters, and standings",
              ]}
              technicalDetails={[
                "Next.js 14 App Router + Supabase (Postgres, Auth, Realtime) + Vercel",
                "JSONB-based draft state with optimistic locking (CAS) for concurrent pick handling",
                "DataGolf API integration syncing live leaderboard data every 5 minutes during tournaments",
                "Post-draft trade system with proposal/accept lifecycle and SMS notifications",
              ]}
              warStories={[
                "Diagnosed and resolved a full site outage caused by Supabase connection saturation from aggressive client polling — reduced polling from 10s to 5min intervals, added Postgres safety valves, upgraded compute tier",
                "Fixed Vercel Edge Middleware 504s by eliminating all network calls from middleware — pure cookie-based auth check, zero Supabase imports, 74KB to 26KB bundle",
              ]}
              tags={["Next.js", "TypeScript", "Supabase", "Vercel", "Tailwind", "Realtime WebSockets", "SMS / SheetSMS", "DataGolf API"]}
            />

            {/* World Cup 2026 */}
            <ProjectCard
              icon="&#9917;"
              title="World Cup 2026 Prediction Game"
              subtitle="Full-tournament bracket prediction platform"
              href="https://betzgames.com/2026WC"
              linkLabel="betzgames.com/2026WC"
              description="A prediction game for the 2026 FIFA World Cup’s new 48-team, 12-group format. Players predict winners, draws, and first-to-score for all 72 group stage matches, build a complete 32-match knockout bracket, and compete on a live leaderboard as the tournament unfolds."
              productDecisions={[
                "Designed a scoring system that rewards precision (correct result + first scorer) with escalating points through knockout rounds — 2pts for group stage, up to 32pts for the Final",
                "Built support for multiple brackets per user so players can submit a “gut feel” bracket and a “data-driven” bracket without choosing between strategies",
                "Created an automatic standings engine that handles FIFA’s complex third-place qualification rules (8 of 12 third-place teams advance) and bracket reseeding",
                "$25 buy-in with Venmo QR code integration — zero friction payment collection",
              ]}
              technicalDetails={[
                "Client-side bracket resolution engine implementing FIFA Annex C (third-place team assignment to knockout brackets based on which groups they come from)",
                "JSONB-based bracket storage — single column stores all 104 picks per bracket with live validation",
                "Integrated into the BetzGames multi-game platform alongside BetzGolf with shared auth and user accounts",
              ]}
              tags={["Next.js", "TypeScript", "Supabase", "FIFA Annex C Logic", "Bracket Engine", "Real-time Leaderboard"]}
            />

            {/* Dou Dizhu */}
            <ProjectCard
              icon="&#127183;"
              title="Dou Dizhu"
              subtitle="Real-time multiplayer card game"
              href="https://dou-dizhu-mrr.fly.dev"
              linkLabel="dou-dizhu-mrr.fly.dev"
              description='A web-based implementation of Dou Dizhu (&ldquo;Fight the Landlord&rdquo;), China&apos;s most popular card game. Three players join a room, bid to become the landlord, then play in real-time with full rule enforcement, hand validation, and persistent game state.'
              productDecisions={[
                "Room-based multiplayer with shareable join codes — send a link and play instantly, no account required",
                "Full Chinese card game rule engine: bombs, rockets, chain pairs, sequential triples with kickers — every legal hand type validated server-side",
                "Persistent game state via mounted volumes so in-progress games survive server restarts",
              ]}
              technicalDetails={[
                "Node.js + WebSocket server for real-time gameplay — sub-100ms latency between players",
                "Hosted on Fly.io with auto-start/auto-stop machines to minimize cost during idle periods",
                "Server-authoritative game logic prevents cheating — all hand validation and turn management runs server-side",
              ]}
              tags={["Node.js", "WebSockets", "Fly.io", "Docker", "Real-time Multiplayer", "Game Logic Engine"]}
            />
          </div>
        </div>
      </section>

      {/* Approach */}
      <section id="approach" className="py-20 px-6 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-500 font-mono text-sm mb-2 tracking-wider">
            HOW I WORK
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-6">
            AI-Assisted, Product-Led
          </h2>
          <div className="max-w-3xl">
            <p className="text-[#a3a3a3] text-lg leading-relaxed mb-8">
              I use Claude and other AI tools to write code faster &mdash; but the
              product thinking is mine. Every feature starts with a user problem,
              gets scoped into a clear spec, and ships with production
              monitoring. AI accelerates the build; it doesn&apos;t replace the
              decisions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ApproachCard
                icon="&#127919;"
                title="Product Vision"
                text="I identify the user need, define the MVP, and make scope trade-offs. BetzGolf started as an Excel spreadsheet &mdash; I turned it into a multi-clubhouse platform because I understood what the users actually needed."
              />
              <ApproachCard
                icon="&#9889;"
                title="Rapid Iteration"
                text="AI-assisted development lets me ship features in hours instead of weeks. I write PRDs, review generated code, debug production issues, and deploy &mdash; all in the same session."
              />
              <ApproachCard
                icon="&#128295;"
                title="Production Ops"
                text="I don&apos;t just ship and forget. I monitor Supabase connection pools, debug Vercel middleware timeouts, and upgrade infrastructure at 2am when the site goes down during a live draft."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Resume CTA */}
      <section className="py-20 px-6 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Let&apos;s Build Something
          </h2>
          <p className="text-[#a3a3a3] text-lg mb-8 max-w-xl mx-auto">
            I&apos;m a product manager who can also ship. If you need someone
            who bridges the gap between strategy and execution, let&apos;s talk.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:matthew.r.richter@gmail.com"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
            >
              Get in Touch
            </a>
            <a
              href="https://www.linkedin.com/in/matthew-richter"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-[#262626] hover:border-[#404040] text-[#a3a3a3] hover:text-white font-bold rounded-lg transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[#525252]">
          <span>Matthew Richter</span>
          <span>Greenville, SC</span>
        </div>
      </footer>
    </main>
  );
}

/* ─── Components ─────────────────────────────────────────── */

function ProjectCard({
  icon,
  title,
  subtitle,
  href,
  linkLabel,
  description,
  productDecisions,
  technicalDetails,
  warStories,
  tags,
}: {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
  description: string;
  productDecisions: string[];
  technicalDetails: string[];
  warStories?: string[];
  tags: string[];
}) {
  return (
    <div className="group rounded-2xl border border-[#262626] bg-[#141414] p-8 hover:border-blue-500/30 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl" dangerouslySetInnerHTML={{ __html: icon }} />
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="text-sm text-[#737373]">{subtitle}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm text-blue-500 hover:text-blue-400 font-medium shrink-0"
        >
          {linkLabel} &#8599;
        </a>
      </div>
      <p className="text-[#a3a3a3] leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: description }} />
      <div className="space-y-4 text-sm">
        <DetailSection title="Product Decisions" items={productDecisions} />
        <DetailSection title="Technical Architecture" items={technicalDetails} />
        {warStories && warStories.length > 0 && (
          <DetailSection title="Production War Stories" items={warStories} />
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-5">
        {tags.map((t) => (
          <span
            key={t}
            className="px-2 py-1 rounded text-xs font-mono bg-[#1a1a2e] text-blue-400 border border-blue-500/20"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-bold text-white mb-1">{title}</h4>
      <ul className="text-[#a3a3a3] space-y-1">
        {items.map((item, i) => (
          <li key={i}>&bull; {item}</li>
        ))}
      </ul>
    </div>
  );
}

function ApproachCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#141414] p-5">
      <div className="text-2xl mb-3" dangerouslySetInnerHTML={{ __html: icon }} />
      <h4 className="font-bold mb-2">{title}</h4>
      <p className="text-sm text-[#737373] leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}
