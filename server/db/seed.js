require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function seed() {
  const seedsDir = path.join(__dirname, 'seeds');
  const files = fs.readdirSync(seedsDir).sort();

  console.log(`Running ${files.length} seed(s)...`);

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`  ✓ ${file}`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('Seeding complete.');
  await pool.end();
}

module.exports = seed;

if (require.main === module) seed();
