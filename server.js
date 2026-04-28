const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'garden.json');

// Create data directory on first run
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json());

// ── API Routes ──────────────────────────────────────────────

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { plants: [], logs: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// GET all data
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// Create plant
app.post('/api/plants', (req, res) => {
  const data = readData();
  const plant = {
    ...req.body,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  data.plants.push(plant);
  writeData(data);
  res.json(plant);
});

// Update plant
app.put('/api/plants/:id', (req, res) => {
  const data = readData();
  const idx = data.plants.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plant not found' });
  data.plants[idx] = { ...data.plants[idx], ...req.body, id: req.params.id };
  writeData(data);
  res.json(data.plants[idx]);
});

// Delete plant
app.delete('/api/plants/:id', (req, res) => {
  const data = readData();
  data.plants = data.plants.filter(p => p.id !== req.params.id);
  // Remove logs that only applied to this plant
  data.logs = data.logs.filter(l =>
    !(l.plantIds.length === 1 && l.plantIds[0] === req.params.id)
  );
  writeData(data);
  res.json({ ok: true });
});

// Create log entry
app.post('/api/logs', (req, res) => {
  const data = readData();
  const log = {
    id: randomUUID(),
    date: req.body.date || new Date().toISOString().slice(0, 10),
    type: req.body.type,
    plantIds: req.body.plantIds || ['all'],
    amount: req.body.amount || '',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };
  data.logs.push(log);
  writeData(data);
  res.json(log);
});

// Update log entry
app.put('/api/logs/:id', (req, res) => {
  const data = readData();
  const idx = data.logs.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Log not found' });
  data.logs[idx] = { ...data.logs[idx], ...req.body, id: req.params.id };
  writeData(data);
  res.json(data.logs[idx]);
});

// Delete log entry
app.delete('/api/logs/:id', (req, res) => {
  const data = readData();
  data.logs = data.logs.filter(l => l.id !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

// ── Serve frontend ──────────────────────────────────────────
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\nGarden Tracker is running!`);
  console.log(`Open your browser and go to: http://localhost:${PORT}\n`);
});
