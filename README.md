# Touchmark Nano GCC Hub — website

Next.js (App Router) + TypeScript, statically exported. Scroll motion is GSAP
(ScrollTrigger + SplitText) with Lenis driving smooth scrolling.

    npm run dev        # dev server
    npm run build      # static export to ./out
    npm run typecheck  # tsc --noEmit

Every route prerenders to plain HTML in `out/`.

## Deployment

Vercel, from `main`. `next.config.ts` uses `output: "export"` and the site is
served from the domain root, so there is no `basePath` — if it is ever hosted
under a subpath, image `src` values in `src/lib/images.ts` need prefixing too,
because Next does not rewrite plain `<img src>`.

## Design

**Typography** is Poppins throughout — headings, body, labels and UI — following
the reference site the brand chose. Labels are Poppins uppercase at weight 700;
there is no monospace and no serif. The `--mono` and `--display` variables keep
their names so existing call sites work, but both point at Poppins; `--display`
now carries only the heading scale, weight and tracking.

**The site is light-first.** White and warm neutral surfaces (`--paper`,
`--paper-2`, `--paper-3`) carry the pages, and a deep navy (`--panel`) carries
the accent bands, the footer, the hero stages and the figure panels. Those navy
contexts re-point the ink and rule tokens rather than restating every rule, so
anything reading `--ink` or `--rule` flips with them. Two signal colours mean
one thing each and are used nowhere else:

    --seed   #0F5E86  (#54B9F2 on navy)   the starting unit / active stage
    --proven #9E480A  (#FCA442 on navy)   capability added once proven

**The layout is editorial.** Full-bleed photography, uneven column widths, pull
quotes that break the measure, and section shapes that deliberately differ from
one another. The specific things that made earlier drafts read as generic —
uniform card grids, identical section heights, identical fade-ins on everything,
and no photography at all — are gone.

Section arrangements (`globals.css`):

| Class       | Shape                                          |
| ----------- | ---------------------------------------------- |
| `.ed-note`  | narrow lead column + wide text column          |
| `.ed-aside` | wide text + narrow margin note                 |
| `.ed-tall`  | text beside a tall portrait image (uneven)     |
| `.ed-split` | two unequal text columns                       |

Vertical weight varies too: `<Section size="sm|md|lg">`. Pages alternate between
opening on a photograph (`Stage`) and opening on type (`PageOpen`) so the set
does not feel stamped out.

## Branding

The header and footer use the Touchmark Descience wordmark from
`public/brand` — colour lockup on paper, white on ink and over photographs
(`src/components/Logo.tsx` switches between them). The mark is never recoloured.

## SEO

Twelve routes plus a 404, each exported as its own `index.html` with a unique
`<title>` and meta description rendered into the HTML — not injected by script.
Internal links are real `<a href>`, so crawlers walk the whole site. `sitemap.ts`
and `robots.ts` generate `/sitemap.xml` and `/robots.txt` at build time.

**Set the production domain in `src/app/sitemap.ts` (`SITE_URL`) once Vercel is
pointed at the real hostname** — the sitemap currently advertises the preview URL.

Verified against the source document with a script that checks 30 required
content points across the pages and asserts the named organizations that must
not be published (CII, FICCI, NASSCOM, Guidance Tamil Nadu, TIDCO, Startup TN)
appear nowhere. All 30 pass.

## Photography

Real photographs of Chennai and Tamil Nadu, not stock offices. Files are in
`public/img`, and every one is declared in `src/lib/images.ts` with its credit.

All are freely licensed from Wikimedia Commons (CC BY / CC BY-SA). **CC BY-SA
requires attribution**, so the footer renders the full credit list — do not
remove it. Originals were 9.5 MB total; they ship at 1.8 MB (2000px, q80).

The footer also carries a disclaimer that matters legally and editorially:
the photographs show Tamil Nadu's public landmarks and institutional landscape
and **do not indicate that any pictured organization is a partner**. Captions
are written to hold that line. If Touchmark does formalize a relationship with a
pictured institution, update the caption — don't imply it earlier.

## Components

    src/components/          Stage, PageOpen, Section, Figure, Entries, PullQuote,
                             Datasheet, header, footer, forms
    src/components/motion/   AnimatedHeading, Reveal, UnitDots, Counter,
                             Marquee, JourneyScroller
    src/lib/images.ts        photo manifest + credits
    src/lib/nav.ts           navigation structure
    src/lib/gsap.ts          plugin registration + reduced-motion helper

