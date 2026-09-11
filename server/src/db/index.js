require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const { Pool } = require('pg')

// Produção (Neon/Supabase/Railway): usa DATABASE_URL
// Desenvolvimento local: usa variáveis individuais
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

module.exports = pool
