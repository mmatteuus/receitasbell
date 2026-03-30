# Previsão de falhas futuras

## 3 meses
- connect status falso-positivo sem readiness real
- webhook duplicado criando ruído operacional
- drift entre preço local e Stripe
- referência residual a Mercado Pago em docs/testes/env

## 1 ano
- acúmulo de feature flags não removidas
- crescimento linear de writes no Baserow
- tabela de eventos sem retenção adequada
- runtime/deps desalinhados com Vercel

## 3 anos
- nova troca de provider ficar cara se o modelo não for realmente agnóstico
- mudanças regulatórias exigirem novos campos de verificação
- catálogo crescer sem política sólida de sync e versionamento de preços