`CapabilityRotator` runs continuously in the hero: the capability areas cycle
through a masked window with a timer bar, saying what units get built for.
`UnitDots` is the same motif at full scale: 100 dots, 5 teal seed, the rest
filling amber on scroll. `JourneyScroller` pins and moves the five stages sideways, each carrying
its own unit count so the team visibly grows only at the proven stage.

Every motion primitive checks `prefers-reduced-motion` and renders static.

### Journey sizing

`.jstep` is sized in `vw`, not px, so the track stays ~1.7x the viewport. A fixed
px width collapsed the horizontal travel to nothing on wide displays.

## The Nano GCC Model page

Two purpose-built pieces rather than generic sections:

- **`ScaleSimulator`** — drag team size 5 to 100 and the unit shape, the dot
  field and two opposed meters (commitment up, speed to first answer down)
  all move. The document's central claim, made testable instead of asserted.
- **`JourneyRail`** — the five stages as a sticky numeral and tick track beside
  a scrolling narrative. Replaced the pinned horizontal carousel, which needed
  separate desktop and mobile behaviour and hid the reader's position.

## Intro animations must never be the only path to visible content

`HeroHome` and `PageOpen` reveal their headlines with a GSAP `from()` timeline.
A page loaded in a **background tab gets no requestAnimationFrame**, so GSAP
applies the start state (translated inside an `overflow: hidden` mask, opacity 0)
and never animates out of it - the headline is simply invisible until the tab is
focused. Both components therefore check `document.hidden` up front and show the
final state instead, plus a 4s failsafe if the ticker never advances.

Use explicit final values (`opacity: 1, y: 0, yPercent: 0, scaleX: 1`) for that
reveal, **not `clearProps: "all"`** - clearProps also strips the inline colour
off the emphasised line.

## Punctuation

Body copy uses plain hyphens, not em dashes. En dashes remain in numeric ranges
(`5-100` is written `5–100`) and in `Industry–academia`.

## Forms

Fields are filled wells with borders, placeholders and required markers.
An earlier version used borderless underline inputs, which left users unsure
where to type — **do not go back to invisible fields.**

## Content rules encoded in the build

From `docs/Touchmark_Website_Copy_v2.docx`:

- Partners: categories and status only. No names, no counts, no
  company-to-benefit pairings.
- The Government & Policy Liaison group stays unpublished until formalized
  (see `src/app/ecosystem/team/page.tsx`).
- Team groups read as strategic oversight; no sourcing or delivery staff.
- Success stories stay anonymized and relative.

## Not wired up yet

- **Forms** acknowledge in place; no backend. See `EnquiryForm.tsx`.
- **Brochure buttons** point at `/contact` — no PDFs exist yet.
- **Tamil-language toggle** is scoped as a v2 addition in the source document.

## Scaling and responsiveness

The root font size scales with the viewport
(`clamp(16px, 0.3125vw + 12px, 20px)`), so everything sized in rem grows on
large displays instead of stranding the page mid-screen. The container is
`min(1920px, 94vw)`.

Breakpoints: 1080px nav collapses to a menu, 900px editorial columns stack,
760px the journey stacks, 700px and 420px mobile refinements.

Verified at 390px, 760px and 820px by rendering the site inside an iframe of
that width — an iframe gets its own viewport, so media queries evaluate
correctly. The test browser itself cannot be resized. No horizontal overflow,
and the hero fits exactly one viewport at every width tested.

**The hero must never exceed one screen.** `.d-hero` is capped in `vh` as well
as `vw` for that reason, and the mobile rules drop the last two spec tiles and
shrink the pulse to hold the constraint. Adding anything to the hero means
re-checking it at 390x760.

**Descenders:** headings must never sit inside an unpadded `overflow: hidden`
wrapper. Fraunces has deep descenders and SplitText's `mask` option clips at the
line box, cutting g, y and j. `AnimatedHeading` therefore fades lines up instead
of masking them, and the hero's `.hl` mask carries `padding-bottom` so the clip
region includes the descenders.

If the dev server ever serves a page with no CSS, its cache is stale: stop it,
`rm -rf .next`, and restart.

`legacy-static/` holds the original hand-written HTML version.

---

## Memberships, payments and admin

