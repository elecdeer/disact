import { describe, expect, it } from "vitest";
import { runInContext } from "./context";
import { createPromiseStateManager, usePromise } from "./promiseCache";

describe("promiseCache", () => {
  describe("Promise state management", () => {
    it("should track promise state in context", () => {
      const manager = createPromiseStateManager();
      const context = { promiseStateManager: manager };
      const { promise, resolve } = Promise.withResolvers<string>();

      let promiseState: any;

      runInContext(context, () => {
        try {
          usePromise(promise);
        } catch (thrownPromise) {
          // Promise が投げられることを確認
          expect(thrownPromise).toBe(promise);
        }

        // Promise の状態が管理されていることを確認
        promiseState = manager.getState(promise);
      });

      expect(promiseState?.status).toBe("pending");

      // Promise を解決
      resolve("resolved value");

      // 次のレンダリングで解決済みの値が返されることを確認
      return promise.then(() => {
        let result: string;
        runInContext(context, () => {
          result = usePromise(promise);
        });
        expect(result!).toBe("resolved value");
      });
    });

    it("should handle promise rejection", () => {
      const manager = createPromiseStateManager();
      const context = { promiseStateManager: manager };
      const { promise, reject } = Promise.withResolvers<string>();

      // 最初の呼び出しでPromiseが投げられる
      runInContext(context, () => {
        try {
          usePromise(promise);
        } catch (thrownPromise) {
          expect(thrownPromise).toBe(promise);
        }
      });

      // Promiseを拒否
      reject(new Error("Test error"));

      // 次のレンダリングでエラーが投げられることを確認
      return promise.catch(() => {
        runInContext(context, () => {
          expect(() => usePromise(promise)).toThrow("Test error");
        });
      });
    });

    it("should return fulfilled value for already resolved promises", () => {
      const manager = createPromiseStateManager();
      const context = { promiseStateManager: manager };
      const resolvedPromise = Promise.resolve("immediate value");

      // 最初の呼び出しでPromiseが投げられる
      runInContext(context, () => {
        try {
          usePromise(resolvedPromise);
        } catch (thrownPromise) {
          expect(thrownPromise).toBe(resolvedPromise);
        }
      });

      // Promise解決後の呼び出しで値が返される
      let result: string;
      return resolvedPromise.then(() => {
        runInContext(context, () => {
          result = usePromise(resolvedPromise);
        });
        expect(result).toBe("immediate value");
      });
    });

    it("should throw error for already rejected promises", () => {
      const manager = createPromiseStateManager();
      const context = { promiseStateManager: manager };
      const rejectedPromise = Promise.reject(new Error("Immediate error"));

      // 最初の呼び出しでPromiseが投げられる
      runInContext(context, () => {
        try {
          usePromise(rejectedPromise);
        } catch (thrownPromise) {
          expect(thrownPromise).toBe(rejectedPromise);
        }
      });

      // Promise拒否後の呼び出しでエラーが投げられる
      return rejectedPromise.catch(() => {
        runInContext(context, () => {
          expect(() => usePromise(rejectedPromise)).toThrow("Immediate error");
        });
      });
    });

    it("should work with different promise types", () => {
      const manager = createPromiseStateManager();
      const context = { promiseStateManager: manager };

      interface User {
        id: number;
        name: string;
      }

      const { promise, resolve } = Promise.withResolvers<User>();

      // 最初の呼び出し
      runInContext(context, () => {
        try {
          usePromise(promise);
        } catch (thrownPromise) {
          expect(thrownPromise).toBe(promise);
        }
      });

      // 型付きでPromiseを解決
      const userData: User = { id: 1, name: "Alice" };
      resolve(userData);

      let result: User;
      return promise.then(() => {
        runInContext(context, () => {
          result = usePromise<User>(promise);
        });
        expect(result).toEqual(userData);
        expect(result.name).toBe("Alice");
      });
    });
  });

  describe("usePromise without context", () => {
    it("should throw error when called outside of context", () => {
      const { promise } = Promise.withResolvers<string>();

      expect(() => usePromise(promise)).toThrow(
        "usePromise can only be called during rendering with a context that has promiseStateManager",
      );
    });

    it("should throw error when context lacks promiseStateManager", () => {
      const contextWithoutManager = { someOtherData: "test" };

      runInContext(contextWithoutManager, () => {
        const { promise } = Promise.withResolvers<string>();

        expect(() => usePromise(promise)).toThrow(
          "usePromise can only be called during rendering with a context that has promiseStateManager",
        );
      });
    });
  });
});
