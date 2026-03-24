# Legado (_legacy)

Qualquer código movido para `src/_legacy/` é considerado **legado** e deve:
- permanecer aqui até a Fase final (limpeza definitiva);
- ficar **excluído do TypeScript build** (ver `tsconfig.app.json`);
- ser removido somente após critérios de aceite da fase final.

Motivo: manter rollback e rastreabilidade durante refatorações.
