const { Pool } = require('pg');
const fs = require('fs');

// The connection string is read from DATABASE_URL — never hardcode it here,
// this repo is public. `npm run backup` shows how to pull it from AWS.
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Get it from AWS with:');
  console.error("  export DATABASE_URL=$(aws elasticbeanstalk describe-configuration-settings \\");
  console.error("    --region us-east-2 --application-name garden-tracker \\");
  console.error("    --environment-name garden-tracker-env \\");
  console.error("    --query \"ConfigurationSettings[].OptionSettings[?OptionName=='DATABASE_URL'].Value\" \\");
  console.error('    --output text)');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function importData() {
  console.log('Connecting to database...');
  const data = JSON.parse(fs.readFileSync('garden-backup.json', 'utf8'));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plants (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    CREATE TABLE IF NOT EXISTS logs   (id TEXT PRIMARY KEY, data JSONB NOT NULL);
  `);

  console.log('Importing plants...');
  for (const plant of data.plants) {
    await pool.query(
      'INSERT INTO plants (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [plant.id, plant]
    );
  }

  console.log('Importing logs...');
  for (const log of data.logs) {
    await pool.query(
      'INSERT INTO logs (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [log.id, log]
    );
  }

  console.log(`Done! Imported ${data.plants.length} plants and ${data.logs.length} log entries.`);
  await pool.end();
}

importData().catch(err => {
  console.error('Import failed:', err.message || err);
  console.error('Full error:', JSON.stringify(err, null, 2));
  process.exit(1);
});
