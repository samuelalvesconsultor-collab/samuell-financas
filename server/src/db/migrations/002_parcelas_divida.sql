CREATE TABLE IF NOT EXISTS parcelas_divida (
  id              SERIAL PRIMARY KEY,
  divida_id       INT NOT NULL REFERENCES dividas(id) ON DELETE CASCADE,
  numero_parcela  INT NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status          VARCHAR(15) CHECK (status IN ('pendente', 'paga')) DEFAULT 'pendente',
  data_pagamento  DATE,
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcelas_divida_divida_id ON parcelas_divida(divida_id);
