<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Product docs

PRDs live in `docs/prds/`. The Betz CFB Pick'em PRD
(`docs/prds/PRD-cfb-pickem.md`) is the source of truth for the College
Football Pick'em game — its Decision Log records settled product decisions
(don't relitigate them), and its Open Questions section is the only list of
genuinely undecided items. The feature itself is built in the separate
`mrr0013-wde/betzgames` repo at `/cfb`; this repo just hosts the doc.
