
import { Payment } from './types';

const now = new Date();

const generateRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const mockPayments: Payment[] = [
  {
    id: 1,
    status: 'approved',
    status_detail: 'accredited',
    payment_method_id: 'pix',
    payment_type_id: 'account_money',
    transaction_amount: 29.9,
    currency_id: 'BRL',
    payer: { email: 'comprador1@example.com', first_name: 'Fulano' },
    date_created: generateRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now).toISOString(),
    date_approved: now.toISOString(),
    external_reference: 'pave-de-chocolate',
    refunds: [],
    chargebacks: [],
  },
  {
    id: 2,
    status: 'pending',
    status_detail: 'pending_waiting_payment',
    payment_method_id: 'boleto',
    payment_type_id: 'ticket',
    transaction_amount: 19.9,
    currency_id: 'BRL',
    payer: { email: 'comprador2@example.com' },
    date_created: generateRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now).toISOString(),
    date_approved: null,
    external_reference: 'bolo-de-fuba',
    refunds: [],
    chargebacks: [],
  },
  {
    id: 3,
    status: 'in_process',
    status_detail: 'pending_review_manual',
    payment_method_id: 'credit_card',
    payment_type_id: 'credit_card',
    transaction_amount: 49.9,
    currency_id: 'BRL',
    payer: { email: 'comprador3@example.com', first_name: 'Ciclano' },
    date_created: generateRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now).toISOString(),
    date_approved: null,
    external_reference: 'torta-de-limao',
    refunds: [],
    chargebacks: [],
  },
  {
    id: 4,
    status: 'rejected',
    status_detail: 'cc_rejected_other_reason',
    payment_method_id: 'credit_card',
    payment_type_id: 'credit_card',
    transaction_amount: 9.9,
    currency_id: 'BRL',
    payer: { email: 'comprador4@example.com' },
    date_created: generateRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now).toISOString(),
    date_approved: null,
    external_reference: 'mousse-de-maracuja',
    refunds: [],
    chargebacks: [],
  },
  {
    id: 5,
    status: 'cancelled',
    status_detail: 'by_collector',
    payment_method_id: 'pix',
    payment_type_id: 'account_money',
    transaction_amount: 15.0,
    currency_id: 'BRL',
    payer: { email: 'comprador5@example.com' },
    date_created: generateRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now).toISOString(),
    date_approved: null,
    external_reference: 'brigadeiro-gourmet',
    refunds: [],
    chargebacks: [],
  },
  {
    id: 6,
    status: 'approved',
    status_detail: 'accredited',
    payment_method_id: 'credit_card',
    payment_type_id: 'credit_card',
    transaction_amount: 35.5,
    currency_id: 'BRL',
    payer: { email: 'comprador6@example.com', first_name: 'Beltrano' },
    date_created: generateRandomDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now).toISOString(),
    date_approved: generateRandomDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now).toISOString(),
    external_reference: 'cheesecake-de-morango',
    refunds: [],
    chargebacks: [],
  },
  {
    id: 7,
    status: 'refunded',
    status_detail: 'refunded_partially',
    payment_method_id: 'pix',
    payment_type_id: 'account_money',
    transaction_amount: 50.0,
    currency_id: 'BRL',
    payer: { email: 'comprador7@example.com' },
    date_created: generateRandomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now).toISOString(),
    date_approved: generateRandomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now).toISOString(),
    external_reference: 'pudim-de-leite',
    refunds: [{ id: 'refund123', amount: 25.0, date_created: new Date().toISOString() }],
    chargebacks: [],
  },
  // Add more payments to reach 20
  ...Array.from({ length: 13 }, (_, i) => {
    const status_options: Payment['status'][] = ['approved', 'pending', 'rejected', 'approved', 'approved'];
    const status = status_options[Math.floor(Math.random() * status_options.length)];
    const method_options: Payment['payment_method_id'][] = ['pix', 'credit_card', 'boleto'];
    const method = method_options[Math.floor(Math.random() * method_options.length)];
    const recipe_options = ['pave-de-chocolate', 'bolo-de-fuba', 'torta-de-limao', 'mousse-de-maracuja', 'brigadeiro-gourmet', 'cheesecake-de-morango', 'pudim-de-leite'];
    const recipe = recipe_options[Math.floor(Math.random() * recipe_options.length)];
    const created = generateRandomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now);
    const approved = status === 'approved' ? generateRandomDate(created, now) : null;

    return {
      id: 8 + i,
      status: status,
      status_detail: status === 'approved' ? 'accredited' : 'other_reason',
      payment_method_id: method,
      payment_type_id: method === 'boleto' ? 'ticket' : 'credit_card',
      transaction_amount: parseFloat((Math.random() * 100).toFixed(2)),
      currency_id: 'BRL' as const,
      payer: { email: `comprador${8 + i}@example.com` },
      date_created: created.toISOString(),
      date_approved: approved ? approved.toISOString() : null,
      external_reference: recipe,
      refunds: [],
      chargebacks: [],
    };
  }),
];
