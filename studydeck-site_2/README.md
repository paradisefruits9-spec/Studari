# Studari — standalone website

This is Studari (formerly "Study Deck") rebuilt to run as a real, independent
website on your own domain, instead of a claude.ai artifact link. It's the
same app — type a subject, upload a PDF, or pick SAT/ACT prep, and it writes
notes, flashcards, and a scored quiz, plus a built-in calculator and an
"Ask AI" helper — but the AI features now run through a small backend of
your own instead of Claude's built-in artifact runtime.

This version also adds three features common in other study apps:

- **Smarter flashcard review** — flashcards now use spaced repetition (a
  Leitner-box system). Rate each card "Still learning" or "Got it" after
  flipping it; cards you know well are shown less often, and cards you
  struggle with come back sooner. The Flashcards tab always shows only the
  cards currently due, with a "Review anyway" option to go through the
  whole set regardless of schedule.
- **Progress dashboard & streaks** — click **Progress** in the sidebar to
  see a day streak (based on days you've studied), total sets/attempts/
  mastered cards, a recent quiz-accuracy chart, and a list of your
  lowest-scoring sets worth revisiting.
- **Search & organize your library** — give any set an optional category
  (e.g. "Biology", "SAT Math") when you create it or afterward from its
  title bar, then filter the sidebar by category or search sets by title.

## What changed, and why it costs money now

Inside claude.ai, the AI features used your own Claude account for free
(within your normal usage). Once this app leaves claude.ai, there's no
Claude account attached to the page anymore, so it needs its own way to
reach Claude — that's what `api/claude.js` is for: a small serverless
function that calls the Anthropic API directly, using an API key you'll
create and pay for separately. Every generated study set and every "Ask AI"
question is a paid API call, billed to your Anthropic account, not your
Claude subscription.

Everything else about the app is unchanged: it's still a single static
`index.html` file, your study sets still save in each visitor's own
browser (not a shared database), and the calculator still needs nothing
from a server at all.

## What you'll need

- An Anthropic account with billing set up, to get an API key.
- A free [Vercel](https://vercel.com) account, to host the site.
- A domain name — see **Step 4** for buying `studari.com` (or whatever
  variant is available) if you don't already own one.
- [Node.js](https://nodejs.org) installed on your computer, just to run the
  `vercel` command-line tool.

Nothing here requires you to know how to code — it's copy, paste, and
follow along.

---

## Step 1 — Get an Anthropic API key

1. Go to **[platform.claude.com/settings/keys](https://platform.claude.com/settings/keys)**
   and sign in (or create an account).
2. Make sure billing is set up under **Plans & Billing** — API usage is
   pay-as-you-go and separate from any Claude.ai subscription.
3. Click **Create Key**, give it a name like `studari-prod`, and copy
   the key (it starts with `sk-ant-...`). You won't be able to see it again
   after this, so paste it somewhere safe for a moment.
4. Roughly what this costs: generating one study set (notes + flashcards +
   quiz) is one Claude call of a few thousand tokens — a handful of cents at
   most on Claude Sonnet 5's published rates; "Ask AI" answers are smaller
   and run on the faster/cheaper Haiku model. Check current per-token
   pricing on the platform site before rolling this out to a lot of people.

## Step 2 — Deploy the site to Vercel

You don't need a GitHub account for this — the Vercel command-line tool
deploys straight from the files on your computer.

1. Open a terminal in this project folder (the one with `index.html`,
   `api/`, `package.json` in it).
2. Log in (this opens your browser to authenticate):

   ```
   npx vercel login
   ```

3. Deploy it:

   ```
   npx vercel
   ```

   Answer the prompts — when it asks for a project name, type `studari`
   (this becomes part of your `.vercel.app` URL); accept the defaults for
   everything else (link to a new project, "./" as the code directory).
   This creates a **preview** deployment and prints a URL like
   `https://studari-abc123.vercel.app` — open it and you'll see the app,
   but AI generation will fail until Step 3.

## Step 3 — Add your API key

1. Still in the project folder, run:

   ```
   npx vercel env add ANTHROPIC_API_KEY
   ```

2. Paste the key from Step 1 when prompted, and select all three
   environments (Production, Preview, Development) when asked.
3. Redeploy so the new variable takes effect:

   ```
   npx vercel --prod
   ```

4. Open the production URL it prints, create a test study set (try "Type a
   Subject" with something quick like "photosynthesis"), and confirm it
   generates notes and a quiz. If you get an error mentioning the server's
   API key, double check the key was pasted correctly and that billing is
   active on your Anthropic account.

**Prefer a point-and-click flow instead of the terminal?** Push this folder
to a GitHub repository, then in the [Vercel dashboard](https://vercel.com/new)
choose **Import Project** and pick that repo. You'll get the same result,
plus every future `git push` automatically redeploys the site. Add the
`ANTHROPIC_API_KEY` variable under **Project Settings → Environment
Variables** either way.

## Step 4 — Get studari.com (or a variant) and connect it

1. In your Vercel project, go to **Settings → Domains → Buy a Domain** and
   search for `studari.com`. If it's taken, Vercel's search will suggest
   close variants (`studari.app`, `studari.io`, `getstudari.com`,
   `usestudari.com`, etc.) — pick whichever reads best to you. Buying here
   registers the domain and connects the DNS automatically in one step.
   (You can also buy elsewhere — Namecheap, Cloudflare Registrar,
   Squarespace Domains, GoDaddy — and point it at Vercel manually; the
   Domains tab shows the exact DNS records to add if so.)
2. Add the domain under **Settings → Domains → Add**, then follow whatever
   DNS instructions it shows (usually just one A or CNAME record).
3. DNS changes can take anywhere from a few minutes to a few hours to
   propagate. Once it does, `https://studari.com` (or whichever domain you
   chose) serves the same site as the `.vercel.app` URL.
4. Optional: once you own the domain, you can also register matching
   handles on social platforms (e.g. `@studari`) and set up an email
   address like `hello@studari.com` through most domain registrars or a
   mail-forwarding add-on, if you want a fuller "official" presence.

## Updating the site later

- **CLI flow:** edit the files, then run `npx vercel --prod` again from the
  project folder.
- **GitHub flow:** edit the files, commit, and `git push` — Vercel
  redeploys automatically.

## Troubleshooting

- **"The AI backend isn't set up correctly"** — `ANTHROPIC_API_KEY` is
  missing or wrong on this deployment. Recheck Step 3, and make sure you
  redeployed (`vercel --prod`) after adding it — adding an environment
  variable doesn't affect a deployment that already happened.
- **"You've hit a usage limit"** — Anthropic is rate-limiting or your
  account has hit a spending cap; check **Plans & Billing** on
  platform.claude.com.
- **A generated study set fails to parse / "didn't come back in a usable
  format"** — rare, and usually resolves on a retry; the model occasionally
  wraps its answer in extra text despite being asked not to.
- **Study sets don't show up on another device** — this is expected. Each
  browser keeps its own library in local storage; nothing is synced between
  devices or people. (Bringing back a shared library would mean adding a
  real database to this backend — a bigger step than this project takes on;
  ask if you want that built out.)

## Files in this project

- `index.html` — the entire frontend: UI, calculator, flashcards, quiz
  logic, and PDF text extraction, all client-side.
- `api/claude.js` — the serverless function that holds the API key and
  proxies requests to Anthropic's Messages API.
- `vercel.json` — configures a longer timeout on the API function, since a
  full study-set generation can take up to about a minute.
- `.env.example` — template for local environment variables (copy to
  `.env.local` if you use `vercel dev` to test locally).