This part of the site is not static. Adding it meant dropping
`output: "export"` from `next.config.ts` — API routes, middleware and database
access are impossible under a static export. Every marketing page is still
prerendered by default, so nothing about the public site's SEO or delivery
changed; `next build` shows the split (`○` static, `ƒ` dynamic).

### Shape of it

`/contact` now has three tabs:

- **Institution** — the ₹25,000 (incl. GST) DOS Club package, paid online.
- **Company** — enquiry only, commercials agreed on a call.
- **Already a member?** — status lookup by email or reference ID.

The payment flow crosses domains, because Razorpay's live gateway is approved
for **originbi.com** only:

```
POST /api/enquiry  →  enquiry + order rows, amount from pricing.ts
   └─ redirect to originbi.com/nanogcc/checkout?token=<JWT>
      └─ originbi verifies the token, creates the Razorpay order, opens the modal
         ├─ POST /api/webhooks/originbi   ← fast path (from the browser)
         ├─ POST /api/webhooks/razorpay   ← guarantee (server to server)
         └─ redirect → /membership/return/?ref=…&payment=success
```

The handoff is an HS256 JWT signed with `CROSS_DOMAIN_SECRET`, shared with
originbi. The amount lives inside it, so it is set by this server and cannot be
edited in an address bar.

**Two paths report completion, on purpose.** `/api/webhooks/originbi` is fast
but originates in the buyer's browser, so it is lost if the tab closes in the
moment between payment and the request landing — which is exactly when people
close it. `/api/webhooks/razorpay` is signed and retried by Razorpay for hours,
entirely independent of the browser. Both call the same idempotent function, so
whichever lands first does the work and the other is a no-op.

**The webhook is the source of truth; the redirect is only UX.** That one rule
explains most of the design. A payment is confirmed by a signed, retried
webhook, so closing the tab, losing signal or hitting Back cannot lose it. If
the webhook is late, `/api/order-status` re-asks Razorpay directly after 20
seconds; if it never arrives at all and the buyer never checks back, the cron
sweeper picks it up on its next daily run. Nothing in the buyer's path can produce a double charge: order
creation reuses an unpaid order for 30 minutes, membership creation is guarded
by a unique constraint, and the receipt is claimed with a conditional update
before it is sent.

The user-facing corollary: a pending payment is **never** styled or worded as a
failure. Only Razorpay saying "failed" produces the failure screen, and that
screen says "you have not been charged" in the same breath.

