require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8')
  await pool.query(sql)
  await pool.end()
  console.log('Seed complete.')
}

seed().catch(err => { console.error(err); process.exit(1) })
