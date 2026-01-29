import { describe, expect, it } from "vitest";
import { generateCustomId, isDisactCustomId, parseCustomId } from "./customId";

describe("customId", () => {
  describe("isDisactCustomId", () => {
    it("should return true for customId starting with DSCT|", () => {
      expect(isDisactCustomId("DSCT|0|increment|5")).toBe(true);
    });

    it("should return false for regular customId", () => {
      expect(isDisactCustomId("regular_custom_id")).toBe(false);
      expect(isDisactCustomId("DSCT_0_increment_5")).toBe(false);
      expect(isDisactCustomId("")).toBe(false);
    });
  });

  describe("parseCustomId", () => {
    it("should parse valid customId", () => {
      const result = parseCustomId("DSCT|0|increment|5");
      expect(result).toEqual({
        hookId: "0",
        action: "increment",
        prevState: "5",
      });
    });

    it("should parse customId with | in prevState", () => {
      const result = parseCustomId('DSCT|1|update|{"key":"value|with|pipe"}');
      expect(result).toEqual({
        hookId: "1",
        action: "update",
        prevState: '{"key":"value|with|pipe"}',
      });
    });

    it("should return null for non-Disact customId", () => {
      expect(parseCustomId("regular_custom_id")).toBeNull();
    });

    it("should return null for invalid format", () => {
      expect(parseCustomId("DSCT|0")).toBeNull();
      expect(parseCustomId("DSCT|0|increment")).toBeNull();
      expect(parseCustomId("DSCT|")).toBeNull();
    });
  });

  describe("generateCustomId", () => {
    it("should generate customId with correct format", () => {
      const customId = generateCustomId("0", "increment", "5");
      expect(customId).toBe("DSCT|0|increment|5");
    });

    it("should handle complex serialized state", () => {
      const customId = generateCustomId("1", "update", '{"count":10,"page":2}');
      expect(customId).toBe('DSCT|1|update|{"count":10,"page":2}');
    });

    it("should throw error when customId exceeds 100 characters", () => {
      const longState = "a".repeat(100);
      expect(() => generateCustomId("0", "action", longState)).toThrow(
        /customId exceeds 100 character limit/,
      );
    });

    it("should not throw error for exactly 100 characters", () => {
      // DSCT|0|action| = 14 characters (DSCT=4, |=1, 0=1, |=1, action=6, |=1)
      // 100 - 14 = 86 characters for prevState
      const state = "a".repeat(86);
      const customId = generateCustomId("0", "action", state);
      expect(customId.length).toBe(100);
    });
  });
});
