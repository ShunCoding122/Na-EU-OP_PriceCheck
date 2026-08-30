# OP Market Compare

Private mobile-first tool for comparing an exact One Piece card printing in Europe and North America.

## What the first release does

- Password-protected access using an HTTP-only signed session cookie.
- Starts from a card number such as `ST15-005`.
- Opens the correct TCGplayer and Cardmarket search pages in separate tabs.
- Records Cardmarket **AVG7** and up to five TCGplayer **Latest Sales**, calculates the TCG average, converts EUR to USD, and shows the spread.
- Keeps a small on-screen history chart for each lookup during the active session.

## Why the two prices are entered manually for now

The exact comparison requested needs source-specific data:

- Cardmarket AVG7 is available through its official seller API after Cardmarket grants API credentials.
- TCGplayer makes API access available on request, but the normal public price API does not automatically guarantee the five individual latest-sale records needed for this project.

The old local Playwright implementation is deliberately **not** deployed here: TCGplayer's Terms prohibit crawling/scraping, and Cardmarket blocks cloud-browser scraping. This manual bridge is reliable today; the front end is designed so official API adapters can replace the two entry fields once credentials and data scopes are approved.

## Run locally

```bash
npm install
cp .env.example .env.local
# Set APP_PASSWORD and AUTH_SECRET in .env.local
npm run dev
```

Generate `AUTH_SECRET` with `openssl rand -hex 32`.

## Deploy

Use Vercel's free Hobby plan for this private personal tool. Import this GitHub repository, add `APP_PASSWORD` and `AUTH_SECRET` under Project Settings → Environment Variables, then deploy. The app needs a server runtime for password protection; GitHub Pages is static-only and cannot keep a password or marketplace credentials secure.

## Next integration milestone

Once Cardmarket and TCGplayer grant the required APIs, add server-only route handlers under `app/api/` and use the environment variables already reserved in `.env.example`. Never put marketplace credentials in `NEXT_PUBLIC_*` variables.
