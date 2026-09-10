# Prompt para Claude Code — Sistema de Controle Financeiro "Samuell Finanças"

## Contexto para o Claude Code

Sou corretor de seguros independente, atuo sob a marca **Samuell Seguros** em Brasília-DF, com foco em planos de saúde, consórcio e seguro auto. Já tenho um CRM próprio (**CRM Samuell Seguros**) construído com Node.js/Express, Supabase (PostgreSQL), Vercel e GitHub, com Kanban, Financeiro, Calendário integrado ao Google Calendar e templates de WhatsApp.

Quero agora construir um **segundo sistema, independente do CRM, focado 100% em controle financeiro** — pessoal e profissional ao mesmo tempo — chamado **"Samuell Finanças"**. Deve seguir a mesma stack e o mesmo padrão de qualidade do CRM, para eu manter consistência técnica e visual entre os dois projetos.

---

## 1. Stack técnica (mesma linha do CRM)

- **Backend:** Node.js + Express
- **Banco de dados:** Supabase (PostgreSQL)
- **Deploy:** Vercel
- **Versionamento:** GitHub
- **Frontend:** aplicação web responsiva, instalável como **PWA** (Progressive Web App) para funcionar como app mobile no celular (ícone na tela inicial, funciona como app nativo), do mesmo jeito que o CRM foi disponibilizado
- **Exportação:** geração de planilhas (.xlsx/.csv) para qualquer módulo do sistema, para eu poder abrir os dados no Excel/Google Sheets quando quiser
- **Integração de calendário:** Google Calendar via OAuth2 (reaproveitar a mesma lógica de integração já validada no CRM)
- **Notificações:** push notifications (via PWA) + lembretes por e-mail e, se possível, integração com WhatsApp para alertas de vencimento
- **Tema visual:** manter a mesma identidade visual do CRM (charcoal escuro/vermelho, fontes Inter e Orbitron), para os dois sistemas parecerem parte da mesma marca

---

## 2. Visão geral do sistema

O sistema deve separar claramente três esferas, mas permitir uma visão consolidada:
1. **Financeiro profissional** (receitas do negócio de seguros)
2. **Financeiro pessoal** (contas e dívidas próprias)
3. **Investimentos** (aba própria, separada do fluxo de caixa do dia a dia)

Cada lançamento deve poder ser marcado como **Pessoal** ou **Profissional** (e opcionalmente vinculado a um cliente/contrato), para permitir relatórios segmentados.

---

## 3. Módulos obrigatórios

### 3.1. Receitas / Entradas
- Registro de cada entrada financeira recebida por contrato fechado: **taxa de adesão** e **bônus/comissão**
- Cada entrada vinculada a: cliente, tipo de produto (saúde, consórcio, auto), operadora, data de recebimento e valor
- Histórico completo por cliente e por operadora
- Filtros por período, tipo de receita e status (recebido/a receber)

### 3.2. Controle de Financiamentos e Dívidas
- Cadastro de cada financiamento/dívida (nome, valor total, número de parcelas, taxa de juros se houver, data de início)
- Cálculo automático de: valor já pago, saldo devedor restante, parcelas restantes, data prevista de quitação
- Atualização automática do saldo a cada parcela paga
- Alerta de parcelas em atraso

### 3.3. Pagamentos Mensais (contas a pagar)
- Cadastro de contas recorrentes, tanto pessoais quanto profissionais (aluguel, internet, ferramentas do negócio, etc.)
- Status de cada conta: pendente, paga, atrasada
- Repetição automática mensal (a conta recorrente gera o próximo lançamento automaticamente)
- Vinculação ao calendário com lembrete antes do vencimento

### 3.4. Cobranças a Clientes (contas a receber)
- Registro de valores a cobrar de clientes (parcelas de adesão, mensalidades pendentes, etc.)
- Vinculação de cada cobrança a um evento no calendário
- Notificação automática (para mim) alguns dias antes do vencimento de cada cobrança, para eu entrar em contato via WhatsApp
- Status: a vencer, vencido, pago

### 3.5. Cadastro de Clientes
- Cadastro próprio dentro da ferramenta (nome, contato, produto contratado, operadora, valores envolvidos)
- Se possível, estrutura pensada para futura integração/sincronização com o CRM (mesmo ID de cliente ou campo de referência cruzada), para não duplicar cadastro no futuro

### 3.6. Calendário Financeiro
- Integração com Google Calendar (mesmo fluxo OAuth2 do CRM)
- Todo evento financeiro (conta a pagar, cobrança a receber, parcela de financiamento) aparece automaticamente no calendário
- Notificações configuráveis (ex: 3 dias antes, 1 dia antes, no dia)

