const express = require('express');
const cookieSession = require('cookie-session');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cookieSession({
  name: 'garden_session',
  keys: [process.env.SESSION_SECRET || 'dev-secret-change-in-prod'],
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plants (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS logs   (id TEXT PRIMARY KEY, data JSONB NOT NULL);
  `);
}

// ── Auth helper ──────────────────────────────────────────────
function isAuthenticated(req) {
  return req.session && req.session.authenticated;
}

// ── Public API routes (no login needed) ─────────────────────

app.post('/api/login', (req, res) => {
  const password = process.env.GARDEN_PASSWORD || 'garden';
  if (req.body.password === password) {
    req.session.authenticated = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/share-data', async (req, res) => {
  try {
    const [plants, logs] = await Promise.all([
      pool.query(`SELECT data FROM plants ORDER BY data->>'createdAt'`),
      pool.query(`SELECT data FROM logs   ORDER BY data->>'createdAt'`),
    ]);
    res.json({
      plants: plants.rows.map(r => r.data),
      logs:   logs.rows.map(r => r.data),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Auth middleware for all remaining /api/ routes ───────────
app.use('/api', (req, res, next) => {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

// ── Protected API routes ─────────────────────────────────────

// GET all data
app.get('/api/data', async (req, res) => {
  try {
    const [plants, logs] = await Promise.all([
      pool.query(`SELECT data FROM plants ORDER BY data->>'createdAt'`),
      pool.query(`SELECT data FROM logs   ORDER BY data->>'createdAt'`),
    ]);
    res.json({
      plants: plants.rows.map(r => r.data),
      logs:   logs.rows.map(r => r.data),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create plant
app.post('/api/plants', async (req, res) => {
  try {
    const plant = { ...req.body, id: randomUUID(), createdAt: new Date().toISOString() };
    await pool.query('INSERT INTO plants (id, data) VALUES ($1, $2)', [plant.id, plant]);
    res.json(plant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update plant
app.put('/api/plants/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM plants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plant not found' });
    const updated = { ...result.rows[0].data, ...req.body, id: req.params.id };
    await pool.query('UPDATE plants SET data = $1 WHERE id = $2', [updated, req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete plant
app.delete('/api/plants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM plants WHERE id = $1', [req.params.id]);
    const logsResult = await pool.query('SELECT id, data FROM logs');
    for (const row of logsResult.rows) {
      const log = row.data;
      if (log.plantIds.length === 1 && log.plantIds[0] === req.params.id) {
        await pool.query('DELETE FROM logs WHERE id = $1', [log.id]);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create log entry
app.post('/api/logs', async (req, res) => {
  try {
    const log = {
      id: randomUUID(),
      date: req.body.date || new Date().toISOString().slice(0, 10),
      type: req.body.type,
      plantIds: req.body.plantIds || ['all'],
      amount: req.body.amount || '',
      notes: req.body.notes || '',
      createdAt: new Date().toISOString(),
    };
    await pool.query('INSERT INTO logs (id, data) VALUES ($1, $2)', [log.id, log]);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update log entry
app.put('/api/logs/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM logs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    const updated = { ...result.rows[0].data, ...req.body, id: req.params.id };
    await pool.query('UPDATE logs SET data = $1 WHERE id = $2', [updated, req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete log entry
app.delete('/api/logs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM logs WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Page routes ──────────────────────────────────────────────

app.get('/login', (req, res) => {
  if (isAuthenticated(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/share', (req, res) => {
  res.sendFile(path.join(__dirname, 'share.html'));
});

// Protect main app page
app.use((req, res, next) => {
  if ((req.path === '/' || req.path === '/index.html') && !isAuthenticated(req)) {
    return res.redirect('/login');
  }
  next();
});

// ── Serve static files ───────────────────────────────────────
app.use(express.static(__dirname));

// ── Start ────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Garden Tracker running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
