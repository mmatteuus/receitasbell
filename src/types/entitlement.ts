export type EntitlementAccessStatus = "active" | "revoked";

export interface Entitlement {
  id: string;
  paymentId: string;
  payerEmail: string;
  recipeSlug: string;
  accessStatus: EntitlementAccessStatus;
  createdAt: string;
  updatedAt: string;
}
