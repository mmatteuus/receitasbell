# ADR-002: Uso do Baserow como Banco de Dados Principal

**Status:** Aceito

**Contexto:**
A aplicação necessita de um banco de dados para armazenar dados operacionais, como informações de tenants (lojistas), usuários, receitas, pedidos, sessões, etc. A escolha do banco de dados é uma decisão crítica que impacta a velocidade de desenvolvimento, a manutenibilidade, a escalabilidade e o custo operacional do projeto. As alternativas consideradas foram bancos de dados SQL tradicionais (ex: PostgreSQL), NoSQL (ex: MongoDB) e plataformas "Database as a Service" (DBaaS) ou "low-code".

**Decisão:**
Optamos por utilizar o **Baserow** como o banco de dados principal do sistema. O Baserow é uma plataforma de banco de dados open-source, "API-first" e "no-code", que oferece uma interface de planilha para visualização e manipulação dos dados, ao mesmo tempo que expõe uma API REST robusta para interação programática.

**Justificativa:**

1.  **Velocidade de Desenvolvimento e Prototipagem:**
    *   A interface visual do Baserow permite que o esquema do banco de dados (tabelas, colunas, relacionamentos) seja criado e modificado de forma extremamente rápida, sem a necessidade de escrever migrações SQL complexas. Isso é ideal para um ambiente de startup onde os requisitos mudam com frequência.

2.  **Facilidade de Gerenciamento para Não-Desenvolvedores:**
    *   A interface de planilha é intuitiva e acessível para a equipe de operações ou administradores de conteúdo. Eles podem visualizar, adicionar e editar dados diretamente no Baserow sem a necessidade de uma ferramenta de administração customizada (admin panel) para todas as tarefas, reduzindo a carga de desenvolvimento.

3.  **API-First e Integração:**
    *   O Baserow foi projetado para ser "API-first". Tudo o que pode ser feito na UI pode ser feito via API REST, o que garante que a aplicação não terá limitações ao interagir com o banco de dados de forma programática.

4.  **Custo-Benefício:**
    *   O Baserow pode ser auto-hospedado (self-hosted) ou utilizado na sua versão cloud. A capacidade de auto-hospedagem oferece um controle maior sobre os custos e a infraestrutura a longo prazo.

5.  **Flexibilidade de Schema:**
    *   Embora apresente uma estrutura relacional, a facilidade para adicionar e modificar colunas oferece uma flexibilidade maior do que um banco de dados SQL tradicional, adaptando-se bem a um modelo de desenvolvimento ágil.

**Consequências:**

*   **Positivas:**
    *   **Redução do Tempo de Ciclo:** Acelera o ciclo de "ideia -> implementação do schema -> desenvolvimento da feature".
    *   **Empoderamento da Equipe de Negócios:** Permite que a equipe não-técnica gerencie dados diretamente, liberando os desenvolvedores para focar na lógica de negócio.
    *   **Curva de Aprendizagem Baixa:** A interface é familiar para qualquer pessoa que já usou uma planilha.

*   **Negativas/Riscos:**
    *   **Gerenciamento de Migrações:** Não há um sistema de migrações versionadas como em frameworks tradicionais (ex: `django migrations`, `rails db:migrate`). As alterações de esquema são feitas manualmente na UI. Isso exige disciplina e documentação para garantir a consistência entre os ambientes (desenvolvimento, produção). Os scripts na pasta `/scripts` (`baserow-schema-update.cjs`, etc.) são uma tentativa de mitigar isso, mas não são uma solução completa.
    *   **Performance em Larga Escala:** Para volumes de dados extremamente grandes e consultas de alta complexidade, o Baserow pode não ter a mesma performance otimizada de um banco de dados como o PostgreSQL. O desempenho deve ser monitorado.
    *   **Consultas Complexas:** Realizar `JOINs` complexos e agregações pode ser menos direto via API REST do que com SQL. A lógica para combinar dados de diferentes tabelas reside na aplicação.
    *   **Acoplamento à Ferramenta:** Embora a lógica de negócio esteja separada, a camada de acesso a dados (`src/server/integrations/baserow`) está totalmente acoplada à API do Baserow. Migrar para outro banco de dados no futuro exigiria a reescrita completa desta camada.
