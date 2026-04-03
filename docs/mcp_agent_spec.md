# Especificação Técnica do Agente MCP (Antigravity)

Este documento detalha os requisitos, configurações e responsabilidades para o agente Model Context Protocol (MCP) operando na plataforma Antigravity.

## 1. Identificação da Plataforma
- **Plataforma:** Antigravity
- **Runtime:** Node.js 20+ (Instalado globalmente no ambiente)

## 2. Requisitos de Infraestrutura (Instalação Global)
As seguintes ferramentas devem estar instaladas de forma **global** e configuradas no ambiente de execução (PATH do sistema):
- **`supabase` (CLI):** Instalado via `npm install -g supabase` para orquestração de banco de dados.
- **`psql`:** Cliente nativo PostgreSQL instalado globalmente no sistema.
- **`docker`:** Serviço de containerização ativo globalmente no host.

## 3. Configuração de Variáveis de Ambiente
O agente requer as seguintes variáveis configuradas para operação total:
- `SUPABASE_URL`: Endpoint da API do projeto Supabase.
- `SUPABASE_KEY`: Chave de acesso (Service Role ou Anon).
- `ANTIGRAVITY_PROJECT_ID`: Identificador do projeto na plataforma Antigravity.
- `MCP_TOKEN`: (Opcional) Token de acesso para APIs do servidor MCP.

## 4. Segurança e Acessos
- **Credenciais:** É necessário o uso de credenciais de SSH/Agent para operações de rede seguras.
- **Acesso IAM:** Deve ser atribuído um **Scoped IAM Role** que garanta acesso total aos recursos do Supabase.

## 5. Detalhes de Setup do Supabase
- **Conexão:** URL do banco de dados (Host, Porta e Nome).
- **Service Role Key:** Chave de função de serviço obrigatória para operações que exigem bypass de políticas de RLS.
- **Autorizações:** Configuração de permissões e políticas de autenticação.
- **TLS/SSL:** Exigência de conexões criptografadas (TLS).
- **Armazenamento Seguro:** As credenciais devem ser armazenadas em um **Vault** de segurança (ex: HashiCorp Vault, Supabase Secrets) ou em arquivos `.env` criptografados.

## 6. Responsabilidades do Agente MCP
- **Deploy de Conectores:** Instalar e configurar conexões entre serviços.
- **Sincronização de Esquemas:** Garantir a paridade entre código e banco de dados.
- **Execução de Migrações:** Gerenciar o histórico e a aplicação de scripts DDL.
- **Monitoramento:** Observar logs e métricas operacionais.
- **Exposição de API:** Fornecer uma API de gerenciamento para controle externo.

### Dependências Técnicas:
- `node-postgres`
- `@supabase/supabase-js`
- `@supabase/gotrue-js`
- Plugins da CLI do Supabase

## 7. Configuração Específica Antigravity
- **Dados do Projeto:** Nome, Workspace e Região de implantação.
- **Atribuição de Permissões:** Lista de acessos granulares necessários para o agente.
- **Mecanismo de Autenticação:** Uso de **Key File** (Arquivo de chave) ou **OAuth Token**.
- **Resiliência:**
  - Procedimentos de backup automatizados.
  - Alertas operacionais via Webhooks (Alert Hooks).
