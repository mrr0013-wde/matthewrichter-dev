/**
 * Gmail → matthewrichter.dev job-application sync.
 *
 * Runs inside YOUR Google account (no OAuth apps, no tokens to manage) and
 * posts application activity to /api/personal/gmail-sync once a day.
 *
 * ── Setup (one time, ~3 minutes) ─────────────────────────────────────────
 * 1. Go to https://script.google.com → New project. Paste this whole file.
 * 2. Project Settings (gear icon) → Script Properties → add two properties:
 *      ENDPOINT = https://matthewrichter.dev/api/personal/gmail-sync
 *      SECRET   = <the CRON_SECRET value from the Vercel project env>
 *    (Get it with: vercel env pull inside the matthewrichter-dev repo.)
 * 3. Triggers (clock icon) → Add Trigger:
 *      function: dailySync · event source: Time-driven · Day timer · 7-8am.
 * 4. Run dailySync once manually to grant the Gmail permission prompt.
 * ─────────────────────────────────────────────────────────────────────────
 */

var LOOKBACK_DAYS = 2; // daily run scans the last 2 days (overlap is fine — the API dedupes)

// Patterns that classify a job-hunt email. Order matters: first match wins.
var RULES = [
  { kind: "rejected", re: /(unfortunately|not (be )?moving forward|other candidates|no longer under consideration|decided to (pursue|proceed with) other)/i },
  { kind: "offer", re: /(offer letter|pleased to offer|extend an offer)/i },
  { kind: "interview", re: /(interview (confirmation|scheduled|reminder|invitation)|schedule (your|an) interview|phone screen)/i },
  { kind: "applied", re: /(thank you for applying|application (received|submitted|complete)|we('ve| have) received your application|thank you for your (application|interest in))/i },
];

// Senders that are always job-related even without the phrases above.
var ATS_SENDER_RE = /(greenhouse\.io|lever\.co|ashbyhq\.com|myworkday(jobs)?\.com|icims\.com|smartrecruiters\.com|jobvite\.com|talentacquisition@|careers@|recruiting@|no-?reply@.*jobs)/i;

function dailySync() {
  var props = PropertiesService.getScriptProperties();
  var endpoint = props.getProperty("ENDPOINT");
  var secret = props.getProperty("SECRET");
  if (!endpoint || !secret) throw new Error("Set ENDPOINT and SECRET script properties first.");

  var query = "newer_than:" + LOOKBACK_DAYS + "d -in:spam -in:trash";
  var threads = GmailApp.search(query, 0, 200);
  var events = [];

  threads.forEach(function (thread) {
    var msgs = thread.getMessages();
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      if (m.getDate().getTime() < Date.now() - LOOKBACK_DAYS * 86400000) continue;
      var from = m.getFrom() || "";
      var subject = m.getSubject() || "";
      var body = "";
      try { body = m.getPlainBody().slice(0, 4000); } catch (e) {}
      var haystack = subject + "\n" + body;

      var kind = null;
      for (var r = 0; r < RULES.length; r++) {
        if (RULES[r].re.test(haystack)) { kind = RULES[r].kind; break; }
      }
      // ATS sender with no matched phrase → still worth logging as an update
      if (!kind && ATS_SENDER_RE.test(from)) kind = "update";
      if (!kind) continue;

      // Guess the company: display name of sender, else the email domain.
      var nameMatch = from.match(/^"?([^"<]+)"?\s*</);
      var domainMatch = from.match(/@([a-z0-9.-]+)/i);
      var company = (nameMatch ? nameMatch[1] : "").trim();
      // Strip generic sender names.
      if (/no.?reply|notification|talent|careers|recruiting|greenhouse|lever|ashby|workday/i.test(company)) company = "";
      if (!company && domainMatch) {
        company = domainMatch[1]
          .replace(/^(mail|email|e|notify|jobs|careers|talent|hire|apply)\./, "")
          .split(".")[0];
        if (/greenhouse|lever|ashbyhq|myworkday|icims|smartrecruiters|jobvite/i.test(company)) {
          // ATS relay — try to find "at <Company>" in the subject/body instead
          var atMatch = haystack.match(/\b(?:at|@|joining)\s+([A-Z][A-Za-z0-9&.\- ]{2,40})[!.,\n]/);
          company = atMatch ? atMatch[1].trim() : "";
        }
      }
      if (!company) continue;

      events.push({
        kind: kind,
        company: company,
        date: Utilities.formatDate(m.getDate(), "UTC", "yyyy-MM-dd"),
        contact_email: (from.match(/<([^>]+)>/) || [])[1] || from,
        subject: subject.slice(0, 200),
        gmail_thread_id: thread.getId(),
      });
      break; // one event per thread per run is plenty
    }
  });

  if (!events.length) {
    Logger.log("No job-hunt emails in the last " + LOOKBACK_DAYS + " days.");
    return;
  }

  var res = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: { "x-internal-secret": secret },
    payload: JSON.stringify({ events: events }),
    muteHttpExceptions: true,
  });
  Logger.log("Sent " + events.length + " events → " + res.getResponseCode() + " " + res.getContentText());
}
