CREATE TABLE IF NOT EXISTS gastos (
  id SERIAL PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data DATE NOT NULL,
  forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'pix',
  categoria VARCHAR(60) NOT NULL DEFAULT 'gastos_extras',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
