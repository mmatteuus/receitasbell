import { describe, expect, test } from "vitest";
import { createOpaqueState, hashOpaqueState, stateMatches } from "../src/server/shared/state.js";

describe("oauth state", () => {
  test("gera state opaco e validavel pelo hash", () => {
    const state = createOpaqueState();
    const hash = hashOpaqueState(state);

    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(state.length).toBeGreaterThan(20);
    expect(stateMatches(hash, state)).toBe(true);
    expect(stateMatches(hash, `${state}-tampered`)).toBe(false);
  });
});