`ORIGINBI-INTEGRATION.md` is the contract for the originbi.com side, written
against the architecture already built for `dosmembership`. originbi serves
this site from its own route, `/nanogcc/checkout`, alongside (not replacing)
dosmembership's `/dosmembership/checkout` — same pattern, separate page,
separate order-creation endpoint. Its Razorpay order creation tags
`notes.order_ref` / `notes.site` and treats the JWT's `amount` as paise
already (dosmembership's multiplies by 100, since its amounts are rupees),
and its completion POST includes both `ref` and `razorpay_order_id` — this
site looks orders up by `ref`, and the client-side signature is
`HMAC(order_id|payment_id)`, which cannot be verified without the order id.

### Setting it up

1. **Database.** Create a Neon project and run `db/schema.sql` against it
   (Neon SQL editor, or `psql "$DATABASE_URL" -f db/schema.sql`). It is
   idempotent, so re-running is safe.
2. **Environment.** Copy `.env.example` to `.env.local` and fill it in. Set the
   same keys in the Vercel project settings. Generate the three local secrets
   with `openssl rand -base64 32`.
3. **Admin account.** `node scripts/create-admin.mjs you@example.com "a long passphrase" "Your Name"`.
   There is no public signup route, and there should not be one. Re-running the
   script resets the password and revokes existing sessions.
4. **Razorpay.** Add a webhook pointing at `<site>/api/webhooks/razorpay` for
   `payment.captured`, `payment.failed` and `order.paid`. Multiple webhooks on
   one account are independent, so this does not disturb `dosmembership`'s.
   `CROSS_DOMAIN_SECRET` must match originbi's value exactly, or every checkout
   fails at the door.
5. **Resend.** Verify the sending domain, then add a webhook at
   `<site>/api/webhooks/resend` for the `email.*` events so delivery status
   shows up in the admin panel.
6. **Cron.** `vercel.json` registers the daily reconciliation sweep - Vercel's
   Hobby plan caps cron jobs to once a day; tighten it on Pro if a shorter
   worst-case matters. It only runs on a deployed Vercel project, not locally.

Local webhook testing needs a public URL — `ngrok http 3000` or
`vercel dev --listen`, with the tunnel address registered in the Razorpay and
Resend dashboards. Use test keys until a real ₹1 end-to-end has passed on
production.

### Running the whole thing locally

Every external service has a stand-in in Docker, so the full flow — handoff,
payment, both completion paths, the receipt and its delivery webhook — runs
with no Neon project, no Resend key, no Razorpay account and no real money.

```bash
npm run local:up     # postgres, neon proxy, mailpit, and three mocks
npm run dev          # the app itself, on the host, port 3100
npm run create-admin admin@dosclub.local "a-very-long-passphrase" "Admin"
```

| | Where |
|---|---|
| The site | http://localhost:3100 |
| Admin panel | http://localhost:3100/admin |
| Mail inbox (Mailpit) | http://localhost:8025 |
| originbi checkout mock | http://localhost:4003 |
| Razorpay mock | http://localhost:4002 |

Open `/contact/`, fill in the Institution tab, and pay. The mock gateway offers
**Pay successfully**, **Simulate failure** and **Abandon**, and the receipt
lands in Mailpit rendered from the real HTML template.

Other scripts: `local:down`, `local:reset` (wipes the database), `local:logs`,
`local:psql`.

**The mocks are wired in by configuration, never by a branch in application
code.** Three variables do it — `NEON_HTTP_PROXY`, `RESEND_BASE_URL` (read by
the Resend SDK itself) and `RAZORPAY_API_BASE`. Unset them and the identical
code talks to the real services. There is no `if (isLocal)` anywhere.

What each stand-in is:

- **postgres + neon-proxy** — the Neon driver speaks SQL over HTTP, which plain
  Postgres does not understand, so a proxy terminates that protocol.
  `db/schema.sql` is applied automatically on first start.
- **resend-mock** — implements `POST /emails`, relays into Mailpit over SMTP,
  and fires Svix-signed delivery webhooks back, so the admin Emails page fills
  in for real.
- **razorpay-mock** — orders and payments endpoints, plus a `checkout.js`
  exposing a `window.Razorpay` with the real shape. Signatures are computed
  exactly as Razorpay computes them, so nothing in the app is relaxed for local
  use and a forged signature is rejected here just as in production.
- **originbi-mock** — a faithful implementation of the cross-domain contract.
  `local/originbi-mock/server.mjs` doubles as the **reference implementation**
  for the real originbi side; the three changes that side needs are marked in
  its header comment.

#### The drills worth running

The stack exists to make failure testable, not just the happy path:

| Drill | How | Expected |
|---|---|---|
| Closed tab | Pay, then kill the tab before it redirects | Membership still appears — the Razorpay webhook carries it |
| Lost webhook | `POST /v1/mock/pay` with `"webhook": false` | Recovered within ~20s by the status poll asking Razorpay directly |
| Replay | Send the same completion twice | One membership, one receipt |
| Forged completion | Alter `razorpay_signature` | `401`, nothing written |
| Price tamper | Put `amount` in the enquiry body | Ignored; the server charges the price list |
| Token tamper | Edit the JWT | Checkout refuses with `401` |
| Failed payment | **Simulate failure** | "You have not been charged", retry mints a fresh reference |

### Admin panel

`/admin`, behind email + password. Sessions are rows in `admin_sessions`, not
self-contained tokens, so signing out and deactivating an account both take
effect immediately. `src/middleware.ts` checks the cookie signature at the edge
and each page re-checks the session against the database — the edge cannot see
Neon, so the authoritative check happens where it can be authoritative.

Pages: dashboard, enquiries (triage status and internal notes, CSV), payments
(re-check against Razorpay, resend receipt, CSV), memberships (CSV), and the
email delivery log.

Note what the panel deliberately **cannot** do: mark an order paid, change an
amount, or create a membership by hand. Money state is only ever written by
Razorpay's answer. "Re-check" re-asks that question; it cannot invent the
answer.

### Where the price lives

`src/lib/pricing.ts`, and nowhere else. The browser never sends an amount — a
form post names a plan and the server looks the price up — so editing a hidden
field cannot change what is charged. The terms page quotes the same constant,
so the legal copy cannot drift from checkout.
