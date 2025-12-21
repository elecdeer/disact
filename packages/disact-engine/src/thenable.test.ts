// oxlint-disable require-to-throw-message: SuspenseではError以外もthrowしうる

import { describe, expect, it } from "vitest";
import { use } from "./thenable";

describe("use", () => {
  describe("Promise state management", () => {
    it("should throw promise on first call and return value after resolution", async () => {
      const { promise, resolve } = Promise.withResolvers<string>();

      // 最初の呼び出しでPromiseが投げられる
      expect(() => use(promise)).toThrow();

      // Promise を解決
      resolve("resolved value");

      // Promise解決後の呼び出しで値が返される
      await promise;
      const result = use(promise);
      expect(result).toBe("resolved value");
    });

    it("should handle promise rejection", async () => {
      const { promise, reject } = Promise.withResolvers<string>();

      // 最初の呼び出しでPromiseが投げられる
      expect(() => use(promise)).toThrow();

      // Promiseを拒否
      const error = new Error("Test error");
      reject(error);

      // 次の呼び出しでエラーが投げられることを確認
      await promise.catch(() => {});
      expect(() => use(promise)).toThrow("Test error");
    });

    it("should return fulfilled value for already resolved promises", async () => {
      const resolvedPromise = Promise.resolve("immediate value");

      // 最初の呼び出しでPromiseが投げられる
      expect(() => use(resolvedPromise)).toThrow();

      // Promise解決後の呼び出しで値が返される
      await resolvedPromise;
      const result = use(resolvedPromise);
      expect(result).toBe("immediate value");
    });

    it("should throw error for already rejected promises", async () => {
      const rejectedPromise = Promise.reject(new Error("Immediate error"));

      // 最初の呼び出しでPromiseが投げられる
      expect(() => use(rejectedPromise)).toThrow();

      // Promise拒否後の呼び出しでエラーが投げられる
      await rejectedPromise.catch(() => {});
      expect(() => use(rejectedPromise)).toThrow("Immediate error");
    });

    it("should work with different promise types", async () => {
      interface User {
        id: number;
        name: string;
      }

      const { promise, resolve } = Promise.withResolvers<User>();

      // 最初の呼び出しでPromiseが投げられる
      expect(() => use(promise)).toThrow();

      // 型付きでPromiseを解決
      const userData: User = { id: 1, name: "Alice" };
      resolve(userData);

      await promise;
      const result = use<User>(promise);
      expect(result).toEqual(userData);
      expect(result.name).toBe("Alice");
    });

    it("should handle multiple calls to the same promise", async () => {
      const { promise, resolve } = Promise.withResolvers<number>();

      // 最初の呼び出し
      expect(() => use(promise)).toThrow();

      // 同じPromiseに対する2回目の呼び出しでもPromiseが投げられる
      expect(() => use(promise)).toThrow();

      resolve(42);
      await promise;

      // 解決後は何度呼んでも同じ値が返される
      expect(use(promise)).toBe(42);
      expect(use(promise)).toBe(42);
    });

    it("should preserve promise state across multiple calls", async () => {
      const { promise, resolve } = Promise.withResolvers<string>();

      // pending状態
      let thrown: unknown;
      try {
        use(promise);
      } catch (err) {
        thrown = err;
      }
      expect(thrown).toBe(promise);

      resolve("test value");
      await promise;

      // fulfilled状態 - 複数回呼んでも同じ値
      expect(use(promise)).toBe("test value");
      expect(use(promise)).toBe("test value");
    });
  });
});
