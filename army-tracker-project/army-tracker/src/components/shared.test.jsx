import { describe, it, expect } from "vitest";
import { formatMovement } from "../components/shared.jsx";

describe("formatMovement", () => {
  it("appends the inch to a bare number", () => {
    expect(formatMovement("6")).toBe('6"');
    expect(formatMovement(12)).toBe('12"');
  });

  it("leaves an already-inched value untouched (no double inch)", () => {
    expect(formatMovement('9"')).toBe('9"');
    expect(formatMovement('20+"')).toBe('20+"');
  });

  it("leaves no-movement and other values as-is", () => {
    expect(formatMovement("-")).toBe("-");
    expect(formatMovement("")).toBe("");
    expect(formatMovement(null)).toBe("");
  });
});
