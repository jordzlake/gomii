# gomii

A gamified life tracker. Finish real tasks, grow eight stats, take a pixel character from level 1 to 100.

Next.js 14 (App Router) · TypeScript · plain CSS, no Tailwind · MongoDB · GSAP · installable PWA.

## Run it

```bash
npm install
cp .env.local.example .env.local     # then fill in the password and a secret
npm run dev                          # http://localhost:3000
```

`.env.local` needs three values:

| Key | What it is |
| --- | --- |
| `MONGODB_URI` | Your Atlas string with `<db_password>` replaced by the real password |
| `MONGODB_DB` | Database name, `gomii` by default |
| `AUTH_SECRET` | Any long random string — `openssl rand -base64 48` |

Collections (`users`, `tasks`, `completions`, `goals`, `categories`) and their indexes are created on the
first request, so there is nothing to migrate.

## How the game works

**Stats.** Eight of them: CHA, CUL, STR, SUC, SKI, VIT, AUR, FIN. Defined once in `src/lib/stats.ts` with
their colours and icons, and every screen reads from there.

**Tasks.** 420 built-in tasks live in `src/data/tasks.json`, each with a category, an unlock level between 1
and 100, a repeat rule, and the stat points it pays. They appear on the quest board as the player levels up.
Users add their own tasks too: they pick the stats, the difficulty sets the size of the payout
(easy 1, medium 2, hard 3, very hard 4 points into every stat picked), and choose a repeat of once, daily,
weekly, monthly or yearly.

**Repeats.** A repeating task returns at the start of the next period — the next day, the Monday of the next
week, the first of the next month, or the first of the next year. Availability is worked out from the last
completion in `src/lib/tasks.ts`, so nothing needs a cron job.

**Goals.** Long term goals pay a flat 10 points into every stat they were tagged with, which is roughly ten
ordinary tasks at once. The number lives in `GOAL_POINTS_PER_STAT`.

**Experience.** Every stat point is worth 12 XP, and moving from level *n* to *n+1* costs `80 + (n-1) * 40`.
Coins are three per stat point. Streaks count consecutive days with at least one completion.

## Where the tile maps went

The uploaded sheets were cut on their own grid lines — the cut always falls in the empty gutter, never
through a sprite — and each file keeps its original grid position in its name.

| Source | Grid | Output | Named by |
| --- | --- | --- | --- |
| `1.png` – `4.png` | 5 x 6 | `public/sprites/characters/charN_rR_fF.png` | Row = one character, frames 0-4 = its animation |
| `5.png` | 5 x 5 | `public/sprites/effects/fx_rR_fF.png` | Rows: growth, flame, chest, idea, trophy |
| `tilemap_of_icons_for_tasks.png` | 8 x 8 | `public/sprites/icons/icon_rR_cC.png` | 64 named icons |

`src/data/sprites.ts` maps those positions onto names: 24 playable characters, five effect strips, and the
icon set addressed as `ICONS.trophy`, `ICONS.dumbbell` and so on. Frame 0 of a character row is the resting
pose; the row cycles only while something is happening on screen.

The effect strips are used as five-stage meters. The flame grows with the streak (one stage every three
days), the chest opens on a completed task, the trophy plays on a level up, and the sprout is the empty
state for goals.

## Motion

GSAP drives the moments that follow an action: the reward card, the sprite bounce, the staggered stat gains,
the dashboard entrance. CSS handles the ambient loops — the idle float, the streak glow, the shake on a
rejected form. Everything is switched off under `prefers-reduced-motion`.

## Installing on a phone

The app ships a manifest, an offline page and a service worker that caches the shell and every sprite. In
mobile Chrome or Safari, open the site and choose *Add to home screen*. It opens standalone, in portrait,
with the midnight theme colour behind the status bar.

Service workers need HTTPS (or localhost), so the install prompt appears once it is deployed — Vercel plus
Atlas needs no extra configuration beyond the three environment variables above.

## Layout

```
src/
  app/
    (auth)/login, (auth)/register     sign in and character creation
    (game)/today                      dashboard: streak, XP, repeating tasks, log
    (game)/quests                     the full board with search and category filters
    (game)/create                     custom tasks and custom categories
    (game)/goals                      long term goals
    (game)/character                  stat sheet, character swap, sign out
    api/                              auth, tasks, complete, goals, categories, profile
  components/                         sprites, meters, task list, reward overlay, nav
  lib/                                stats, tasks, db, auth, queries
  styles/                             tokens, base, components, animations, screens
```
