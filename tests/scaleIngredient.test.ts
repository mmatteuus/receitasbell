import { describe, it, expect } from "vitest";
import { scaleIngredient } from "../src/lib/utils/scaleIngredient";

describe("scaleIngredient", () => {
  it("should not scale if factor is 1", () => {
    expect(scaleIngredient("1 xícara de farinha", 2, 2)).toBe("1 xícara de farinha");
  });

  it("should scale whole numbers correctly", () => {
    expect(scaleIngredient("2 colheres de açúcar", 2, 4)).toBe("4 colheres de açúcar");
    expect(scaleIngredient("1 colher de sopa", 1, 3)).toBe("3 colher de sopa");
  });

  it("should format decimals correctly", () => {
    expect(scaleIngredient("3 xícaras", 2, 3)).toBe("4 e 1/2 xícaras");
    expect(scaleIngredient("1.5 litros de leite", 2, 4)).toBe("3 litros de leite");
    expect(scaleIngredient("1,5 litros de leite", 2, 4)).toBe("3 litros de leite");
  });

  it("should handle fraction strings correctly if present", () => {
    expect(scaleIngredient("1/2 xícara", 2, 4)).toBe("1 xícara");
    expect(scaleIngredient("1 e 1/2 litro", 2, 4)).toBe("3 litro");
  });

  it("should return the original text if no number is found", () => {
    expect(scaleIngredient("sal a gosto", 2, 4)).toBe("sal a gosto");
  });
});
