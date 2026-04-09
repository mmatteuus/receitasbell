# Validação Obrigatória — PWA Online 10/10

## 1. Validação automática

Executar obrigatoriamente:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e -- --grep "PWA"
```

## 2. Critérios de aprovação automática

- `lint` sem erro
- `typecheck` sem erro
- `build` sem erro
- `test:unit` sem erro
- suíte PWA sem falha

## 3. Validação textual final

Executar:

```bash
grep -R "Instalar App\|Instalar app" -n src tests index.html vite.config.ts
```

### Resultado esperado

- zero ocorrência funcional residual em UI

## 4. Validação manual em Android Chrome

### Cenários obrigatórios

- abrir o site
- confirmar se o CTA e/ou prompt de instalação aparece corretamente
- instalar a PWA
- abrir o app instalado
- confirmar bootstrap por `/pwa/entry`
- confirmar redirecionamento para `/pwa/login` se não autenticado
- entrar e navegar em `/pwa/app`

### Evidência mínima

- screenshot do prompt/CTA
- screenshot do app já instalado aberto

## 5. Validação manual em iPhone Safari

### Cenários obrigatórios

- abrir a superfície PWA
- confirmar hint de instalação sem promessa de offline
- seguir o fluxo manual de adicionar à tela inicial
- abrir o app instalado
- confirmar aparência de app

### Evidência mínima

- screenshot do hint
- screenshot do app aberto após instalação manual

## 6. Validação manual em Desktop Chrome

### Cenários obrigatórios

- confirmar o fallback desktop
- confirmar que não existe mais `Instalar app`
- confirmar que o texto final está coerente

### Evidência mínima

- screenshot do CTA/fallback desktop

## 7. Regressão funcional

Também validar:

- `/pwa/entry`
- `/pwa/login`
- `/pwa/app`
- `/pwa/app/buscar`
- `/pwa/app/receitas/:slug`
- update flow da PWA

## 8. Definição final de aprovado

Só aprovar como **PWA online 10/10** quando:

- validação automática passar
- validação textual passar
- Android, iPhone e desktop estiverem validados
- nenhuma regressão funcional aparecer
