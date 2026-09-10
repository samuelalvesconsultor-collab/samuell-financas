INSERT INTO categorias (nome, tipo, padrao) VALUES
  ('Moradia', 'saida', true),
  ('Contas', 'saida', true),
  ('Cartões', 'saida', true),
  ('Financiamentos/Empréstimos', 'saida', true),
  ('Alimentação', 'saida', true),
  ('Transporte', 'saida', true),
  ('Lazer', 'saida', true),
  ('Saúde', 'saida', true),
  ('Educação', 'saida', true),
  ('Investimentos', 'ambos', true),
  ('Renda/Receitas', 'entrada', true),
  ('Outros', 'ambos', true)
ON CONFLICT DO NOTHING;
