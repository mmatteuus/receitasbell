console.error(
  [
    "Script legado desativado por segurança.",
    "Evite tokens hardcoded no repositório.",
    "Use integração segura com variáveis de ambiente para atualizar imagens.",
  ].join("\n"),
);
process.exit(1);
