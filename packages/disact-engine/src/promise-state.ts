import { getCurrentContext } from "./context-manager";

/**
 * Promise の状態を表す型
 */
export interface PromiseState<T = unknown> {
  status: "pending" | "fulfilled" | "rejected";
  value?: T;
  reason?: unknown;
}

/**
 * Promise の状態を管理するマネージャー
 */
export interface PromiseStateManager {
  getState<T>(promise: Promise<T>): PromiseState<T> | undefined;
  setState<T>(promise: Promise<T>, state: PromiseState<T>): void;
}

/**
 * Promise 状態管理マネージャーを作成する
 */
export const createPromiseStateManager = (): PromiseStateManager => {
  // WeakMap を使ってPromise オブジェクトと状態を関連付け
  const stateMap = new WeakMap<Promise<unknown>, PromiseState<unknown>>();

  return {
    getState<T>(promise: Promise<T>): PromiseState<T> | undefined {
      return stateMap.get(promise) as PromiseState<T> | undefined;
    },

    setState<T>(promise: Promise<T>, state: PromiseState<T>): void {
      stateMap.set(promise, state);
    },
  };
};

/**
 * Context から Promise 状態管理マネージャーを取得する
 */
const getPromiseStateManager = (): PromiseStateManager => {
  let context: { promiseStateManager?: PromiseStateManager } | undefined;

  try {
    context = getCurrentContext<{
      promiseStateManager?: PromiseStateManager;
    }>();
  } catch {
    throw new Error(
      "usePromise can only be called during rendering with a context that has promiseStateManager",
    );
  }

  if (!context || !context.promiseStateManager) {
    throw new Error(
      "usePromise can only be called during rendering with a context that has promiseStateManager",
    );
  }

  return context.promiseStateManager;
};

/**
 * Context から Promise Tracker を取得する
 */
const getPromiseTracker = (): PromiseTracker => {
  let context: { __promiseTracker?: PromiseTracker } | undefined;

  try {
    context = getCurrentContext<{
      __promiseTracker?: PromiseTracker;
    }>();
  } catch {
    throw new Error(
      "Promise tracking can only be used during rendering with a context that has __promiseTracker",
    );
  }

  if (!context || !context.__promiseTracker) {
    throw new Error(
      "Promise tracking can only be used during rendering with a context that has __promiseTracker",
    );
  }

  return context.__promiseTracker;
};

/**
 * Context ベースの Promise 状態管理を使用する use フック
 * Promise が解決されていない場合はそのPromise を投げ、
 * 解決されている場合は結果を返す
 */
export const usePromise = <T>(promise: Promise<T>): T => {
  const manager = getPromiseStateManager();

  // 既存の状態を確認
  const state = manager.getState(promise);

  if (state) {
    // 既に状態が管理されている場合
    if (state.status === "fulfilled") {
      return state.value as T;
    }

    if (state.status === "rejected") {
      throw state.reason;
    }

    // pending の場合は Promise を投げる
    throw promise;
  }

  // まず pending 状態として初期化
  const pendingState: PromiseState<T> = { status: "pending" };
  manager.setState(promise, pendingState);

  // Promise の状態を非同期で追跡開始
  promise.then(
    (value) => {
      manager.setState(promise, { status: "fulfilled", value });
    },
    (reason) => {
      manager.setState(promise, { status: "rejected", reason });
    },
  );

  // Suspense バウンダリにキャッチされるように Promise を投げる
  throw promise;
};

/**
 * レンダリング中のPromise追跡機能
 */
export interface PromiseTracker {
  trackPromises(promises: Promise<unknown>[]): void;
  areAllResolved(): boolean;
  getPendingPromises(): Promise<unknown>[];
  waitForAnyResolution(): Promise<void>;
  hasPendingPromises(): boolean;
}

/**
 * Promise の追跡機能を作成する
 * レンダリング中に投げられたPromiseの解決状況を管理
 */
export const createPromiseTracker = (): PromiseTracker => {
  const settledPromises = new Set<Promise<unknown>>();
  const allPromises: Promise<unknown>[] = [];

  const trackPromise = (promise: Promise<unknown>) => {
    if (!allPromises.includes(promise)) {
      allPromises.push(promise);
    }
    promise.then(
      () => settledPromises.add(promise),
      () => settledPromises.add(promise),
    );
  };

  const trackPromises = (promises: Promise<unknown>[]) => {
    for (const promise of promises) {
      trackPromise(promise);
    }
  };

  const areAllResolved = (): boolean => {
    return allPromises.every((promise) => settledPromises.has(promise));
  };

  const getPendingPromises = (): Promise<unknown>[] => {
    return allPromises.filter((promise) => !settledPromises.has(promise));
  };

  const waitForAnyResolution = async (): Promise<void> => {
    const pendingPromises = getPendingPromises();
    if (pendingPromises.length > 0) {
      await Promise.race(pendingPromises);
    }
  };

  const hasPendingPromises = (): boolean => {
    return getPendingPromises().length > 0;
  };

  return {
    trackPromises,
    areAllResolved,
    getPendingPromises,
    waitForAnyResolution,
    hasPendingPromises,
  };
};
