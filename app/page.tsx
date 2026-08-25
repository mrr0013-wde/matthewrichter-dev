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
            <a href="#experience" className="hover:text-white transition-colors hidden sm:inline">
              Experience
            </a>
            <a href="#approach" className="hover:text-white transition-colors hidden sm:inline">
              Approach
            </a>
            <a
              href="#contact"
              className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 items-center">
          <div className="max-w-3xl">
            <p className="text-blue-500 font-mono text-sm mb-4 tracking-wider">
              SENIOR PRODUCT MANAGER &middot; PRODUCT BUILDER
            </p>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              I turn ideas into
              <br />
              shipped products.
            </h1>
            <p className="text-lg sm:text-xl text-[#a3a3a3] leading-relaxed max-w-2xl mb-8">
              Senior Product Manager who owns products end to end &mdash; from
              customer discovery, roadmap strategy, and requirements writing to
              launch, measurement, and iteration. I&apos;ve shipped complex
              user-facing products, launched LLM-powered capabilities to
              enterprise customers, and built{" "}
              <a
                href="https://www.doudizhu.cards"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 font-medium"
              >
                doudizhu.cards
              </a>
              , a mobile-first global card game powered by AI.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <a
                href="https://www.doudizhu.cards"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#c0392b] hover:bg-[#96281b] text-white font-bold rounded-lg transition-colors shadow-lg shadow-[#c0392b]/25"
              >
                &#127183; Play Dou Dizhu
              </a>
              <a
                href="#experience"
                className="px-6 py-3 border border-[#262626] hover:border-[#404040] text-[#a3a3a3] hover:text-white font-bold rounded-lg transition-colors"
              >
                See my experience
              </a>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {["End-to-End Product Ownership", "Product Strategy & Roadmapping", "Generative AI Products", "Full-Stack Shipping"].map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full border border-[#262626] text-[#a3a3a3]">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Fanned Dou Dizhu cards */}
          <div className="hero-cards" aria-hidden="true">
            <div className="pcard pcard-1">
              <span className="pc-corner">3<em>&spades;</em></span>
              <span className="pc-pip">&spades;</span>
            </div>
            <div className="pcard pcard-2">
              <span className="pc-corner pc-red">A<em>&hearts;</em></span>
              <span className="pc-pip pc-red">&hearts;</span>
            </div>
            <div className="pcard pcard-3">
              <span className="pc-corner pc-red">&#26007;</span>
              <span className="pc-pip pc-red">&#22320;&#20027;</span>
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
            {/* Dou Dizhu — the flagship */}
            <ProjectCard
              flagship
              stats={[
                { num: "40,000+", label: "real plays the bots learn from" },
                { num: "Tens of thousands", label: "of possible endings searched per move" },
                { num: "Hundreds", label: "of identical deals a new bot must win before it ships" },
                { num: "iPhone SE", label: "the smallest real viewport it's tuned for" },
              ]}
              icon="&#127183;"
              title="Dou Dizhu — doudizhu.cards"
              subtitle="Free online card room for China's most popular card game, powered by AI"
              href="https://www.doudizhu.cards"
              linkLabel="doudizhu.cards"
              description='My flagship: a free, no-install card room for Dou Dizhu (&ldquo;Fight the Landlord&rdquo;). Created and owned end to end &mdash; from roadmap and mobile UX through implementation, launch, measurement, and iteration &mdash; taking a prototype into a real browser product with onboarding, public and private rooms, friend leaderboards, achievements, and a shared Daily Deal. The AI opponents actually put up a fight.'
              productDecisions={[
                "Took a prototype into a no-install browser product with onboarding, public and private rooms, friend leaderboards, achievements, and a shared Daily Deal everyone plays",
                "Room-based multiplayer with shareable join codes — send a link and play instantly, no account required",
                "Iterated the mobile experience across real iPhone viewports down to the iPhone SE",
                "Full Chinese card game rule engine: bombs, rockets, chain pairs, sequential triples with kickers — every legal hand type validated server-side",
              ]}
              technicalDetails={[
                "AI bots search tens of thousands of possible endings per move and learn from 40,000+ real plays",
                "Champion gauntlet: no new bot version ships unless it beats the reigning champion across hundreds of identical deals",
                "Every play instrumented with telemetry — bot mistakes ranked by frequency and win-rate impact to prioritize the roadmap",
                "Node.js + WebSocket server for real-time gameplay, hosted on Fly.io; server-authoritative game logic and persistent state so in-progress games survive restarts",
              ]}
              tags={["AI Game Bots", "Telemetry-Driven Roadmap", "Mobile-First UX", "Node.js", "WebSockets", "Fly.io", "Real-time Multiplayer"]}
            />

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
          </div>
        </div>
      </section>

      {/* Experience */}
      <section id="experience" className="py-20 px-6 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-500 font-mono text-sm mb-2 tracking-wider">
            WHERE I&apos;VE WORKED
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-12">Experience</h2>

          <div className="space-y-8">
            <JobCard
              company="Umbrage, part of Bain &amp; Company"
              role="Senior Product Manager"
              meta="May 2024 – Present · Greenville, SC (Remote)"
              groups={[
                {
                  heading: "Engagement with USAA",
                  bullets: [
                    "Owned product strategy, roadmap, backlog, and success metrics for USAA's member-facing ecosystem, translating a five-year target of more than 10 million unique visits into prioritized initiatives",
                    "Partnered with design and a multi-pod team of more than 40 front-end and back-end developers to ship intricate member-facing features from concept through launch and iteration, accelerating release cadence despite ongoing scope changes from external partners",
                    "Defined and implemented a reusable partner integration framework of reference workflows, templates, and system readiness milestones, so that onboarding a new partner became repeatable configuration rather than a bespoke build each time",
                    "Used member research and survey data on digital vs. in-person preferences to form and validate product hypotheses, champion member needs, and influence roadmap decisions across related initiatives",
                    "Managed and mentored associate product managers and coached cross-functional teams on how to optimize delivery, refine backlogs, and manage stakeholders",
                    "Introduced agile process improvements that lifted sprint predictability and velocity by 20%",
                  ],
                },
                {
                  heading: "Engagement with Capital One",
                  bullets: [
                    "Defined the product vision and strategy for Capital One's transformation of its internal core Transaction Authorization and Restrictions platforms; focused on improving ledger integrity and customer-facing capabilities",
                    "Created PRDs for the transformation initiative; defined a new real-time rules engine integrating Overdraft and Stop Payments systems to replace legacy processing logic",
                    "Translated PRDs into actionable epics and user stories, roadmapped the full Jira backlog into a cross-functional execution plan, and partnered with QA and internal stakeholders to ensure development readiness",
                    "Worked with cross-functional teams in a highly regulated environment to define requirements and mitigate regulatory and technical risk before automated decisioning went to production",
                  ],
                },
              ]}
            />

            <JobCard
              company="Simplr"
              role="Senior Product Manager"
              meta="Apr 2023 – Apr 2024 · Greenville, SC (Remote)"
              groups={[
                {
                  bullets: [
                    "Defined and shipped LLM-powered capabilities to enterprise customers, aligning machine learning, customer success, engineering, and quality assurance on product requirements, evaluation criteria, and quality and safety thresholds for launch",
                    "Standardized and optimized critical path work processes across seven teams, enhancing communication channels between them, which led to a 20% increase in average sprint velocity",
                    "Consolidated disparate roadmaps from multiple engineering and ML teams into a cohesive and coherent plan with a clear strategic direction for senior leadership and stakeholders",
                    'Orchestrated cross-functional "Quarterly Goal" meetings, which led to consistent >100% goal completion',
                  ],
                },
              ]}
            />

            <JobCard
              company="Capital One"
              role="Principal Associate, Agile Delivery Lead (Proxy and DNS, DHCP, IPAM) &amp; Product Owner"
              meta="Sep 2021 – Mar 2023 · Greenville, SC (Remote)"
              groups={[
                {
                  bullets: [
                    'Awarded "Product Idea Most Likely to be Patented" in Capital One\'s Product Bootcamp capstone project',
                    "Established program requirements, key metrics, strategic drivers, and training for a new product used by 20+ engineering teams, resulting in rapid onboarding three months ahead of schedule",
                    "Built an OKR-driven dashboard used by 10+ engineering teams to give accountable executives the structure and visibility to focus on essential business needs and saved data analysts 1,200 hours per year",
                    "Organized quarterly planning sessions for five related teams by facilitating roadmap integrations, critical paths, and next steps, enabling the teams to complete 90% of their tasks on time and error-free",
                  ],
                },
              ]}
            />

            <JobCard
              company="Whomi"
              role="Product Manager &amp; Team Lead"
              meta="May 2021 – Aug 2021 · Morrisville, NC"
              groups={[
                {
                  bullets: [
                    "Negotiated deals and established new client base for university/alum relations product, designed implementation plans from pitch to close, and translated client needs to engineering and design teams",
                    "Mapped the product across user groups through qualitative interviews with internal and external stakeholders, continuously refining personas and translating customer insights into go-to-market strategy",
                    "Recruited and managed a five-member cross-functional team focused on developing the strategy, defining the product, analyzing competition, and launching the flagship version of Whomi University",
                  ],
                },
              ]}
            />

            <JobCard
              company="Bechtel Oil, Gas, &amp; Chemicals"
              role="Corporate Strategy and Business Development Associate"
              meta="Jun 2014 – Jul 2019 · Houston, TX &amp; Soyo, Angola"
              groups={[
                {
                  bullets: [
                    "Identified gaps and redundancies in the marketing strategy for a significant product and redeveloped the system by identifying, centralizing, and enabling key players, resulting in $1B of new contracts",
                    "Selected to join the on-site implementation team for a multi-billion-dollar energy megaproject in Soyo, Angola; identified problems and communicated solution strategies to groups ranging from safety-critical construction and commissioning operations up to the CEO, resulting in $10B savings",
                    "Mobilized and guided a team of 25 engineers to find solutions to 900+ unresolved tickets in two months, triaged backlog in daily stand-ups and weekly check-ins to achieve a $10M return for the client",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Education & Skills */}
      <section id="education" className="py-20 px-6 border-t border-[#262626]">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-500 font-mono text-sm mb-2 tracking-wider">
            EDUCATION &amp; SKILLS
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-12">Background</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-8">
              <h3 className="text-xl font-black mb-1">The University of North Carolina</h3>
              <p className="text-sm text-[#737373] mb-3">
                Kenan-Flagler Business School &middot; Chapel Hill, NC
              </p>
              <p className="text-[#a3a3a3] font-medium mb-1">
                Master of Business Administration, Full-Time MBA Program &middot; GMAT 700
              </p>
              <p className="text-sm text-[#737373] mb-4">Aug 2019 – May 2021</p>
              <ul className="text-sm text-[#a3a3a3] space-y-1">
                <li>&bull; MBA Student Ambassador</li>
                <li>&bull; Dean&apos;s Advancement Council Co-Chair</li>
                <li>&bull; Legacy Class Representative</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#262626] bg-[#141414] p-8">
              <h3 className="text-xl font-black mb-1">Auburn University</h3>
              <p className="text-sm text-[#737373] mb-3">Auburn, AL</p>
              <p className="text-[#a3a3a3] font-medium mb-1">
                Bachelor of Science in Mechanical Engineering
              </p>
              <p className="text-sm text-[#737373]">Aug 2010 – May 2014</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-white mb-3">Core skills</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "End-to-End Product Ownership",
                  "Product Strategy & Roadmapping",
                  "Mobile & Web Products",
                  "Customer Discovery & Research",
                  "Success Metrics & Data-Driven Decisions",
                  "Cross-Functional Leadership",
                  "PRDs & Execution Plans",
                  "Generative AI Products",
                ].map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-full border border-[#262626] text-sm text-[#a3a3a3]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white mb-3">Tools</h3>
              <div className="flex flex-wrap gap-2">
                {["Jira", "Confluence", "Tableau", "Python", "SQL", "Figma", "Orange3", "JMP Pro", "MATLAB"].map((t) => (
                  <span key={t} className="px-2 py-1 rounded text-xs font-mono bg-[#1a1a2e] text-blue-400 border border-blue-500/20">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white mb-3">AI</h3>
              <p className="text-[#a3a3a3] text-sm leading-relaxed max-w-3xl">
                LLM and agent workflows (Claude, ChatGPT) used daily for PRDs,
                research synthesis, and prototyping; RAG and evaluation
                frameworks.
              </p>
            </div>
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

      {/* Contact */}
      <section id="contact" className="py-20 px-6 border-t border-[#262626]">
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
  flagship,
  stats,
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
  flagship?: boolean;
  stats?: { num: string; label: string }[];
}) {
  const linkColor = flagship
    ? "text-[#e2b13c] hover:text-[#f0c65e]"
    : "text-blue-500 hover:text-blue-400";
  return (
    <div
      className={
        flagship
          ? "group rounded-2xl border border-[#c0392b]/40 bg-[#141414] p-8 hover:border-[#c0392b]/70 transition-all shadow-lg shadow-[#c0392b]/10"
          : "group rounded-2xl border border-[#262626] bg-[#141414] p-8 hover:border-blue-500/30 transition-all"
      }
    >
      {flagship && (
        <p className="font-mono text-xs tracking-wider text-[#e2b13c] mb-4">
          THE FLAGSHIP PROJECT
        </p>
      )}
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
          className={`ml-auto text-sm font-medium shrink-0 ${linkColor}`}
        >
          {linkLabel} &#8599;
        </a>
      </div>
      <p className="text-[#a3a3a3] leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: description }} />
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#c0392b]/25 bg-[#0a0a0a] p-4"
            >
              <span className="block font-bold text-[#e2b13c] mb-1">{s.num}</span>
              <span className="text-xs text-[#a3a3a3] leading-snug">{s.label}</span>
            </div>
          ))}
        </div>
      )}
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
            className={
              flagship
                ? "px-2 py-1 rounded text-xs font-mono bg-[#2e1a1a] text-[#e2b13c] border border-[#c0392b]/30"
                : "px-2 py-1 rounded text-xs font-mono bg-[#1a1a2e] text-blue-400 border border-blue-500/20"
            }
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

function JobCard({
  company,
  role,
  meta,
  groups,
}: {
  company: string;
  role: string;
  meta: string;
  groups: { heading?: string; bullets: string[] }[];
}) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-[#141414] p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h3 className="text-xl font-black" dangerouslySetInnerHTML={{ __html: company }} />
        <p className="text-sm text-[#737373]" dangerouslySetInnerHTML={{ __html: meta }} />
      </div>
      <p className="text-blue-400 font-medium text-sm mb-4" dangerouslySetInnerHTML={{ __html: role }} />
      <div className="space-y-4 text-sm">
        {groups.map((g, i) => (
          <div key={i}>
            {g.heading && <h4 className="font-bold text-white mb-1">{g.heading}</h4>}
            <ul className="text-[#a3a3a3] space-y-1">
              {g.bullets.map((b, j) => (
                <li key={j}>&bull; {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
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
