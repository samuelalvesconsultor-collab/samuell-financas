const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  const arquivada = req.query.arquivada === 'true' ? true : false
  const mostrarArquivadas = req.query.arquivada !== undefined
  const sql = mostrarArquivadas
    ? 'SELECT * FROM categorias WHERE arquivada = $1 ORDER BY nome'
    : 'SELECT * FROM categorias ORDER BY nome'
  const params = mostrarArquivadas ? [arquivada] : []
  const { rows } = await pool.query(sql, params)
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { nome, tipo } = req.body
  const { rows } = await pool.query(
    'INSERT INTO categorias (nome, tipo) VALUES ($1, $2) RETURNING *',
    [nome, tipo]
  )
  res.status(201).json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { nome, tipo } = req.body
  const { rows } = await pool.query(
    'UPDATE categorias SET nome=$1, tipo=$2 WHERE id=$3 RETURNING *',
    [nome, tipo, req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

router.patch('/:id/arquivar', async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE categorias SET arquivada = NOT arquivada WHERE id=$1 RETURNING *',
    [req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
})

module.exports = router
