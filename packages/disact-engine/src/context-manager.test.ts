import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCurrentContext,
  getCurrentContext,
  setCurrentContext,
} from "./context-manager";

describe("context-manager", () => {
  beforeEach(() => {
    // 各テスト前にcontextをクリア
    clearCurrentContext();
  });

  describe("getCurrentContext", () => {
    it("should throw error when called outside of rendering", () => {
      expect(() => getCurrentContext()).toThrow(
        "getCurrentContext can only be called during rendering",
      );
    });

    it("should return the current context when called during rendering", () => {
      const testContext = { theme: "dark", user: "test" };
      setCurrentContext(testContext);

      const result = getCurrentContext();
      expect(result).toBe(testContext);
    });

    it("should return typed context with generic", () => {
      interface TestContext {
        theme: string;
        userId: number;
      }

      const testContext: TestContext = { theme: "light", userId: 123 };
      setCurrentContext(testContext);

      const result = getCurrentContext<TestContext>();
      expect(result.theme).toBe("light");
      expect(result.userId).toBe(123);
    });

    it("should throw error after context is cleared", () => {
      const testContext = { test: "value" };
      setCurrentContext(testContext);
      clearCurrentContext();

      expect(() => getCurrentContext()).toThrow(
        "getCurrentContext can only be called during rendering",
      );
    });
  });

  describe("setCurrentContext", () => {
    it("should set the context for getCurrentContext", () => {
      const testContext = { foo: "bar" };
      setCurrentContext(testContext);

      expect(getCurrentContext()).toBe(testContext);
    });

    it("should overwrite previous context", () => {
      const firstContext = { value: 1 };
      const secondContext = { value: 2 };

      setCurrentContext(firstContext);
      setCurrentContext(secondContext);

      expect(getCurrentContext()).toBe(secondContext);
    });
  });

  describe("clearCurrentContext", () => {
    it("should make getCurrentContext throw error", () => {
      const testContext = { test: "value" };
      setCurrentContext(testContext);
      clearCurrentContext();

      expect(() => getCurrentContext()).toThrow();
    });

    it("should be safe to call multiple times", () => {
      clearCurrentContext();
      clearCurrentContext();

      expect(() => getCurrentContext()).toThrow();
    });
  });

  describe("nested context usage", () => {
    it("should handle nested context setting correctly", () => {
      const outerContext = { level: "outer" };
      const innerContext = { level: "inner" };

      setCurrentContext(outerContext);
      expect(getCurrentContext()).toBe(outerContext);

      setCurrentContext(innerContext);
      expect(getCurrentContext()).toBe(innerContext);

      clearCurrentContext();
      expect(() => getCurrentContext()).toThrow();
    });
  });
});
