# Guia de Operações: Configuração e Scripts do Baserow

Este documento descreve como configurar a integração com o Baserow e como utilizar os scripts de automação localizados na pasta `/scripts`.

## 1. Configuração Inicial

A aplicação utiliza o Baserow como seu banco de dados principal. Toda a interação é feita através da API do Baserow. Para que a aplicação funcione, é necessário configurar as seguintes variáveis de ambiente:

| Variável de Ambiente      | Descrição                                                                                             | Exemplo                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `BASEROW_API_URL`         | A URL da sua instância Baserow.                                                                       | `https://api.baserow.io` (Cloud)      |
| `BASEROW_API_TOKEN`       | Token de API gerado no Baserow com permissões de leitura/escrita para o grupo/workspace da aplicação.   | `yourlongapitokenhere`                |
| `BASEROW_DATABASE_ID`     | O ID do "Database" (banco de dados) dentro do Baserow onde as tabelas da aplicação estão localizadas. | `12345`                               |
| `BASEROW_TABLE_*`         | IDs específicos para cada tabela utilizada pela aplicação. A lista completa pode ser encontrada em `src/server/integrations/baserow/tables.ts`. | `54321`                               |

**Como obter os IDs:**
-   `BASEROW_DATABASE_ID`: Pode ser encontrado na URL ao visualizar o banco de dados no Baserow.
-   `BASEROW_TABLE_*`: Ao clicar em uma tabela no Baserow, o ID da tabela também aparece na URL.

**É crucial que todas as variáveis de ambiente referentes às tabelas (`BASEROW_TABLE_*`) sejam preenchidas corretamente para que a aplicação possa ler e escrever os dados.**

## 2. Scripts de Automação

A pasta `/scripts` contém uma série de scripts Node.js (`.cjs` e `.mjs`) para auxiliar na automação de tarefas relacionadas ao Baserow e ao ambiente de desenvolvimento.

**Propósito:**
O principal objetivo desses scripts é mitigar a falta de um sistema de migração formal no Baserow e automatizar tarefas repetitivas de configuração. Eles garantem que a estrutura das tabelas e os dados iniciais possam ser replicados de forma consistente.

### Como Executar os Scripts

Os scripts são executados usando `node`. Por exemplo:
```bash
node scripts/baserow-schema-update.cjs
```

### Scripts Disponíveis

-   **`baserow-schema-update.cjs`**:
    *   **O que faz:** Este é um dos scripts mais importantes. Ele lê uma definição de esquema (provavelmente definida dentro do próprio script ou em um arquivo JSON) e a compara com o esquema atual das tabelas no Baserow. Ele pode então adicionar colunas que estão faltando ou, em alguns casos, corrigir tipos de dados.
    *   **Quando usar:** Use este script durante o desenvolvimento, após puxar alterações de outra branch que modificou o esquema do banco de dados, ou ao configurar um novo ambiente Baserow para garantir que ele esteja alinhado com a estrutura esperada pela aplicação.

-   **`baserow-tenant-update.cjs` / `baserow-users-setup.cjs`**:
    *   **O que fazem:** Estes scripts provavelmente são usados para popular o banco de dados com dados iniciais (seeding). `baserow-users-setup` pode criar um usuário administrador padrão, e `baserow-tenant-update` pode configurar um ou mais tenants (lojistas) para o ambiente de desenvolvimento.
    *   **Quando usar:** Use ao configurar um ambiente de desenvolvimento pela primeira vez para ter dados com os quais trabalhar.

-   **`baserow-aux-setup.cjs`**:
    *   **O que faz:** Pode ser um script que agrupa outras tarefas de configuração ou popula tabelas auxiliares (ex: categorias, tags, etc.).
    *   **Quando usar:** Use como parte da configuração inicial do ambiente.

-   **`baserow-sanitize.cjs`**:
    *   **O que faz:** O nome "sanitize" (higienizar) sugere que este script pode ser usado para limpar os dados no ambiente de desenvolvimento, removendo dados de teste, anonimizando informações ou restaurando o banco de dados a um estado inicial conhecido.
    *   **Quando usar:** Use quando seu ambiente de desenvolvimento estiver "sujo" com dados de teste e você quiser começar de novo.

**Aviso:**
**NÃO execute esses scripts no ambiente de produção** a menos que você saiba exatamente o que está fazendo. Eles são projetados principalmente para o ambiente de desenvolvimento e podem causar perda de dados se usados incorretamente em produção. A gestão do esquema em produção deve ser feita com extremo cuidado, preferencialmente de forma manual e planejada.