### 3.7. Investimentos
- Aba separada para registrar aportes, tipo de investimento (renda fixa, ações, fundos, reserva de emergência, etc.), data e valor
- Acompanhamento da evolução do total investido ao longo do tempo
- Campo de meta financeira (quanto pretendo ter acumulado até determinada data)

### 3.8. Dashboard Geral
- Visão consolidada: total de entradas x total de saídas no mês, saldo atual, dívidas em aberto, próximos vencimentos (pessoais e de clientes)
- Gráficos de evolução mensal (receitas, despesas, saldo, investimentos)
- Indicadores separados: financeiro pessoal vs. profissional

### 3.9. Exportação em Planilha
- Botão de exportar qualquer módulo (receitas, dívidas, contas, clientes, investimentos) em .xlsx ou .csv
- Exportação do relatório consolidado mensal/anual

---

## 4. Funções adicionais sugeridas (valor agregado)

Além do que descrevi, seria importante incluir:

- **Categorização de despesas** (moradia, alimentação, ferramentas do negócio, impostos, etc.) para entender para onde o dinheiro está indo
- **Reserva de emergência**: módulo simples para acompanhar quanto já foi guardado vs. meta definida
- **Relatório de comissões por operadora**: para saber qual operadora traz mais receita ao longo do tempo
- **Projeção de fluxo de caixa**: com base nas contas recorrentes e cobranças programadas, mostrar uma previsão dos próximos 30/60/90 dias
- **Controle de impostos/MEI ou PJ** (se aplicável ao seu regime): lembrete de guias mensais (DAS, etc.)
- **Backup automático dos dados** (exportação periódica agendada)
- **Modo "visão rápida" no mobile**: tela inicial do PWA com saldo do mês, contas vencendo nos próximos 7 dias e cobranças pendentes de clientes
- **Histórico de alterações** em lançamentos importantes (auditoria simples, útil para controle de dívidas)
- **Multiusuário/permissões**: preparar a estrutura para caso, no futuro, alguém da equipe precise ter acesso restrito (só leitura, por exemplo)

---

## 5. Estrutura de dados sugerida (ponto de partida para o Claude Code)

- `clientes` (id, nome, contato, produto, operadora, referência_crm)
- `receitas` (id, cliente_id, tipo [adesão/bônus], valor, data, operadora, status)
- `financiamentos` (id, nome, valor_total, parcelas_totais, parcelas_pagas, valor_parcela, data_inicio, categoria [pessoal/profissional])
- `contas_pagar` (id, nome, valor, vencimento, recorrente [sim/não], categoria [pessoal/profissional], status)
- `contas_receber` (id, cliente_id, valor, vencimento, status)
- `investimentos` (id, tipo, valor, data, meta_id)
- `metas_investimento` (id, descrição, valor_alvo, data_alvo)
- `eventos_calendario` (id, tipo_origem, origem_id, data, status_notificação)

---

## 6. Fluxo de trabalho de desenvolvimento

Seguir o mesmo padrão usado no CRM:
1. Criar a estrutura do projeto em `~/PROJETOS/financas` (ou nome equivalente)
2. Prototipar primeiro em Vanilla JS/localStorage para validar telas e fluxos rapidamente
3. Migrar para Supabase (PostgreSQL) quando o modelo de dados estiver validado
4. Deploy contínuo via Vercel, conectado ao GitHub
5. Configurar o PWA (manifest.json + service worker) para instalação no celular
6. Fluxo diário de trabalho: `cd ~/PROJETOS/financas` → `claude --continue`

**Atenção:** no CRM tivemos um problema recorrente em que o Vercel (plano Hobby) bloqueava deploys quando o Claude Code adicionava assinatura de co-autor nos commits, exigindo Redeploy manual pelo painel da Vercel. Configurar o Claude Code desde o início para não incluir essa assinatura, evitando o mesmo problema neste projeto.

---

## 7. Entregável esperado do Claude Code

Peço que, com base neste prompt, o Claude Code:
1. Proponha a estrutura de pastas e arquivos do projeto
2. Monte o schema do banco de dados no Supabase
3. Construa as telas principais (Dashboard, Receitas, Financiamentos, Contas a Pagar, Contas a Receber, Clientes, Calendário, Investimentos)
4. Implemente a exportação em planilha
5. Configure o PWA para uso como app mobile
6. Configure a integração com Google Calendar e as notificações
