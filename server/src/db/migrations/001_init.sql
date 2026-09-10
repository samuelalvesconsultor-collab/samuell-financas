CREATE TABLE IF NOT EXISTS categorias (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  tipo       VARCHAR(20) CHECK (tipo IN ('entrada', 'saida', 'ambos')),
  padrao     BOOLEAN DEFAULT false,
  arquivada  BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lancamentos (
  id              SERIAL PRIMARY KEY,
  descricao       VARCHAR(255) NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  data            DATE NOT NULL,
  tipo            VARCHAR(10) CHECK (tipo IN ('entrada', 'saida')),
  status          VARCHAR(15) CHECK (status IN ('pago', 'pendente')),
  categoria_id    INT REFERENCES categorias(id),
  recorrente      BOOLEAN DEFAULT false,
  recorrencia_dia INT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contas (
  id              SERIAL PRIMARY KEY,
  descricao       VARCHAR(255) NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  dia_vencimento  INT NOT NULL,
  mes_referencia  DATE NOT NULL,
  status          VARCHAR(15) CHECK (status IN ('paga', 'pendente', 'atrasada')),
  data_pagamento  DATE,
  categoria_id    INT REFERENCES categorias(id),
  fixa            BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dividas (
  id             SERIAL PRIMARY KEY,
  descricao      VARCHAR(255) NOT NULL,
  tipo           VARCHAR(30) CHECK (tipo IN ('cartao', 'financiamento', 'emprestimo', 'parcelamento')),
  valor_total    NUMERIC(12,2) NOT NULL,
  num_parcelas   INT NOT NULL,
  valor_parcela  NUMERIC(12,2) NOT NULL,
  parcelas_pagas INT DEFAULT 0,
  data_inicio    DATE NOT NULL,
  data_termino   DATE NOT NULL,
  categoria_id   INT REFERENCES categorias(id),
  ativa          BOOLEAN DEFAULT true,
  created_at     TIMESTAMP DEFAULT NOW()
);
