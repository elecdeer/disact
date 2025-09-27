import { describe, expect, it } from "vitest";
import {
  getCurrentContext,
  runInContext,
} from "./context-manager";

describe("context-manager", () => {

  describe("getCurrentContext", () => {
    it("should throw error when called outside of rendering", () => {
      expect(() => getCurrentContext()).toThrow(
        "getCurrentContext can only be called during rendering",
      );
    });
  });

  describe("runInContext", () => {
    it("should provide context during callback execution", () => {
      const testContext = { value: "test", id: 42 };
      let capturedContext: unknown;

      runInContext(testContext, () => {
        capturedContext = getCurrentContext();
      });

      expect(capturedContext).toBe(testContext);
    });

    it("should return the result of the callback", () => {
      const testContext = { data: "test" };

      const result = runInContext(testContext, () => {
        return "callback result";
      });

      expect(result).toBe("callback result");
    });

    it("should clear context after callback completes", () => {
      const testContext = { value: "test" };

      runInContext(testContext, () => {
        // callback内ではアクセス可能
        expect(getCurrentContext()).toBe(testContext);
      });

      // callback完了後はアクセス不可
      expect(() => getCurrentContext()).toThrow(
        "getCurrentContext can only be called during rendering"
      );
    });

    it("should clear context even when callback throws error", () => {
      const testContext = { value: "test" };

      expect(() => {
        runInContext(testContext, () => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");

      // エラー後もcontextはクリアされている
      expect(() => getCurrentContext()).toThrow(
        "getCurrentContext can only be called during rendering"
      );
    });

    it("should throw error on nested runInContext calls", () => {
      const outerContext = { level: "outer" };
      const innerContext = { level: "inner" };

      expect(() => {
        runInContext(outerContext, () => {
          expect(getCurrentContext()).toBe(outerContext);

          // ネストしたrunInContextはエラーになる
          runInContext(innerContext, () => {
            // ここには到達しない
          });
        });
      }).toThrow("runInContext cannot be nested");
    });

    it("should support async callbacks", async () => {
      const testContext = { async: true };

      const result = await runInContext(testContext, async () => {
        const ctx = getCurrentContext<typeof testContext>();
        // 非同期処理をシミュレート
        await new Promise(resolve => setTimeout(resolve, 1));
        return `async result: ${ctx.async}`;
      });

      expect(result).toBe("async result: true");

      // 非同期callback完了後もcontextはクリア
      expect(() => getCurrentContext()).toThrow();
    });

    it("should support typed context", () => {
      interface TypedContext {
        theme: string;
        userId: number;
      }

      const testContext: TypedContext = { theme: "dark", userId: 123 };

      runInContext(testContext, () => {
        const ctx = getCurrentContext<TypedContext>();
        expect(ctx.theme).toBe("dark");
        expect(ctx.userId).toBe(123);
      });
    });
  });
});
