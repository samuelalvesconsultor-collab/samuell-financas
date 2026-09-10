INSERT INTO categorias (nome, tipo, padrao)
SELECT 'Comissão', 'entrada', false
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Comissão');

INSERT INTO categorias (nome, tipo, padrao)
SELECT 'Bônus', 'entrada', false
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Bônus');

INSERT INTO categorias (nome, tipo, padrao)
SELECT 'Taxa de Adesão', 'entrada', false
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Taxa de Adesão');
