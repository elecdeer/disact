import { describe, expect, it } from "vitest";
import { createRerenderSignal } from "./rerenderSignal";

describe("createRerenderSignal", () => {
  describe("requestRerender", () => {
    it("再レンダリング要求をマークする", () => {
      const signal = createRerenderSignal();
      expect(signal.shouldRerender()).toBe(false);

      signal.requestRerender();
      expect(signal.shouldRerender()).toBe(true);
    });

    it("clearRerenderRequestで再レンダリング要求をクリアできる", () => {
      const signal = createRerenderSignal();
      signal.requestRerender();
      expect(signal.shouldRerender()).toBe(true);

      signal.clearRerenderRequest();
      expect(signal.shouldRerender()).toBe(false);
    });

    it("waitForRerenderTriggerを即座に解決する", async () => {
      const signal = createRerenderSignal();
      signal.requestRerender();

      const start = Date.now();
      await signal.waitForRerenderTrigger();
      const elapsed = Date.now() - start;

      // 即座に解決されるべき
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("trackPromise", () => {
    it("未解決のPromiseを追跡すると shouldRerender が true になる", () => {
      const signal = createRerenderSignal();
      const promise = new Promise(() => {});

      signal.trackPromise(promise);
      expect(signal.shouldRerender()).toBe(true);
    });

    it("Promiseが解決されると waitForRerenderTrigger が解決される", async () => {
      const signal = createRerenderSignal();
      let resolve: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });

      signal.trackPromise(promise);

      const waitPromise = signal.waitForRerenderTrigger();

      // まだ解決されていない
      let resolved = false;
      waitPromise.then(() => {
        resolved = true;
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(resolved).toBe(false);

      // Promiseを解決
      resolve!();
      await waitPromise;
      expect(resolved).toBe(true);
    });

    it("複数のPromiseを追跡できる", () => {
      const signal = createRerenderSignal();
      const promise1 = new Promise(() => {});
      const promise2 = new Promise(() => {});

      signal.trackPromise(promise1);
      signal.trackPromise(promise2);

      expect(signal.shouldRerender()).toBe(true);
      expect(signal.areAllPromisesResolved()).toBe(false);
    });

    it("全てのPromiseが解決されると areAllPromisesResolved が true になる", async () => {
      const signal = createRerenderSignal();
      let resolve1: () => void;
      let resolve2: () => void;
      const promise1 = new Promise<void>((r) => {
        resolve1 = r;
      });
      const promise2 = new Promise<void>((r) => {
        resolve2 = r;
      });

      signal.trackPromise(promise1);
      signal.trackPromise(promise2);

      expect(signal.areAllPromisesResolved()).toBe(false);

      resolve1!();
      await Promise.resolve();
      expect(signal.areAllPromisesResolved()).toBe(false);

      resolve2!();
      await Promise.resolve();
      expect(signal.areAllPromisesResolved()).toBe(true);
    });
  });

  describe("trackPromises", () => {
    it("複数のPromiseを一度に追跡できる", () => {
      const signal = createRerenderSignal();
      const promises = [new Promise(() => {}), new Promise(() => {}), new Promise(() => {})];

      signal.trackPromises(promises);
      expect(signal.shouldRerender()).toBe(true);
    });
  });

  describe("waitForRerenderTrigger", () => {
    it("手動要求があれば即座に解決される", async () => {
      const signal = createRerenderSignal();
      signal.requestRerender();

      const start = Date.now();
      await signal.waitForRerenderTrigger();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });

    it("Promise解決を待機できる", async () => {
      const signal = createRerenderSignal();
      let resolve: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });

      signal.trackPromise(promise);

      const waitPromise = signal.waitForRerenderTrigger();
      let resolved = false;
      waitPromise.then(() => {
        resolved = true;
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(resolved).toBe(false);

      resolve!();
      await waitPromise;
      expect(resolved).toBe(true);
    });

    it("再レンダリング要求も未解決Promiseもない場合は即座に解決される", async () => {
      const signal = createRerenderSignal();

      const start = Date.now();
      await signal.waitForRerenderTrigger();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("複合シナリオ", () => {
    it("手動要求とPromise追跡を組み合わせて使用できる", async () => {
      const signal = createRerenderSignal();
      let resolve: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });

      signal.trackPromise(promise);
      expect(signal.shouldRerender()).toBe(true);

      // 手動要求を追加
      signal.requestRerender();
      expect(signal.shouldRerender()).toBe(true);

      // 手動要求をクリア
      signal.clearRerenderRequest();
      // まだPromiseが未解決なので true
      expect(signal.shouldRerender()).toBe(true);

      // Promiseを解決
      resolve!();
      await Promise.resolve();
      // 全て解決されたので、再レンダリング要求がなければ false
      expect(signal.shouldRerender()).toBe(false);
    });

    it("Promise拒否時も再レンダリングトリガーが発火する", async () => {
      const signal = createRerenderSignal();
      let reject: (reason: Error) => void;
      const promise = new Promise<void>((_, r) => {
        reject = r;
      });

      signal.trackPromise(promise);

      const waitPromise = signal.waitForRerenderTrigger();
      let resolved = false;
      waitPromise.then(() => {
        resolved = true;
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(resolved).toBe(false);

      // Promiseを拒否
      reject!(new Error("test error"));
      await waitPromise;
      expect(resolved).toBe(true);
    });
  });
});
