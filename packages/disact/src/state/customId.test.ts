import { describe, expect, it } from "vitest";
import { generateCustomId, isDisactCustomId, parseCustomId } from "./customId";

describe("customId", () => {
  describe("isDisactCustomId", () => {
    it("should return true for customId starting with DSCT|", () => {
      expect(isDisactCustomId("DSCT|increment#0|5")).toBe(true);
    });

    it("should return false for regular customId", () => {
      expect(isDisactCustomId("regular_custom_id")).toBe(false);
      expect(isDisactCustomId("DSCT_increment#0_5")).toBe(false);
      expect(isDisactCustomId("")).toBe(false);
    });
  });

  describe("parseCustomId", () => {
    it("should parse valid customId", () => {
      const result = parseCustomId("DSCT|increment#0|5");
      expect(result).toEqual({
        action: "increment",
        instanceId: "0",
        prevState: "5",
      });
    });

    it("should parse customId with | in prevState", () => {
      const result = parseCustomId('DSCT|update#1|{"key":"value|with|pipe"}');
      expect(result).toEqual({
        action: "update",
        instanceId: "1",
        prevState: '{"key":"value|with|pipe"}',
      });
    });

    it("should return null for non-Disact customId", () => {
      expect(parseCustomId("regular_custom_id")).toBeNull();
    });

    it("should return null for invalid format", () => {
      expect(parseCustomId("DSCT|increment")).toBeNull();
      expect(parseCustomId("DSCT|increment|5")).toBeNull();
      expect(parseCustomId("DSCT|")).toBeNull();
    });
  });

  describe("generateCustomId", () => {
    it("should generate customId with correct format", () => {
      const customId = generateCustomId("increment", "0", "5");
      expect(customId).toBe("DSCT|increment#0|5");
    });

    it("should handle complex serialized state", () => {
      const customId = generateCustomId("update", "1", '{"count":10,"page":2}');
      expect(customId).toBe('DSCT|update#1|{"count":10,"page":2}');
    });

    it("should throw error when customId exceeds 100 characters", () => {
      const longState = "a".repeat(100);
      expect(() => generateCustomId("action", "0", longState)).toThrow(
        /customId exceeds 100 character limit/,
      );
    });

    it("should not throw error for exactly 100 characters", () => {
      // DSCT|action#0| = 14 characters (DSCT=4, |=1, action=6, #=1, 0=1, |=1)
      // 100 - 14 = 86 characters for prevState
      const state = "a".repeat(86);
      const customId = generateCustomId("action", "0", state);
      expect(customId.length).toBe(100);
    });
  });
});
