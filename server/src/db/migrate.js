require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const { Pool } = require('pg')
const fs   = require('fs')
const path = require('path')

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    console.log(`Running migration: ${file}`)
    await pool.query(sql)
  }
  await pool.end()
  console.log('Migrations complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
