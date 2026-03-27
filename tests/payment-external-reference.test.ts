import { describe, expect, test } from "vitest";
import {
  buildPaymentExternalReference,
  parsePaymentExternalReference,
} from "../src/server/payments/externalReference.js";

describe("payment external reference", () => {
  test("builds and parses tenant-aware references", () => {
    const reference = buildPaymentExternalReference("tenant-a", "order-42");
    expect(reference).toBe("t:tenant-a:p:order-42");

    expect(parsePaymentExternalReference(reference)).toEqual({
      tenantId: "tenant-a",
      paymentOrderId: "order-42",
    });
  });

  test("returns null for unsupported formats", () => {
    expect(parsePaymentExternalReference("checkout-123")).toBeNull();
    expect(parsePaymentExternalReference("")).toBeNull();
  });
});
