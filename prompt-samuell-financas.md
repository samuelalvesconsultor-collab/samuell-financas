# Prompt: Sistema de Gestão Financeira Pessoal — "Samuell Finanças"

## Contexto

Construir um sistema web (instalável como PWA) para gestão financeira pessoal, com foco inicial em controle de contas mensais, entradas e saídas, e classificação de dívidas por categoria. Relatórios gerenciais entram como módulo secundário, não como foco principal desta primeira fase.

**Stack:** Node.js + Express no backend, **PostgreSQL rodando localmente (via Docker no macOS)** como banco de dados, versionado no GitHub. Interface responsiva, instalável como PWA no celular. Deploy remoto (Vercel) fica em aberto para uma fase futura — nesta fase o ambiente é local, rodando no Mac.

---

## Objetivo principal desta fase

Criar o núcleo de gestão financeira pessoal, permitindo:

1. Registrar e visualizar **entradas** (receitas) e **saídas** (despesas) mensais
2. Gerenciar **contas mensais** (fixas e variáveis) com vencimento, status de pagamento e valor
3. Classificar e acompanhar **dívidas** (cartão de crédito, financiamentos, empréstimos, parcelamentos)
4. Categorizar cada lançamento usando **categorias convencionais**

---

## Categorias padrão (pré-cadastradas, editáveis)

- **Moradia** (aluguel, condomínio, IPTU)
- **Contas** (água, luz, internet, telefone, gás)
- **Cartões** (faturas de cartão de crédito)
- **Financiamentos/Empréstimos**
- **Alimentação** (mercado, restaurante, delivery)
- **Transporte** (combustível, app de transporte, manutenção)
- **Lazer** (streaming, saídas, hobbies)
- **Saúde** (plano, farmácia, consultas)
- **Educação**
- **Investimentos**
- **Renda/Receitas** (salário, comissões, taxas de adesão, bônus por contrato)
- **Outros**

O usuário deve poder criar, editar e arquivar categorias além das padrão.

---

## Funcionalidades essenciais (MVP)

### 1. Dashboard mensal
- Visão do mês corrente: total de entradas, total de saídas, saldo
- Lista de contas a vencer nos próximos dias, com destaque para atrasadas
- Resumo rápido por categoria (quanto foi gasto em cada uma no mês)

### 2. Lançamentos (entradas e saídas)
- Cadastro de lançamento com: descrição, valor, data, categoria, tipo (entrada/saída), status (pago/pendente)
- Lançamentos recorrentes (ex: aluguel todo mês) com criação automática do próximo período
- Edição e exclusão de lançamentos
- Filtro por categoria, período e status

### 3. Contas mensais
- Cadastro de contas fixas e variáveis com dia de vencimento
- Marcar como paga (com data de pagamento efetiva)
- Alertas visuais para contas vencidas ou próximas do vencimento

### 4. Gestão de dívidas
- Cadastro de dívida: tipo (cartão, financiamento, empréstimo, parcelamento), valor total, número de parcelas, valor da parcela, data de início e término
- Acompanhamento do saldo devedor e parcelas já pagas
- Visão consolidada de todas as dívidas ativas, com total comprometido por mês

### 5. Relatórios gerenciais (módulo secundário)
- Gráfico de entradas x saídas por mês
- Gráfico de gastos por categoria (pizza ou barras)
- Evolução do saldo devedor total ao longo do tempo
- Exportação simples (CSV) dos lançamentos por período

---

## Requisitos técnicos

- Autenticação de usuário (login simples, single-user por enquanto)
- **PostgreSQL local no macOS**, subindo via Docker Compose (ou Postgres.app como alternativa), com tabelas para: `lancamentos`, `contas`, `dividas`, `categorias`
- Script de migrations (ex: usando Knex, Prisma ou node-pg-migrate) para versionar o schema do banco
- Arquivo `.env` local para as credenciais de conexão (host `localhost`, porta padrão `5432`)
- API REST em Express para CRUD de cada entidade
- Frontend responsivo (mobile-first), instalável como PWA
- Ambiente de desenvolvimento local (`npm run dev`), sem dependência de deploy remoto nesta fase
- Versionado no GitHub, preparado para futura migração a um banco gerenciado (ex: Supabase) quando for para produção

---

## Fora do escopo desta fase

- Múltiplos usuários/perfis
- Integração bancária automática (open finance)
- Módulo de investimentos detalhado
- Cobrança de clientes vinculada a calendário (isso pertence ao sistema de CRM, não a este)

---

## Entregável esperado

Um plano de implementação (ou código inicial) cobrindo: modelagem do banco de dados, estrutura de rotas da API, wireframe das telas principais (Dashboard, Lançamentos, Contas, Dívidas) e configuração do ambiente local no macOS (Docker Compose com Postgres, variáveis de ambiente, comando único para subir o banco e a aplicação).
