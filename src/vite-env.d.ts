/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

type MercadoPagoCardFormData = {
  token?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments?: string;
  identificationType?: string;
  identificationNumber?: string;
};

type MercadoPagoCardFormInstance = {
  getCardFormData?: () => MercadoPagoCardFormData;
  unmount?: () => void;
};

type MercadoPagoCardFormOptions = {
  amount: string;
  autoMount?: boolean;
  form: {
    id: string;
    cardholderName: { id: string };
    cardholderEmail: { id: string };
    cardNumber: { id: string };
    securityCode: { id: string };
    expirationMonth: { id: string };
    expirationYear: { id: string };
    issuer: { id: string };
    installments: { id: string };
    identificationType: { id: string };
    identificationNumber: { id: string };
  };
  callbacks: {
    onFormMounted?: (error?: { message?: string } | null) => void;
    onSubmit?: (event: Event) => void | Promise<void>;
  };
};

type MercadoPagoInstance = {
  cardForm: (options: MercadoPagoCardFormOptions) => MercadoPagoCardFormInstance;
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}
