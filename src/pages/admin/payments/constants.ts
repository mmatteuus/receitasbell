export const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const COLORS: Record<string, string> = {
  approved: 'hsl(142, 71%, 45%)',
  pending: 'hsl(45, 93%, 47%)',
  in_process: 'hsl(199, 89%, 48%)',
  rejected: 'hsl(0, 84%, 60%)',
  cancelled: 'hsl(0, 0%, 60%)',
  refunded: 'hsl(262, 83%, 58%)',
  charged_back: 'hsl(330, 81%, 60%)',
};

export const METHOD_COLORS: Record<string, string> = {
  pix: 'hsl(168, 76%, 42%)',
  credit_card: 'hsl(221, 83%, 53%)',
  boleto: 'hsl(25, 95%, 53%)',
  pending: 'hsl(215, 16%, 47%)',
};

export const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto',
  pending: 'A definir',
};

export const STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  in_process: 'Em Processo',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Chargeback',
};

export const STATUS_LABELS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([k, v]) => [v, k])
);
