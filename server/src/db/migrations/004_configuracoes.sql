CREATE TABLE IF NOT EXISTS configuracoes (
  chave       VARCHAR(100) PRIMARY KEY,
  valor       TEXT NOT NULL,
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO configuracoes (chave, valor) VALUES
  ('tema', 'dark'),
  ('dashboard_cards', '[{"id":"entrada_mes","titulo":"Entrada do Mês","visivel":true,"ordem":0},{"id":"contas_pagas","titulo":"Contas Pagas","visivel":true,"ordem":1},{"id":"contas_pendentes","titulo":"Contas Pendentes","visivel":true,"ordem":2}]')
ON CONFLICT (chave) DO NOTHING;
