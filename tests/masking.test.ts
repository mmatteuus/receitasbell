import { describe, it, expect } from "vitest";
import { maskSecret, sanitize } from "../src/server/shared/validation.js";

describe("masking & sanitization", () => {
  describe("maskSecret", () => {
    it("should mask long strings", () => {
      expect(maskSecret("supersecrettoken123", 4)).toBe("supe***n123");
    });

    it("should mask short strings", () => {
      expect(maskSecret("abc", 2)).toBe("a***c");
    });

    it("should handle null/undefined", () => {
      expect(maskSecret(null)).toBe(null);
      expect(maskSecret(undefined)).toBe(null);
    });
  });

  describe("sanitize", () => {
    it("should redact sensitive keys in objects", () => {
      const input = {
        user: "mateus",
        password: "my-password-123",
        token: "secret-token-456",
        nested: {
          key: "pk_live_123",
          config: "ok"
        }
      };

      const result = sanitize(input);
      expect(result.user).toBe("mateus");
      expect(result.password).toBe("my-p***-123"); 
      expect(result.token).toBe("secr***-456");
      expect(result.nested.key).toBe("pk_l***_123");
      expect(result.nested.config).toBe("ok");
    });

    it("should redact sensitive keys in arrays", () => {
      const input = [
        { name: "ok", token: "secret" },
        { name: "bad", password: "pwd" }
      ];
      const result = sanitize(input);
      expect(result[0].token).toBe("s***t");
      expect(result[1].password).toBe("p***d");
    });

    it("should handle non-string sensitive values", () => {
      const input = { apiKey: 123456 };
      const result = sanitize(input);
      expect(result.apiKey).toBe("[REDACTED]");
    });
  });
});
