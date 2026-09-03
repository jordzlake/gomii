# Notes and next steps

## Deliberate choices

- **Passwords** are hashed with bcrypt; the session is a signed JWT in an httpOnly cookie, so no session
  collection is needed. Change `AUTH_SECRET` and every session is invalidated.
- **Server components read Mongo directly**; only mutations go through `/api`. That keeps the payload small
  on a phone.
- **Preset tasks are files, not rows.** `tasks.json` is read at build time and given stable keys
  (`p_<index>_<slug>`). Completions store that key, so editing the wording of a task is safe, but
  reordering the file changes which preset a past completion points at. Add new tasks at the end.
- **Custom task keys** are `c_<objectid>`, goals are `g_<objectid>`. One completions collection covers all
  three, which is what makes the log and the streak simple.

## Things you may want next

- Difficulty per stat. Right now one difficulty sets the same points for every stat a custom task touches.
  The schema already stores a full stat block per task, so a per-stat editor is a UI change only.
- Yearly presets. `tasks.json` only uses daily, weekly and monthly; the code already understands yearly.
- A shop for coins. Coins accumulate and currently do nothing — the icon tile map has plenty of items.
- Push notifications for daily resets, which needs a `web-push` key pair and a subscriptions collection.

## Checked

- `npm run build` passes with no type errors.
- Sliced sprites were verified against the source sheets: no sprite is cut, and transparency was restored
  by flood filling the checkerboard from the edges rather than knocking out every light pixel, so the white
  inside icons like the envelope and the clipboard survives.
