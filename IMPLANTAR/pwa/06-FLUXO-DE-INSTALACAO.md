# Fluxo de instalacao - PWA Online

## Android e navegadores com suporte a `beforeinstallprompt`
1. Usuario entra em `/pwa/entry`
2. Ve que esta na superficie do aplicativo
3. Ve o CTA `Instalar aplicativo`
4. Aciona o CTA
5. Recebe o prompt nativo do navegador
6. Instala o app
7. Abre em modo `standalone`
8. Segue para autenticacao e shell PWA

## iOS
1. Usuario entra em `/pwa/entry` ou `/pwa/login`
2. Ve instrucao manual clara
3. Usa Compartilhar
4. Usa Adicionar a Tela de Inicio
5. Abre pelo icone instalado

## Regras
- nao usar variacoes de texto para o CTA
- nao exibir instalacao em contexto web generico
- nao tratar admin web como porta principal de instalacao nesta fase
- nao simular prompt nativo em iOS

## Critarios de aceite
- Android instala a partir do CTA
- iOS recebe instrucao clara
- app abre em contexto PWA
- fluxo nao desvia para layout web

## Evidencia esperada
- captura do CTA em `/pwa/entry`
- captura do CTA em `/pwa/login`, quando suportado
- evidencia do prompt Android
- evidencia da instrucao iOS
