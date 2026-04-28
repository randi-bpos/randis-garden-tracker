const express = require('express');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.json());

// ── API Routes ──────────────────────────────────────────────

// GET all data
app.get('/api/data', async (req, res) => {
  const [plants, logs] = await Promise.all([
    pool.query(`SELECT data FROM plants ORDER BY data->>'createdAt'`),
    pool.query(`SELECT data FROM logs   ORDER BY data->>'createdAt'`),
  ]);
  res.json({
    plants: plants.rows.map(r => r.data),
    logs:   logs.rows.map(r => r.data),
  });
});

// Create plant
app.post('/api/plants', async (req, res) => {
  const plant = { ...req.body, id: randomUUID(), createdAt: new Date().toISOString() };
  await pool.query('INSERT INTO plants (id, data) VALUES ($1, $2)', [plant.id, plant]);
  res.json(plant);
});

// Update plant
app.put('/api/plants/:id', async (req, res) => {
  const result = await pool.query('SELECT data FROM plants WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Plant not found' });
  const updated = { ...result.rows[0].data, ...req.body, id: req.params.id };
  await pool.query('UPDATE plants SET data = $1 WHERE id = $2', [updated, req.params.id]);
  res.json(updated);
});

// Delete plant
app.delete('/api/plants/:id', async (req, res) => {
  await pool.query('DELETE FROM plants WHERE id = $1', [req.params.id]);
  // Remove logs that only applied to this plant
  const logsResult = await pool.query('SELECT id, data FROM logs');
  for (const row of logsResult.rows) {
    const log = row.data;
    if (log.plantIds.length === 1 && log.plantIds[0] === req.params.id) {
      await pool.query('DELETE FROM logs WHERE id = $1', [log.id]);
    }
  }
  res.json({ ok: true });
});

// Create log entry
app.post('/api/logs', async (req, res) => {
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
});

// Update log entry
app.put('/api/logs/:id', async (req, res) => {
  const result = await pool.query('SELECT data FROM logs WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
  const updated = { ...result.rows[0].data, ...req.body, id: req.params.id };
  await pool.query('UPDATE logs SET data = $1 WHERE id = $2', [updated, req.params.id]);
  res.json(updated);
});

// Delete log entry
app.delete('/api/logs/:id', async (req, res) => {
  await pool.query('DELETE FROM logs WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ── Serve frontend ──────────────────────────────────────────
app.use(express.static(__dirname));

// ── Start ───────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Garden Tracker running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
