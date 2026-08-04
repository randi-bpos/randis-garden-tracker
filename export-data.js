const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function exportData() {
  console.log('Connecting to database...');
  const [plants, logs] = await Promise.all([
    pool.query(`SELECT data FROM plants ORDER BY data->>'createdAt'`),
    pool.query(`SELECT data FROM logs   ORDER BY data->>'createdAt'`),
  ]);

  const data = {
    plants: plants.rows.map(r => r.data),
    logs:   logs.rows.map(r => r.data),
  };

  fs.writeFileSync('garden-backup.json', JSON.stringify(data, null, 2));
  console.log(`Exported ${data.plants.length} plants and ${data.logs.length} log entries to garden-backup.json`);
  await pool.end();
}

exportData().catch(err => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
