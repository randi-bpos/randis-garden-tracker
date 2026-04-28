# Garden Tracker (No-Code-ish Starter)

This is a beginner-friendly garden tracker web app that stores data in Supabase.

## What it tracks

- Plants you add (name, variety, date planted, location, status)
- Care events (water, rain, fertilizer, notes)
- Quick weekly totals (water logs vs rain logs in the last 7 days)

## 1) Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. In Supabase dashboard, open **SQL Editor**.
3. Copy the full contents of `supabase.sql` in this folder and run it.

## 2) Get connection values

In Supabase dashboard:

- Go to **Project Settings -> API**
- Copy:
  - **Project URL**
  - **anon public key**

## 3) Run the app locally

This app is static HTML/CSS/JS, so any local server works.

### Option A (Python)

```bash
python3 -m http.server 5500
```

Then open: `http://localhost:5500`

### Option B (Node)

```bash
npx serve .
```

## 4) First use

1. Open the app in browser.
2. Paste Supabase URL and anon key.
3. Click **Save Connection**.
4. Add plants and care logs.

## Important note for v1

For learning speed, the SQL policies allow anyone with your anon key to read/write.
This is okay for a personal prototype, but we should secure it before sharing publicly.

## Next learning upgrades

- Add plant photos
- Add health rating and growth measurements
- Add weather API auto-rain logs
- Add login so only you can edit data
- Add charts for weekly trends
