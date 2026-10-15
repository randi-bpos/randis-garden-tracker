# Randi's Garden Tracker

A web app for tracking a backyard vegetable garden.

- **Main app:** https://gardenapp.randiedelson.com (password protected)
- **Read-only share page:** https://sharegardenapp.randiedelson.com (anyone with the link can view)

## What it tracks

- Plants (name, variety, category, date planted, location, status)
- Journal entries: watering, rain, fertilizer, harvests, height measurements, observations, and when a plant died
- Growth milestones such as first flowers and first fruit
- Weekly totals of watering vs. rain

## How it's hosted

| Piece | Service | Plan |
|---|---|---|
| App (Node/Express, `server.js`) | [Render](https://render.com), web service `randis-garden-tracker` | Free |
| Database (Postgres) | [Neon](https://neon.tech), project `garden-tracker` | Free |
| Domain and DNS | [Porkbun](https://porkbun.com), `randiedelson.com` | Paid through May 2028 |

- **Deploys are automatic.** Pushing to the `main` branch on GitHub makes Render rebuild and restart the app within a couple of minutes.
- **Both addresses point to the same app.** In Porkbun, `gardenapp` and `sharegardenapp` are CNAME records pointing to `randis-garden-tracker.onrender.com`. When the app is visited at the `sharegardenapp` address, `server.js` shows the share page.
- **The free plan sleeps.** After about 15 minutes with no visitors, Render pauses the app, and the next visit takes up to a minute to load.

### Settings on Render

These are set under the service's **Environment** tab, not in this repo:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon connection string (Neon dashboard, then the **Connect** button) |
| `GARDEN_PASSWORD` | Password for logging in to the main app |
| `SESSION_SECRET` | Random string that keeps logins secure |

## Backups

```bash
npm run backup
```

This copies every plant and journal entry from the database into `garden-backup.json`, plus a dated copy in `backups/`. It only reads from the database and never changes it.

It needs the Neon connection string saved in `.env.neon`. To set that up on a new computer:

```bash
bash save-neon-url.sh
```

Then paste the connection string from Neon. Nothing shows on screen while you paste.

**This repo is public.** `.env.neon`, `garden-backup.json` and `backups/` are listed in `.gitignore` so they never get uploaded. Never put the connection string or password in a committed file.

## Restoring from a backup

To load `garden-backup.json` into a database (for example, a new one after moving hosts):

```bash
set -a; source .env.neon; set +a
node import-data.js
```

This creates the tables if needed and adds any missing records. It doesn't overwrite or delete existing ones.

## Running locally

```bash
npm install
set -a; source .env.neon; set +a
npm start
```

Then open http://localhost:3000. The default password is `garden` unless `GARDEN_PASSWORD` is set. This uses the real database, so changes made locally show up on the live site.

## History

- **Apr 2026:** started as a static page using Supabase (`supabase.sql`)
- **May 2026:** moved to a Node server with a password, hosted on Railway
- **May–Oct 2026:** hosted on AWS Elastic Beanstalk with an AWS database
- **Oct 2026:** moved to Render + Neon when the AWS free credits ran out
